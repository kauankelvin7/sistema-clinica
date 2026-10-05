# Modelos de documentos

Escopo adicional solicitado em 2026-10-02: retirar mensagens de segurança da interface, usar outra fonte e permitir modelos próprios com preenchimento/emissão, menu lateral e atalhos na homologação. Humanizer aplicado à redação da UI. Fonte escolhida: Inter. Usuário confirmou campos de texto e CPF. O marcador `{{cpf}}` usa a máscara compartilhada, exige 11 dígitos na emissão e não introduz validação matemática ou consulta de CPF.

## Fluxo

Modelos → Novo modelo → nome do modelo, título do documento e texto com marcadores `{{nome}}` → salvar → preencher os campos → emitir HTML → preview/print/download atuais. Modelos existentes podem ser editados. Atalhos na homologação abrem o preenchimento. Navegação preserva dados da homologação. Não incluir modelos clínicos predefinidos nem conclusões médicas automáticas.

## Persistência e contratos

Nova tabela independente `document_models`: id UUID, revisão, payload criptografado (nome do modelo, título do documento, texto e labels) e timestamp UTC. Mesma conexão SQLite/PostgreSQL e chave Fernet existentes. Produção precisa aplicar a migração SQL antes do uso, respeitando política de DDL fora de cold start. Gravação requer ENCRYPTION_KEY configurada para não salvar modelos com chave temporária.

Novas rotas autenticadas e limitadas: GET/POST `/api/document-models`, POST `/api/document-models/{id}`, POST `/api/document-models/{id}/generate`. Rotas antigas não mudam. Lista/save: `{id,name,title,body,fields:[{key,label}],revision,updated_at}`. `name` identifica o modelo na interface e `title` é usado exclusivamente como título do documento emitido. Registros antigos sem `name` usam `title` como fallback de exibição até a próxima edição, sem migração destrutiva. Update/generate enviam revisão; versão diferente retorna 409 e mantém rascunho para evitar sobrescrita ou emissão com texto alterado. Campos são derivados dos marcadores, únicos, limitados e todos obrigatórios no preenchimento. Sem eval/Jinja/HTML de usuário; texto e valores escapados, substituição em uma passagem. Não persistir preenchimentos, histórico de emissões ou novos cadastros.

O layout reutiliza CSS, cabeçalho, assinatura e rodapé do HTML existente. Documento personalizado contém o texto definido pelo usuário; não herda caixa de decisão de afastamento nem página de prontuário específicas da homologação. Toda emissão exige conteúdo revisável no preview. Sem novo endpoint PDF ou editor HTML arbitrário.

## Gates

Tests backend com SQLite temporário: CRUD permitido, persistência entre conexões, revisão concorrente, falta de auth, origem externa, input inválido, XSS/placeholder injection, no-store, preenchimento e HTML/layout. Harness E2E: criação/edição/reload, menu/atalhos, preservação da homologação, campos dinâmicos, validação, erro/conflict e preview/download. Responsividade e temas também na tela nova. Lint/typecheck/build/audit + testes originais permanecem obrigatórios; Terra faz revisão independente final. Nenhuma publicação/merge automático.

## Ativação

Em desenvolvimento, `create_tables()` cria a tabela no SQLite existente. Configure uma ENCRYPTION_KEY Fernet estável no ambiente antes de iniciar a API; não troque a chave de um banco existente. Não gerar ou registrar a chave em logs. Sem chave configurada, gravação retorna 503; nenhum modelo é salvo com a chave temporária.

Em produção, aplique `scripts/create_document_models.sql` no PostgreSQL durante a implantação revisada. A migração é idempotente e adiciona somente document_models. Não habilitar migrações gerais para executar apenas esta tabela. Deploy/API/banco de produção não foram acessados nesta implementação local.

Modelos pertencem ao acesso administrativo já existente; não há contas individuais/RBAC no produto atual. Texto fixo do modelo é criptografado, enquanto preenchimentos vivem apenas no estado React e na requisição de geração. Logout cancela leitura de modelos e desmonta o preenchimento. Atalhos exibem os seis modelos mais recentes, com acesso à lista completa. Edição usa revisão otimista; rascunho permanece após falha/409. Não foi introduzida exclusão ou arquivamento de modelos.
