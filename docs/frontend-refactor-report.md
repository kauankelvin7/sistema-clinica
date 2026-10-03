# Refatoração frontend e modelos de documentos

Data: 2026-10-02. Repositório: kauankelvin7/sistema-clinica. Branch local: `refactor/frontend-design-system`. Base: `7d94a6fab5055ab2c74db069f8ed0b36256bf7ba`. Nenhum push, merge ou deploy realizado.

## Resultado

Frontend relevante migrado para um único sistema visual baseado nas duas referências fornecidas: login, homologação, diretórios, consulta oficial, validação, preview e configurações. O pedido adicional criou modelos persistentes de documentos, acessíveis pelo menu lateral e por atalhos na homologação. Fonte Inter aplicada; mensagens de “acesso/sistema seguro” retiradas e redação revisada com Humanizer.

Não foram criados dashboard, relatórios, perfil ou histórico inexistentes. Não foram inventados textos clínicos. O administrador escreve o modelo uma vez, salva e preenche campos de texto antes de emitir. `{{cpf}}` usa a máscara compartilhada e exige 11 dígitos; não acrescenta validação matemática. Modelos podem ser editados, inclusive labels dos campos. Emissão reutiliza cabeçalho, assinatura, rodapé e CSS do HTML original, retirando apenas os blocos específicos de decisão/prontuário da homologação no documento personalizado.

## Auditoria, baseline e organização

Auditoria e contrato precederam alterações de interface. A aplicação permaneceu React 18/TypeScript/Vite/Tailwind 3 sem router. Serviços de autenticação, diretório, cache e geração original não foram reescritos. Baseline limpo: build/lint/typecheck aprovados; quatro testes backend originais aprovados. Harness anterior ao redesign: seis cenários em dois navegadores, 12 PASS, e seis smoke backend. Marco inicial commitado em `f7e0040`.

Tokens RGB semânticos em CSS/Tailwind cobrem canvas, panel, input, ink, muted, border, brand, brand-foreground, sidebar, success, warning e danger. Cinco chaves de paleta existentes preservadas: garnet, emerald, sapphire, amber e graphite; todas com claro/escuro. Estados de sucesso/aviso/erro independem da cor da marca. Contraste de texto de marca no modo escuro foi corrigido; a preferência salva é aplicada antes do login.

Componentes compartilhados: Field, Dialog nativo, AutocompleteInput com teclado, AppShell, Header, PaletteSelector e ClinicalArtwork SVG decorativo. `useTheme` sincroniza preferências entre cabeçalho e configurações. `useDocumentModels` controla leitura/cancelamento sem adicionar cache privado; serviço dos modelos contém somente os novos contratos HTTP. A máscara de CPF original foi extraída para reutilização.

## Fluxos e contratos preservados

Login/remember_me/cookie HttpOnly/sessão/logout/401; payload da homologação; CPF/RG, UF, CID e cálculo de retorno; autocomplete e preenchimento pelo diretório; busca/filtros/paginação; IndexedDB/outbox/TTL de oito horas e sincronização; três idiomas; layout horizontal/vertical; PWA; CRM/CRO/RMS e popup alternativo; HTML original de duas páginas, impressão automática única, download e tela cheia.

`api.ts`, `directoryCache.ts`, `useClinicDirectory.ts` e `core/html_generator.py` não foram alterados. Teste backend verifica os três aliases originais de geração. Browser verifica payload exato, scripts proibidos no preview e seleção sem perda dos outros campos. Cadastro no diretório e geração mantêm independência.

## Qualidade e correções

Sidebar desktop e drawer mobile; uma, duas ou três colunas conforme espaço útil; ações sticky com espaço de rolagem. Labels associados, hints, foco visível, modal nativo com Escape/retorno de foco e alvo mínimo de 44 px. Combobox suporta setas, Enter e Escape. Estados reais de carregamento, erro, vazio, disabled, cache e reconexão permanecem acessíveis. Reduced-motion e reduced-transparency têm fallback.

Correções verificadas durante os gates: estado de tema divergente entre Header/Settings; light salvo ignorado; cor semântica corrompida pela paleta amber; RGB graphite inválido; foco inicial do diálogo antes de showModal; fechamento de overlays pequeno; navegação para modelos que não reiniciava a lista; aviso antigo de homologação cobrindo título; conflito de revisão sem caminho claro de atualização. Terra exigiu também no-store em erros de framework/autenticação, agora centralizado em middleware restrito às novas rotas.

Modelos são texto puro com marcadores limitados; conteúdo/valores escapados e substituição em uma passagem. Payload do modelo é criptografado com a infraestrutura existente. Revisão otimista rejeita edição/emissão desatualizada com 409. Preenchimentos não são persistidos. Leitura é cancelada no logout; após logout o preenchimento desmontado não abre preview com resposta tardia. Fixtures e capturas contêm apenas dados sintéticos.

Sem nova dependência de runtime. Removidas quatro dependências sem uso confirmado: clsx, date-fns, react-hook-form e tailwind-merge. Playwright é somente desenvolvimento. SVG evita asset raster pesado; não foram alteradas políticas de cache nem adicionada memoização especulativa.

## Validação final

- Unit: suíte unitária dedicada inexistente; helpers exercitados na suíte backend, sem dupla contagem.
- Integration/backend: 22 PASS / 0 FAIL; 27 warnings de APIs/deprecações já existentes.
- E2E: 28 PASS / 0 FAIL em Chromium/Firefox, 5m18s; 2 SKIP correspondem apenas à captura opt-in, executada separadamente.
- Build: PASS.
- Lint: PASS, zero warnings.
- Typecheck aplicação e E2E: PASS.
- npm audit e pip-audit: nenhuma vulnerabilidade conhecida encontrada nas dependências verificadas.
- Bandit: zero achados em 2688 linhas verificadas.
- Diff-check e compilação Python: PASS.

Fixtures ajustadas para UUID sintéticos: validação adicional dos modelos em ambos navegadores, 4 PASS / 0 FAIL; typecheck e diff-check PASS. Captura opt-in em Chromium: 1 PASS / 0 FAIL. Nenhum pageerror na suíte completa. Console errors foram coletados em memória, mas o reporter não persistiu anexos; não há evidência arquivada para afirmar console inteiramente limpo. Revisão independente Terra: aprovada após correções e validação final.

Comandos reais, executados no frontend: `npm run lint`, `npx tsc --noEmit`, `npm run typecheck:e2e`, `npm run build`, `npm run test:e2e`, `npm audit`. Backend, ambiente virtual isolado: `../venv/bin/python -m pytest -q --disable-warnings`, `../venv/bin/python -m bandit -q -r api backend core`, `../venv/bin/python -m pip_audit -r requirements.txt --progress-spinner off`. Também `git diff --check` e compilação Python dos arquivos adicionados.

Matriz: 375/430/768/1024/1280/1440/1920 px × cinco paletas × dois modos, em Chromium e Firefox. Cobertura de login, homologação, overlays de configurações/diretórios/validação e lista/editor/preenchimento dos modelos; foco sob header/footer sticky em sete larguras. Capturas opt-in separadas da suíte: 68 PNGs com dados sintéticos, revisadas em desktop/mobile e claro/escuro. A matriz automática verifica overflow/alcance; capturas e Terra complementam inspeção visual, sem alegar certificação integral de acessibilidade.

Build baseline: CSS 65.41 kB / gzip 9.75; JS 442.45 kB / gzip 123.63. Final: CSS 71.70 kB / gzip 11.79; JS 461.19 kB / gzip 128.49, 1592 módulos. O pacote aumentou com shell, acessibilidade e modelos; não é alegada redução de bundle nem ganho de tempo de carregamento medido.

## Limites e ativação

WebKit instalado, porém não inicia neste host Arch por bibliotecas nativas ausentes: libicu74, libxml2, libflite1 e libharfbuzz-icu0. Sem alterar o sistema operacional. CI configurado para Chromium/Firefox; execução remota ainda não realizada. Testes browser interceptam API e bloqueiam SW; backend TestClient exercita rotas reais em SQLite temporário. PostgreSQL de produção, conteúdo remoto dos conselhos, impressão física/multipágina longa e shell PWA totalmente offline não foram certificados.

Ativação em produção exige aplicar `scripts/create_document_models.sql` e manter ENCRYPTION_KEY Fernet estável. Desenvolvimento cria a tabela via create_tables; gravação sem chave configurada retorna 503 para evitar perda após reinício. Não trocar a chave de banco existente. A migração é aditiva/idempotente; nenhuma implantação foi executada.

Riscos anteriores preservados/documentados: admin global sem RBAC; PII em IndexedDB plaintext; validação backend de data por tamanho/zero dias; diretório integral e limite de busca backend; chave temporária em desenvolvimento. Sem exclusão/histórico de modelos ou tipos de campo além de texto, conforme escopo solicitado.

## Entrega e próximo passo

- `f7e0040`: baseline, contratos e harness antes da migração.
- `719f8aa`: modelos persistentes, migração aditiva e testes backend.
- `db22116`: sistema visual, frontend relevante, modelos na UI e harness ampliado.
- O commit deste relatório encerra a entrega documental; HEAD completo está em `entrega.txt` no pacote de saída.

Código local e relatório entregues para revisão. Próximo passo operacional: revisar diff, configurar chave estável, aplicar migração no ambiente de destino, realizar aceite com API real/PostgreSQL e então autorizar publicação. Não existe regressão introduzida conhecida nos fluxos cobertos pelos gates.
