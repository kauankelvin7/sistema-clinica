# Contrato da refatoração frontend

Data: 2026-10-02. Base: `7d94a6fab5055ab2c74db069f8ed0b36256bf7ba`. Branch: `refactor/frontend-design-system`.

## Ampliação autorizada

Após a migração visual, o usuário solicitou modelos próprios, persistência, preenchimento/emissão, menu e atalhos. Confirmou texto livre e CPF. A exceção aos limites abaixo fica restrita a novos contratos/tabela dos modelos descritos em `docs/document-models-contract.md`; contratos de homologação, diretório, autenticação e documento original continuam preservados. Também solicitou Inter e retirada das mensagens de segurança da interface. Não foi autorizada publicação ou merge.

## Auditoria e escopo real

O produto web é uma SPA React 18/TypeScript/Vite/Tailwind 3, sem router. `App.tsx` alterna sessão, login e homologação. Existem formulários de paciente, atestado e profissional; diretórios com busca/filtros/paginação; consulta externa CRM/CRO/RMS; validação; preview HTML com impressão/download/tela cheia; configurações de idioma, paleta, modo e instalação PWA. Não existem dashboard, relatórios ou histórico de atestados no frontend atual. Não serão inventados para preencher o mockup. O cliente desktop Python e os contratos originais de backend, banco e geração ficam fora das mudanças; a ampliação autorizada de modelos está descrita acima.

Estado: formulário em memória; preferências em localStorage; diretório/outbox em IndexedDB com TTL de 8 horas. `useClinicDirectory` sincroniza na entrada, reconexão e a cada 15 minutos visível/online. `api.ts` usa axios com cookies e encerra autenticação em 401. CID é catálogo local. PWA registra SW e possui cache de assets. Assets existentes: logos, ícones e manifest. CSS compartilhado já cobre campos, botões, cards e diretórios. Duplicações principais: estado de tema Header/Settings, opções de paleta, ciclo de vida dos overlays e diretórios.

## MUST PRESERVE

- Login username/password/remember_me; sessão via cookie HttpOnly; checagem inicial, logout e resposta 401. Nenhum novo usuário/permissão.
- `VITE_API_URL` continua sendo base configurável, axios `withCredentials: true`, Content-Type JSON, timeout padrão 8000 ms, diretório 6000 ms, geração 20000 ms e sync 8000 ms. Chaves persistidas: `theme`, `app_palette`, `app_language`, `layout_mode`; eventos `language_changed`, `palette_changed`, `auth_logout` preservados. Novos listeners de UI podem complementar esses eventos.
- Todos campos/defaults, CPF/RG e máscara, CRM/CRO/RMS, UFs, CID não informado, busca normalizada e seleção que preenche campos.
- Validação atual: nome/documento/cargo/empresa/data/dias positivos/CID ou checkbox/nome médico/registro/UF. Cálculo de retorno e aviso acima de 15 dias sem mudanças.
- Payload exato de `/api/generate-html`: objetos paciente, atestado e medico conforme `App.tsx`; HTML string de resposta, timeout e erro. Preview sandbox sem scripts, impressão automática, download e tela cheia.
- Preview mantém iframe `srcDoc`, `sandbox="allow-same-origin allow-modals"`, nunca `allow-scripts`, `referrerPolicy="no-referrer"`; impressão automática única após load, print do iframe com fallback window.print, download por Blob e revogação do object URL.
- Diretório privado, cache/outbox/TTL, busca local, paginação 30, filtros, duplicidade e limpeza de cache no logout. Geração não espera persistência.
- Consulta oficial CRM/CRO/RMS e alternativa de janela externa. Não inferir sucesso de integrações externas.
- URLs preservadas: CRM `https://portal.cfm.org.br/busca-medicos/`, CRO `https://website.cfo.org.br/profissionais-cadastrados/`, RMS `https://maismedicos.saude.gov.br/new/web/app.php/maismedicos/rms`. Preservar iframe de consulta e botão de popup quando conselho bloquear embed.
- Iframe externo mantém `sandbox="allow-same-origin allow-scripts allow-forms allow-popups"` para compatibilidade do formulário oficial. Fallback mantém `window.open(targetUrl, '_blank', ...)`, dimensões e centralização atuais, sem enviar dados do paciente/profissional na URL. E2E verifica src/sandbox e destino/alvo do popup interceptado; não certifica conteúdo remoto do conselho.
- Idiomas pt/en/es; paletas existentes garnet/emerald/sapphire/amber/graphite; modos claro/escuro; preferência de layout vertical/horizontal; PWA.

## MAY CHANGE

Composição visual, AppShell/sidebar para ações existentes, tokens semânticos, fonte conforme preferência autorizada (Inter), glass com contraste suficiente, CSS, primitives compartilhados e acessibilidade. Nomes visuais Emerald Slate/Midnight Blue/Graphite Sand podem atualizar mantendo chaves persistidas. Amber permanece disponível. Navegação não deve descartar formulário.

## MUST NOT CHANGE

API/endpoints, banco, schemas, autenticação/autorização, regras clínicas/administrativas, campos, significado dos dados, políticas de cache/sync ou documento emitido. Nenhum dado real em fixtures/screenshots/logs. Nenhum merge na main ou publicação automática.

## Baseline antes de mudanças

- `npm ci`: PASS, 272 pacotes; 0 vulnerabilidades. Avisos de dependências deprecated existentes (ESLint 8 e dependências transitivas).
- `npm run build`: PASS; CSS 65.41 kB, JS 442.45 kB; gzip 9.75/123.63 kB.
- `npm run lint`: PASS, 0 warnings.
- `npx tsc --noEmit`: PASS. Não existe script typecheck.
- Não existem testes frontend/unit/integration/E2E. Backend: `../venv/bin/python -m pytest tests/test_api_smoke.py -q` PASS, 4 testes, 9 warnings preexistentes (Pydantic validators V1/FastAPI startup). Python global sem pytest; dependências instaladas em ambiente virtual isolado, sem alterar Python global.
- CI atual: lint/build/npm audit e smoke/security Python. Não cobre frontend E2E.

## Harness antes do redesign

Playwright como dependência de desenvolvimento, mocks HTTP em memória e dados sintéticos identificados como teste. Cobrir auth/login/remember/logout/401; diretórios/autocomplete/filtros; validação; payload/preview/download; preferências; cache/reconexão e estados error/empty/loading. Rodar contra baseline antes da migração. Matriz visual: 375/430/768/1024/1280/1440/1920, cinco paletas e claro/escuro; Chromium/Firefox/WebKit quando instaláveis. Sem acesso a banco ou credenciais reais.

Infra executável: `frontend/playwright.config.ts`, `frontend/e2e/`, script `npm run test:e2e`, Vite via webServer; CI instala Chromium e Firefox e roda o mesmo script. Mocks de `/api/auth/session`, `/api/auth/token`, `/api/auth/logout`, `/api/directory`, `/api/check-duplicate`, `/api/generate-html` e `/api/directory/sync` usam formas de dados de `api.ts`/`types/index.ts`. Geração deve comparar objetos enviados, contar ausência de requisição na validação e devolver HTML sintético. Print interceptado em todos frames para contar chamada sem abrir impressão real; download deve produzir arquivo HTML e nome esperado. GET diretório vazio/erro e resposta atrasada exercitam estados. IndexedDB é verificado com snapshots sintéticos; reload/rede indisponível preserva busca local e evento online permite retry. Logout/401 devem remover cache. Preferências verificadas após reload e eventos, não só aparência.

Cookie real e validade da sessão pertencem ao smoke backend/TestClient: login válido, remember_me e atributos HttpOnly/SameSite, sessão autenticada e logout. Browser mocks validam encaminhamento de remember_me, não certificam segurança de cookie emitido em produção. Resultado reportará testes backend e testes browser separadamente. Gate M0: comandos baseline + smoke + E2E atuais passando, antes de qualquer edição de `src`; gates posteriores repetem os comandos disponíveis, com captura de falhas em artefatos locais e revisão independente.

## Plano e gates

1. M0: auditoria, baseline, contrato, harness aprovado no código atual e commit.
2. M1: tokens/primitives/temas e gestão compartilhada, revisar e validar.
3. M2: AppShell/login/homologação fiéis às duas referências, somente ações existentes.
4. M3: diretórios/configurações/consulta/validação/preview, responsividade e acessibilidade.
5. M4: regressão completa, revisão Terra independente, correções e nova aprovação, limpeza verificada e relatório.

Cada lote termina com lint/typecheck/build/harness relevantes. Não acumular regressões. Commits pequenos e reversíveis. Comparar capturas com as referências, não apenas overflow automático.

Navegação nova é apresentação de ações atuais: homologação (foco no formulário), abrir diretório de pacientes, abrir diretório de médicos, abrir configurações e logout. Drawer mobile agrupa essas mesmas ações. Nenhuma rota/feature de dashboard/relatórios/histórico é criada. Ações de gerar/limpar continuam sticky e alcançáveis em todos viewports, com espaço de rolagem para não encobrir campos/foco.

Referências inspecionadas: `/home/kauankelvin/.codex/attachments/799c80ad-d07d-47ed-bdf0-02b481643a7a/image-1.png` (login/primitives) e `/home/kauankelvin/.codex/attachments/799c80ad-d07d-47ed-bdf0-02b481643a7a/image-2.png` (shell/formulário/temas). Capturas baseline/finais ficarão em artefatos locais, com dados sintéticos.

## Segurança e limitações anteriores

Snapshot/outbox já guardam PII plaintext no IndexedDB; preservar contrato sem adicionar armazenamento. Backend usa admin global sem RBAC, valida data por tamanho e aceita zero dias embora UI exija positivo. Diretório sem paginação e busca backend limitada a 500. Chave de criptografia temporária em desenvolvimento pode invalidar dados após reinício. Esses riscos não serão corrigidos alterando negócio nesta missão. Referências usam ilustracões decorativas: criar arte vetorial/CSS sem dados e sem introduzir informações clínicas fictícias.

## Gate M0 executado

Harness frontend passou no código original: 6 cenários em Chromium e Firefox, 12 PASS / 0 FAIL, execução final 46 s. Smoke ampliado: 6 PASS / 0 FAIL (inclui login/cookie/sessão/logout). Lint/build/typecheck da aplicação/`npm run typecheck:e2e`/audit npm passaram. Capturas sintéticas ficam em `../frontend-baseline` fora do repositório e não são sobrescritas por execuções futuras. Testes browser bloqueiam SW para que mocks sejam determinísticos: cache/reconexão validam indisponibilidade da API e IndexedDB, não certificam o shell PWA totalmente sem rede. CI foi configurado para ambos navegadores, typecheck e E2E nesta branch; execução remota ainda não realizada.

WebKit foi instalado, mas não inicia no host Arch por bibliotecas nativas ausentes (incluindo libicu74, libxml2, libflite1 e libharfbuzz-icu0). Sem alteração do sistema operacional; limitação local explícita. Revisão documental Terra aprovada. Revisão independente do harness confirmou correções presentes; Terra reexecutou typecheck:e2e e diff-check com PASS e confirmou ausência de diff em src e de artefatos dentro do repo. Resultado final do harness: 12 PASS / 0 FAIL. Frontend/src ainda é idêntico à base neste marco.
