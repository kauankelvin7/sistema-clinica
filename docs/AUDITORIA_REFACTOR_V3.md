# Auditoria V3 — Sistema Clínica

Data: 2026-10-01

## Diagnóstico

### Interface e responsividade
- A tela principal funcionava, mas mantinha alta densidade visual em três cartões pequenos, especialmente em notebooks.
- Havia SVGs inline e estilos de selects duplicados, prejudicando consistência e manutenção.
- Os modais de pacientes e médicos repetiam lógica e consultavam o backend durante busca/paginação.
- O autocomplete ainda continha tokens visuais legados e podia renderizar listas maiores que o necessário.

### Performance e banco
- O PostgreSQL usava `NullPool` e `engine.dispose()` depois de cada operação.
- Cada operação ainda fazia um `SELECT 1` manual além de `pool_pre_ping`.
- O cold start executava DDL/migrações em produção.
- A geração do documento aguardava persistência de paciente/médico antes de responder.
- A busca de pacientes dependia de round-trip, conexão e descriptografia a cada termo.

### Segurança
- O cookie de sessão assumia `SameSite=None` em produção, embora o frontend atual seja same-origin.
- Não havia throttling específico para login.
- Escritas autenticadas por cookie não tinham guarda explícita de `Origin`.
- Dados pessoais não devem ser persistidos em CDN/proxy; o cache de busca precisa ser privado, expirar e ser removido no logout.

## Refatoração aplicada

### Diretório local cache-first
- Novo `GET /api/directory` carrega pacientes e médicos em uma única conexão autenticada.
- Resposta HTTP usa `private, no-store`; CDN/proxy não persiste dados pessoais.
- O navegador mantém snapshot em IndexedDB por no máximo 8 horas.
- O snapshot é removido no logout ou quando a sessão deixa de ser válida.
- A UI lê IndexedDB primeiro e sincroniza o banco em segundo plano.
- Autocomplete, duplicidade visual e modais pesquisam em memória.
- Novos cadastros entram imediatamente no cache e usam fila persistente para sincronização/retry.

### Banco e cold start
- Pool pequeno e reaproveitável por instância (`pool_size=1`, `max_overflow=1`, `pool_pre_ping`).
- Removidos `engine.dispose()` e `SELECT 1` de cada operação.
- `connect_timeout` padrão reduzido para 5 s e `statement_timeout` para 8 s, configuráveis por ambiente.
- Migração automática de schema em produção desativada por padrão; `RUN_SCHEMA_MIGRATIONS=true` habilita execução explícita.
- `/health` virou liveness barato. Diagnóstico real do banco fica em rota autenticada.

### Fluxo sem freeze
- A geração HTML não depende mais do banco.
- Depois da pré-visualização, paciente/médico entram no cache local imediatamente.
- A persistência usa `POST /api/directory/sync` em uma requisição separada.
- Se a conexão falhar, a mutação permanece em IndexedDB e é reenviada ao recuperar rede ou atualizar a base.

### Frontend
- Grid: 1 coluna em celular, 2 em tablet/notebook estreito e 3 quando houver largura real.
- Estado da base visível: sincronizando, cache local, sincronizado ou indisponível.
- Modais agora são locais, rápidos e paginam o cache em memória.
- SVGs de marca/selects duplicados foram substituídos por Lucide.
- Autocomplete limitado a 8 sugestões e tokens visuais antigos removidos.
- Service Worker: network-first para navegação e stale-while-revalidate para assets.
- Assets com hash recebem cache imutável na Vercel.

## Proteções
- Cookie `SameSite=Lax` por padrão.
- Guard de `Origin` para métodos de escrita.
- Login: 8 tentativas por 5 minutos por instância/IP.
- Limites de tamanho para username/password.
- GZip para payloads maiores.
- API de diretório explicitamente `no-store`.

## Limites conhecidos
- Rate limiting em memória é por instância serverless; limitação global exigiria Redis/KV.
- IndexedDB guarda os campos necessários para busca instantânea. Por isso há TTL curto e limpeza no logout.
- CI cobre build, lint, dependências, análise estática e smoke tests, mas não substitui testes end-to-end completos do fluxo clínico.
