# Skills auditadas e instaladas localmente — 2026-10-08

Destino real: `.agents/skills/`, escopo do projeto para Codex. Instalação por cópia auditada de clones Git; nenhuma CLI externa executada, nenhum script executable presente nas três skills selecionadas. Conteúdo textual lido antes da cópia.

- `frontend-design`: anthropics/skills `683bc88e56f3e09ba94f7055977f3d3aa499f202`, Apache-2.0 (LICENSE.txt preservada). Uso: plano visual e redução de ornamentos priorizando formulário clínico.
- `vercel-react-best-practices`: vercel-labs/agent-skills `063bee94c3f4df8453406c830b0a7df0f2860278`, declara MIT em SKILL.md; upstream não fornece arquivo LICENSE no snapshot. Uso: estado derivado, eventos em handlers, cancelamento e ausência de dependências novas. Não há scripts nesta skill.
- `web-design-guidelines`: mesmo SHA Vercel, versão declarada 1.0.0; arquivo upstream sem licença específica. Uso: foco, labels, overlays, confirmação destrutiva e contraste. Regras remotas auditadas e fixadas em PINNED_GUIDELINES.md, vercel-labs/web-interface-guidelines `434b7f91364665f2f733b310ec54809bf8f37937`. Não buscar main mutável no release gate.
- `playwright` OpenAI: opcional, dispensada por equivalência com suíte @playwright/test existente (1.63.0) e browsers nativos instalados. Nenhuma instalação desta skill é alegada.

A licença textual declarada pelo fornecedor não amplia licença da aplicação. Sem execução de código remoto, rede adicional ou mudança de configuração de agentes fora do projeto.
