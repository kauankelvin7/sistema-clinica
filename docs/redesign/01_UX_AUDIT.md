# Auditoria independente de UX e arquitetura — Gate 0

Data: 08/10/2026. Auditor: papel Astra, antes de alterações de implementação. Base inspecionada: `7d3216feabc79ca7a7fb0db47698dd85e0bb080d`, branch `design/clinical-glass-fastflow`. Contrato: GOAL_SISTEMA_CLINICA_FRONTEND_V2 fornecido pelo usuário. Este documento registra inspeção estática; não transforma resultados históricos em testes executados. Capturas e testes atuais serão confrontados na revisão por marcos/final.

## Parecer sobre o plano

Plano recebido de Sol: G1 protege edição/SW/limpeza, data local, sessão e identidade de geração; G2 compacta shell e formulário com tokens e colunas por largura útil; G3 cobre módulos e traduções. Direção adequada, condicionada às correções e retestes abaixo. Não há aprovação de implementação neste gate.

A homologação deve permanecer no mesmo workspace, com Paciente, Atestado e Médico visíveis conforme espaço útil; colapsar somente acessórios. Nome/busca e dados do atendimento devem anteceder descrições e atalhos. Preservar tabulação e controles de 44 px, mesmo no modo compacto. Botão principal único gera HTML, abre prévia e dispara automaticamente a impressão pronta: nenhum clique intermediário. A prévia serve para revisar e repetir manualmente. Não substituir por wizard.

## Achados antes de implementar

| ID | Nível | Evidência na base | Reprodução / efeito | Correção exigida e reteste |
|---|---|---|---|---|
| A01 | P1 | `frontend/src/main.tsx`, listener `controllerchange`; `public/sw.js`, `skipWaiting()` na instalação | Atualizar SW durante preenchimento provoca `window.location.reload()`, descartando atendimento/modelo em memória. | Notificar atualização e aplicar em momento seguro, considerando formulário, rascunho de modelo, preenchimento, request pendente e prévia. Exercitar SW real ou declarar limitação; evento simulado sozinho não prova instalação/offline. |
| A02 | P1 | `App.tsx`, `handleAuthLogout` e `handleGenerateHTML` | 401 muda para login sem zerar `formData`; novo login reapresenta dados anteriores. Resposta lenta de geração pode escrever preview após logout/401. | Zerar estado clínico na invalidação e impedir respostas da sessão anterior via cancelamento/epoch. Testar 401 + novo login e logout durante geração lenta. Não alterar contrato backend. |
| A03 | P1 | `App.tsx`, `handleClear` | Um clique em Limpar perde todos os campos, sem confirmação. | Confirmação somente quando há edição; cancelar preserva tudo; confirmar reinicia com data local; limpar vazio continua imediato. |
| A04 | P1 | `App.tsx`, `getDefaultFormData` | À noite no Brasil, `toISOString().split('T')[0]` usa o dia seguinte em UTC. | Calendário local por componentes, teste com timezone America/Sao_Paulo em ambas as bordas do dia e após limpar. |
| A05 | P1 | `DocumentPreviewModal.tsx`, `autoPrintFiredRef`, efeito de reset e timeout de 300 ms | Flag vive no componente, reset depende de `isOpen/htmlContent`, timeout não tem cleanup; remount e troca rápida de documento não possuem identidade persistente da geração. | Identidade opaca por sucesso de geração, independente do HTML, guard fora do remount e readiness real. Testar onLoad repetido, rerender, remount/StrictMode, fechar antes de pronto, duas gerações com HTML idêntico, print manual e fallback; não apagar asserções existentes. |
| A06 | P1 | `DocumentModels.tsx`, efeito de `selected`, botão Voltar e `edit` | Novo modelo/edição/409 podem ser abandonados e sobrescritos sem guarda. Clique em Modelos muda `selected`, descartando modo de edição. | Guarda coerente em todas as saídas que descartam rascunho; cancelar conserva name/title/body/labels/values. Não confirmar navegação que preserva dados. Testar também 409 e menu lateral. |
| A07 | P2 | `AppShell.css`, hero 200 px em desktop, status/atalhos antes dos campos; breakpoint 1440 para três colunas | 1280 px usa duas colunas e médico ocupa outra linha; hero/atalhos consomem espaço prioritário. | Hero compacto, atalhos recolhíveis, grid por largura útil, sidebar 176–192 recolhível. Medir campo inicial/final visível e rolagem em 1280×800/1440×900 sem reduzir alvos. |
| A08 | P2 | `App.tsx` validação + `ValidationModal.tsx` | Modal exige fechar e procurar campo; faltantes são strings pt-BR sem destino/foco. | Pendências vinculadas aos campos e foco no primeiro erro após fechamento, sem sequência de modais. Manter cenário legado e testar tradução/foco. |
| A09 | P2 | `AutocompleteInput.tsx`, efeito de filtro | Sem `onFocus`, busca não reabre ao retornar ao campo sem editar; vazio fica escondido; seleção pode reabrir lista por efeito de value. | Testar foco/blur/Tab/ArrowDown/Enter/Escape e repetir consulta sem redigitar. Estado vazio visível quando pertinente, sem popup persistente ao perder foco. |
| A10 | P2 | Preview, diretório, formulários e validação contêm literais pt-BR; Header duplica seletor de paleta | Trocar en/es mantém mensagens e aria-labels em português; toolbar ocupa espaço com configuração repetida. | Inventário de strings de usuário, tradução de estados/labels/erros e paleta apenas nas configurações, preservando chaves de payload. |
| A11 | P2 | `.clinic-shell .section-shell` blur 12 px; glass/fallback parcial no CSS | Campos críticos herdam superfícies filtradas; fallback não cobre todo glass. | Superfícies críticas opacas; blur leve em navegação/dialog; fallback sem transparência e reduced-motion cobrindo novos elementos; contraste calculado de tokens e amostra computada. |
| A12 | P2 | E2E linha base `serviceWorkers: 'block'`, auto-print verificado apenas após 400 ms | Suíte histórica não prova atualização real do SW, repetição de load/remount/fallback e modelo não assegura todas as invariantes de print. | Adicionar cenários adversariais, distinguir mock de browser/impressão física. Não reportar WebKit, telefone físico, print físico ou offline completo sem execução. |
| A13 | P3 | README raiz e frontend citam histórico/dashboard/React Hook Form e resultados antigos | Documentação não reflete produto corrente e pode induzir expansão sem backend. | Considerar código e contratos recentes como fonte operacional; não inventar módulos para preencher sidebar. |

P0 = incidente crítico; P1 = risco alto/perda/contrato bloqueante; P2 = problema funcional ou de UX relevante; P3 = melhoria/documentação. Os P1 acima são achados de análise do código com reprodução proposta, não alegação de incidente em produção.

## Invariantes arquiteturais para a revisão

- Payload `/api/generate-html`, datas/CPF/RG/CRM/CRO/RMS/UF/CID/retorno e timeouts devem permanecer. Não mudar critérios de duplicidade oportunisticamente.
- `name` interno e `title` emitido são estados independentes; fallback legado exclusivamente conforme contrato. Preview assistido de modelo deve ser texto escapado, sem HTML arbitrário e sem chamadas a cada tecla.
- Preview mantém `srcDoc`, `sandbox="allow-same-origin allow-modals"`, `referrerPolicy="no-referrer"`; nenhum `allow-scripts`. Fallback e download continuam utilizáveis. Print bloqueado não autoriza loop automático.
- Geração não espera persistência no diretório. Proteção de dirty não pode salvar PII em storage novo. Logout/401 invalidam também trabalho assíncrono.
- Evitar reescrever cache/outbox/auth/router para obter melhorias visuais. Flags de estado e guards devem ter dono explícito; temporizadores/listeners precisam de cleanup.
- Contagem e tempos serão medidos com fixtures sintéticas no mesmo ambiente. Não assumir ganho a partir de redução de CSS/altura.

## Roteiro de aceite adversarial

1. Atendimento por teclado desde nome/busca até impressão, preservando campos não relacionados na seleção. Capturar contagem de cliques/teclas e tempos de feedback/print; exigir nenhum clique novo no caminho válido.
2. Gerar com request lenta; tentar ação duplicada; trocar idioma/tema/layout; repetir load de iframe; fechar antes de pronto; gerar HTML idêntico novamente. Cada sucesso válido deve ter uma tentativa automática e manual posterior disponível.
3. Formulário/modelo sujos: Limpar cancelado, navegação e atualização SW; 409 conserva rascunho. Logout/401 durante request não restaura PII nem prévia após novo login.
4. 320/375/390/430/768/1024/1280/1440/1920 px, zoom 200%, teclado, nested dialogs, retorno de foco, conteúdo sob sticky. Browser overflow não substitui leitura de screenshots.
5. Cinco paletas claro/escuro e pt/en/es; reduced-motion/transparency; contraste de texto/estado/foco; nenhum controle sem ação.

## Limites e fontes desta revisão

Leitura direta de contrato fornecido, README raiz/frontend, package/CI, quatro contratos/relatório de frontend/modelos, App, AppShell/CSS, Header, ActionButtons, DocumentModels, Preview, Dialog, Patient/Doctor/Certificate, Autocomplete, Field, DirectoryStatus, Validation, main, SW e E2E/configuração. Inventário inicial de Luna confirma SPA sem router, diretórios/cache, consulta oficial e testes existentes. Fontes remanescentes de módulos/serviços/assets serão aprofundadas nos respectivos marcos. Nenhum teste browser, medição visual/contraste ou benchmark foi executado por Astra neste primeiro documento. Não existe conclusão de release; aguardar revisão independente da implementação e retestes.

### Complemento executado ainda sobre a base de implementação

Após o registro acima, Astra executou dois probes independentes em Chromium headless, usando Vite local na porta 4181, mocks de todas as APIs e dados sintéticos:

- **A02 reproduzido:** resposta HTTP 401 ao atualizar diretório, seguida de novo login, preservou o nome sintético da sessão anterior. Log: `/workspace/clinical-evidence/astra/baseline-adversarial.json`; script: `adversarial.mjs` no mesmo diretório.
- **A05 reproduzido:** componente Preview real montado sob StrictMode via Vite; primeira carga contou 1 impressão, repetição de load manteve 1, remount com mesma identidade de geração aumentou para 2. Log: `/workspace/clinical-evidence/astra/baseline-preview-harness.json`; script: `preview-harness.mjs`. A base ainda ignora a prop generationId, evidenciando ausência do contrato proposto.
- Primeira tentativa de probe usou o servidor E2E compartilhado 4173, que encerrou durante o teste: timeout, sem conclusão. Reteste usou servidor próprio 4181 e concluiu. Dois erros iniciais de adaptação do harness ESM (`default` de React/ReactDOM) foram corrigidos antes da execução válida; não eram falhas da aplicação.

Leitura adicional de `useClinicDirectory` detectou extensão do A02: inativar o hook não invalida refresh/flush pendentes; resposta tardia pode voltar a persistir cache após logout. Informado a Sol com exigência de reteste IndexedDB. Módulos de diretório, consulta, configurações, login, API/model services e hooks foram agora lidos. Skills instaladas no projeto lidas: frontend-design, vercel-react-best-practices e web-design-guidelines com PINNED_GUIDELINES; regras de framework SSR/Next não se aplicam à SPA React 18. Contrato de produto prevalece sobre recomendações genéricas como hero grande, router/deep links e troca de fonte.

A02 também foi reproduzido em uma segunda execução independente: GET de diretório retido, logout concluído e tela de login visível; liberar resposta tardia repopulou IndexedDB com 1 paciente sintético. Evidência: `/workspace/clinical-evidence/astra/baseline-directory-race.json`, script `directory-race.mjs`. Reteste exigido: `cachePresent=false` e contagem 0 após a mesma sequência.

Inspeção visual real das capturas baseline `workspace-1440.png` e `workspace-375.png` em `/workspace/clinical-evidence/baseline/screenshots`: em 375×900 nenhum input aparece na primeira dobra antes da barra sticky; em 1440×900 documento/cargo/empresa/registro estão abaixo da barra. A07 confirmado visualmente. Copy do hero orienta “três etapas” e “revise ... antes de imprimir”, incoerente com formulário único e autoimpressão; substituir por instrução coerente sem prometer revisão antes da impressão automática.
