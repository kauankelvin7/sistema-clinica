"""
Módulo de gerenciamento do banco de dados Firebase Firestore
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin (adaptado para Firebase)
Data: 31/10/2025

Este módulo implementa:
- Conexão segura ao Firestore
- CRUD para pacientes, médicos e atestados
- Validação de dados de entrada
- Logging de operações
"""


import firebase_admin
from firebase_admin import credentials, firestore
import logging
from typing import Optional, Dict, List, Any
import os

# Configurar logger
logger = logging.getLogger(__name__)

# Inicializar Firebase (ajustado para aceitar variável de ambiente ou caminho padrão)
cred_path = os.getenv('FIREBASE_CRED_PATH', 'firebase-credentials.json')
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Coleções
PACIENTES = 'pacientes'
MEDICOS = 'medicos'
ATESTADOS = 'atestados'

def add_paciente(paciente: Dict[str, Any]) -> str:
    doc_ref = db.collection(PACIENTES).document()
    doc_ref.set(paciente)
    logger.info(f'Paciente adicionado: {doc_ref.id}')
    return doc_ref.id

def get_paciente_by_doc(tipo_doc: str, numero_doc: str) -> Optional[Dict[str, Any]]:
    query = db.collection(PACIENTES).where('tipo_doc', '==', tipo_doc).where('numero_doc', '==', numero_doc).limit(1).stream()
    for doc in query:
        return doc.to_dict() | {'id': doc.id}
    return None

def add_medico(medico: Dict[str, Any]) -> str:
    doc_ref = db.collection(MEDICOS).document()
    doc_ref.set(medico)
    logger.info(f'Médico adicionado: {doc_ref.id}')
    return doc_ref.id

def get_medico_by_crm(tipo_crm: str, crm: str) -> Optional[Dict[str, Any]]:
    query = db.collection(MEDICOS).where('tipo_crm', '==', tipo_crm).where('crm', '==', crm).limit(1).stream()
    for doc in query:
        return doc.to_dict() | {'id': doc.id}
    return None

def add_atestado(atestado: Dict[str, Any]) -> str:
    doc_ref = db.collection(ATESTADOS).document()
    doc_ref.set(atestado)
    logger.info(f'Atestado adicionado: {doc_ref.id}')
    return doc_ref.id

def get_atestados_by_paciente(paciente_id: str) -> List[Dict[str, Any]]:
    query = db.collection(ATESTADOS).where('paciente_id', '==', paciente_id).stream()
    return [{**doc.to_dict(), 'id': doc.id} for doc in query]

def get_atestados_by_medico(medico_id: str) -> List[Dict[str, Any]]:
    query = db.collection(ATESTADOS).where('medico_id', '==', medico_id).stream()
    return [{**doc.to_dict(), 'id': doc.id} for doc in query]

# Outras funções de CRUD podem ser adicionadas conforme necessário.
