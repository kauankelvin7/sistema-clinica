"""Rotas autenticadas para modelos próprios, sem alterar a homologação."""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator

from core.auth import require_auth
from core.rate_limit import rate_limit
from core.document_models import field_keys, get_model, list_models, render_model, save_model

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/document-models', dependencies=[Depends(rate_limit), Depends(require_auth)])


class ModelField(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    key: str = Field(pattern=r'^[a-z][a-z0-9_]{0,39}$')
    label: str = Field(min_length=1, max_length=80)


class ModelInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=20000)
    fields: list[ModelField] = Field(default_factory=list, max_length=30)

    @model_validator(mode='after')
    def validate_fields(self):
        keys = field_keys(self.body)
        supplied = [field.key for field in self.fields]
        if len(set(supplied)) != len(supplied) or set(keys) != set(supplied):
            raise ValueError('Os campos devem corresponder aos marcadores do texto, sem duplicatas.')
        return self


class ModelUpdate(ModelInput):
    revision: int = Field(ge=1)


class ModelGeneration(BaseModel):
    model_config = ConfigDict(extra='forbid')
    revision: int = Field(ge=1)
    values: dict[str, str] = Field(max_length=30)

    @model_validator(mode='after')
    def validate_values(self):
        if any(len(value) > 2000 for value in self.values.values()):
            raise ValueError('Cada campo aceita até 2000 caracteres.')
        return self


def unavailable():
    logger.warning('Operação com modelos de documentos indisponível.')
    return HTTPException(status_code=503, detail='Não foi possível acessar os modelos. Tente novamente.')


@router.get('')
def index():
    try:
        return list_models()
    except Exception:
        raise unavailable() from None


@router.post('', status_code=201)
def create(data: ModelInput):
    try:
        return save_model(data.model_dump())
    except Exception:
        raise unavailable() from None


@router.post('/{model_id}')
def update(model_id: UUID, data: ModelUpdate):
    try:
        result = save_model(data.model_dump(exclude={'revision'}), str(model_id), data.revision)
    except Exception:
        raise unavailable() from None
    if result is None:
        raise HTTPException(status_code=409, detail='O modelo mudou. Seu rascunho foi mantido; recarregue a lista antes de editar novamente.')
    return result


@router.post('/{model_id}/generate', response_class=HTMLResponse)
def generate(model_id: UUID, data: ModelGeneration):
    try:
        model = get_model(str(model_id))
    except Exception:
        raise unavailable() from None
    if not model:
        raise HTTPException(status_code=404, detail='Modelo não encontrado.')
    if model['revision'] != data.revision:
        raise HTTPException(status_code=409, detail='O modelo mudou. Reabra-o antes de emitir.')
    try:
        content = render_model(model, data.values)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from None
    except Exception:
        raise unavailable() from None
    return HTMLResponse(content)
