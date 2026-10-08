# Matriz de testes — Clinical Glass

Estado de referência inicial: commit `7d3216feabc79ca7a7fb0db47698dd85e0bb080d`, branch `design/clinical-glass-fastflow`. A implementação atual tem alterações locais ainda não integradas. A matriz distingue cobertura observada, execução crítica concluída e suíte completa ainda pendente.

## Cobertura encontrada no repositório

| Área | Evidência automatizada existente | Limites que continuam a exigir evidência |
|---|---|---|
| Login, lembrar-me, logout e limpeza após 401 | `frontend/e2e/frontend.spec.ts`: `auth, remember_me, and logout`; `401 directory response ends session and clears local directory` | Matriz real de navegadores/ambientes e revisão do fluxo final após alterações. |
| Seleção e busca de pacientes/médicos | `patient and doctor autocomplete, modal search, and filters`; seleção de teclado em `keyboard selection, dialog focus, and mobile drawer preserve form state` | Navegação por teclado em todos os filtros e preservação de todos os campos em cenários adicionais. |
| Validação e geração do atestado | `validation, exact generation payload, preview, single auto-print, and download` | Fuso local brasileiro e bordas de data, limpeza com/cancelamento de confirmação e formulário sujo com atualização do SW. |
| Prévia e impressão | O teste de geração existente verifica prévia, uma chamada automática de impressão e download HTML. O componente mantém botão manual e fullscreen. | Repetição por remount/StrictMode/onLoad e fallback de impressão bloqueada precisam de cobertura explícita e execução após mudanças. |
| Cache/offline e preferências | `preferences persist and directory cache survives offline refresh; empty/error states render`; casos de configurações cobrem tema e paleta após reload | Atualização SW/controllerchange sem perda de formulário e cenários de fila/cache desatualizado. |
| Consultas profissionais | `official CRM, CRO, and RMS consultations retain targets and external fallback` | Confirmar que a copy não afirma validação quando só abre a fonte oficial. |
| Modelos | `custom models save, reload, fill CPF, emit, and preserve homologation`; teste de responsividade para lista/editor/preenchimento | Conflito 409 preservando rascunho, distinção independente `name`/`title` em edição, e autoimpressão no fluxo de modelos. |
| Layout e responsividade | Testes de overflow em sete larguras (375, 430, 768, 1024, 1280, 1440, 1920), cinco paletas e dois temas; login, overlays e modelos em múltiplas larguras; sticky actions | 320px, 390px e zoom 200% não aparecem na lista de viewports do E2E atual; inspeção visual/contraste e reduced-motion não são substituídos por esses testes. |
| Backend | `tests/test_api_smoke.py` cobre health, auth, CORS, sessão e aliases de geração; `tests/test_document_models.py` cobre auth/CORS, persistência/revisão, escape, validação e legado | Execução em banco temporário/fixtures e resultado atual pendentes. |

## Novos cenários fastflow

Os sete cenários abaixo foram adicionados em `frontend/e2e/frontend.spec.ts` e executados em Chromium e Firefox (14 execuções no total, todas aprovadas no recorte crítico):

| Cenário | Cobertura |
|---|---|
| clear confirms only edited work and focuses first missing field | Confirmação de limpeza apenas para formulário modificado, preservação ao cancelar e foco no primeiro campo pendente. |
| local calendar date respects Brazilian day boundaries | Data padrão pelo calendário local em limites de fuso brasileiro. |
| one automatic print per identical HTML generation, rerender, load and manual retry | Uma tentativa automática por geração HTML, sem duplicata por rerender/reload; reimpressão manual. |
| 401 and delayed generation cannot restore data in the next session | Resposta tardia e 401 não repõem dados na sessão seguinte. |
| service worker controllerchange preserves dirty work and exposes safe update | Trabalho editado sobrevive à atualização e controle de aplicar atualização fica seguro. |
| template draft, separate titles, assisted fields, search and sort remain safe | Rascunho preservado, `name`/`title` separados, campos assistidos e busca/ordenação de modelos. |
| languages, collapse, density, reduced effects and 200 percent layout | Idiomas, recolhimento, densidade, redução de efeitos e layout em zoom 200%. |

O recorte crítico também executou os dois testes já existentes de consulta CRM/CRO/RMS e modelos; por isso `critical.log` reporta 18 execuções, 18 aprovadas (9 casos por navegador). Isso não equivale à suíte E2E integral.

## Comandos configurados

Frontend (`cd frontend`): `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run typecheck:e2e`, `npm run build`, `npm run test:e2e`, `npm audit`. O `package.json` não define script `typecheck`; build executa `tsc` antes do Vite. O Playwright está configurado para Chromium e Firefox, um worker, traces em falhas e service workers bloqueados durante E2E.

Backend/CI: `python -m py_compile api/index.py core/db_manager.py core/rate_limit.py core/auth.py core/crypto.py`, Bandit em `api backend core`, `pip-audit -r requirements.txt` e `pytest -q tests`. O workflow `.github/workflows/quality-security.yml` também instala Chromium e Firefox para a suíte frontend.

## Registro de execução

| Etapa | Resultado | Evidência |
|---|---|---|
| Baseline antes da implementação | Pendente — evidência anterior à mudança não encontrada nos artefatos consultados | Não informar como executado. |
| G3: lint, typecheck, typecheck E2E e build | Aprovados segundo confirmação do Sol | `/workspace/clinical-evidence/final/lint.log`, `typecheck.log`, `typecheck-e2e.log`, `build.log`. Build: Vite 8.3.2; JS 465.13 kB (gzip 130.62 kB), CSS 70.30 kB (gzip 12.07 kB). Não é medida final de bundle, conforme Sol. |
| Recorte E2E crítico: 9 cenários × 2 navegadores | 18/18 aprovados | `/workspace/clinical-evidence/final/critical.log`; Chromium e Firefox; inclui os sete casos fastflow e consultas/modelos. |
| Suíte E2E integral | Pendente; nova execução em andamento após correções | `e2e-first.log` é execução parcial/interrompida e não serve como resultado final. |
| Bandit e pip-audit backend | Aprovados, sem achados relatados | `/workspace/clinical-evidence/final/bandit.log` vazio (Sol confirmou saída de sucesso); `pip-audit.log`: “No known vulnerabilities found”. A suíte pytest ainda não tem evidência final consultada. |
| npm audit / dependências frontend | Triagem em andamento; bloqueio de release aberto | `npm-audit-runtime.json` registra zero vulnerabilidades no conjunto runtime. O audit geral inicial encontrou 14 vulnerabilidades em dependências de desenvolvimento (2 moderadas, 12 altas); após `npm audit fix`, restavam 13. Sol está migrando dependências de ferramentas; aguardar nova auditoria antes de atualizar. |
| Auditoria visual/acessibilidade manual | Pendente | Não informado neste inventário. |
| Navegadores físicos/WebKit | Pendente; não declarar validado sem execução real | Não informado neste inventário. |

