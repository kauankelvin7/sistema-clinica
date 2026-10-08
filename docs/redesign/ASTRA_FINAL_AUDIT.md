# Auditoria independente Astra — revisão em andamento

Data: 08/10/2026. **Estado: aguardando implementação e retestes por marcos; release não aprovado.** Este arquivo será atualizado após revisão adversarial do diff e evidências finais. Não constitui aceite antecipado.

Base: `7d3216feabc79ca7a7fb0db47698dd85e0bb080d`; branch `design/clinical-glass-fastflow`. Auditoria prévia e plano crítico: [01_UX_AUDIT.md](01_UX_AUDIT.md).

## Provas independentes baseline

Astra executou Chromium headless contra Vite local 4181, com rotas API interceptadas e fixtures sintéticas. Nenhuma conexão com produção.

| Achado | Severidade | Resultado baseline | Artefatos fora do repo |
|---|---|---|---|
| A02: formulário após 401 e novo login | P1 | Nome da sessão anterior reaparece | `/workspace/clinical-evidence/astra/adversarial.mjs`, `baseline-adversarial.json` |
| A02: resposta tardia de diretório após logout | P1 | Cache IndexedDB repovoado com 1 paciente | `/workspace/clinical-evidence/astra/directory-race.mjs`, `baseline-directory-race.json` |
| A05: auto-print ao remontar mesma geração | P1 | Primeira carga=1; load repetido=1; remount=2 | `/workspace/clinical-evidence/astra/preview-harness.mjs`, `baseline-preview-harness.json` |
| A07: área útil do formulário | P2 | Screenshot 375×900 não mostra inputs na primeira dobra; 1440×900 oculta documento/cargo/empresa/registro sob área do footer | `/workspace/clinical-evidence/baseline/screenshots/workspace-375.png`, `workspace-1440.png` |

Artefatos incluem dados sintéticos. O harness de Preview monta o componente real sob StrictMode via Vite, contando chamadas substitutas de print; não comprova impressão física ou política de popup de hardware/browser real.

## Gates pendentes

- G1: repetir os três probes acima, data local, limpar, rascunho/409, SW e fluxo válido até auto-print.
- G2/G3: diff de shell/tokens/semântica, screenshots, campo útil sem wizard, contraste/foco/idiomas/módulos reais.
- G4/G5: verificar resultados finais da suíte e limites, revisar segurança dos contratos, registrar retestes e parecer final com zero P0/P1 ou bloqueio explícito.

## Marco G1 — retestes independentes executados

Working tree liberada por Sol em 08/10/2026, ainda sem SHA de commit de marco. Probes executados de 09:11 a 09:15 UTC, antes do polimento visual G2.

- A02 formulário 401 + login: **PASS**, `retainedForm=""`, em `g1-adversarial.json`.
- A02 resposta tardia diretório: **PASS**, `cachePresent=false`, 0 pacientes após logout, em `g1-directory-race.json`.
- A05 remount: **PASS**, primeira impressão=1, load repetido=1, remount=1, em `g1-preview-harness.json`. Adaptação explícita: nova interface usa `generation: {attempted:boolean}` compartilhada pelo dono em vez de ID string ignorado pela base.
- A05 matriz ampliada: **PASS**, rerender/load=1, remount=1, print manual=2, fechar/reabrir com nova geração e mesmo HTML=3. Fallback sintético que lança no iframe: 1 tentativa iframe + 1 fallback window, aviso e botão manual visíveis. Fonte aguardando `fonts.ready`: zero impressão antes de ready e zero após fechar previamente. `print-matrix.mjs` / `g1-print-matrix.json`.
- Revisão de fonte encontrou race no patch de logout: login ficava disponível antes de terminar logout/cleanup. Sol serializou encerramento com estado `checking`, epoch e reset imediato. **Reteste PASS**: login indisponível durante request retida; após liberar, login funciona com formulário vazio. `logout-race.mjs` / `g1-logout-race.json`.
- A01 SW real: **PASS na proteção central**, Chromium com `serviceWorkers: allow`, origem local 4191 e proxy Vite 4181, duas revisões do arquivo real `public/sw.js`. Dirty preservado, 0 reloads e botão desabilitado enquanto worker aguardava; limpar/aplicar produziu 1 reload e nenhum worker waiting. `sw-lifecycle.mjs` / `g1-sw-lifecycle.json`. Não equivale a teste de shell offline de produção, pois assets servidos pelo Vite.

### Achados G1 enviados ao integrador

| ID | Nível | Evidência e reprodução | Estado |
|---|---|---|---|
| G1-01 | P2 | `utils/appUpdates.ts`, `controllerchange` sem distinguir primeiro controle: contexto vazio instala primeiro SW e já anuncia Atualização disponível, embora não exista atualização | Correção solicitada |
| G1-02 | P2 | `App.tsx` mensagem após limpar + `.clinic-toast`: no ciclo SW, clicar Limpar/confirmar faz toast cobrir Atualizar agora; Playwright atesta interceptação de pointer events. Screenshot `/workspace/clinical-evidence/astra/g1-update-obstructed.png` | Correção solicitada; teste só prosseguiu após fechar toast explicitamente |

O cenário de SW registrou uma falha inicial de clique causada por G1-02; reteste com fechamento explícito da mensagem valida lifecycle, sem esconder a falha de UX. Janela de observação final aguardou 2,5 s após aplicar para observar reload real. Não há aprovação final de G1/G5 enquanto faltarem os demais cenários e correções.

## Marco G3 — retestes e visual independente

Executados em Chromium, 09:24–09:30 UTC, sobre working tree após sinal de estabilidade de Sol:

- **G1-01/G1-02 resolvidos e retestados:** SW real na origem 4191 agora não anuncia update na instalação inicial; toast não obstrui aplicar. Dirty preservado sem reload, após limpar/aplicar houve exatamente um reload e nenhum worker esperando. `g3-sw-lifecycle.mjs` / `g3-sw-lifecycle.json`. O teste foi adaptado para fazer clique `trial` antes de aplicar, porque a navegação real pode concluir antes do timeout curto de click; captura branca anterior era transição da atualização, não evidência de obstrução persistente.
- **Área útil:** screenshots independentes em 320/375/1024/1280/1440, light/dark em 375. Em 1280×800 e 1440×900, 13/13 inputs/selects do workspace ficam integralmente entre topbar e footer. Em 375×900, 4/13; 320×800, 1/13; 1024×800, 9/13. Nenhum overflow horizontal nessas seis amostras. Checkbox incluído na contagem, com área clicável na label; não se exige que seu desenho tenha 44 px. Em 375 a melhoria é sobre o baseline visual sem qualquer input na primeira dobra. `visual-audit.mjs` / `g3-visual.json` e `g3-workspace-*.png`.
- Inspeção visual efetiva de `g3-workspace-1280-light.png`, `g3-workspace-375-light.png` e `g3-settings-320.png`: desktop apresenta os três grupos sem wizard, campos sólidos, botão primário inequívoco; mobile preserva coluna única e barra de ação, configurações com scroll interno. Não confundir 13 controles geométricos com todos os textos/conteúdos dinâmicos possíveis.
- **Contraste:** primeira medição achou placeholders com 3,59:1 light e 3,98:1 dark por `placeholder:text-muted/70` (P2). Sol retirou alpha. Reteste calculado por estilos computados e composição alpha nos fundos sólidos: mínimo 4,63:1 light e 6,38:1 dark, cinco paletas. Labels/hints/texto introdutório/botão e placeholders amostrados; não é certificação de todo pixel/toda tela. `contrast-audit.mjs` / `g3-contrast.json`; `final-contrast-audit.mjs` / `final-contrast.json`.
- **Navegação recolhida:** auditor apontou falta de contexto ao hover e ícones FileText idênticos de homologação/modelos (P2). Sol adicionou títulos e ícone distinto; revisão de fonte confirma. Suíte final cobre title persistido.
- **Rascunho retomável:** editar modelo, navegar à homologação e voltar mantém nome/título/texto e retoma editor sem confirmação de descarte desnecessária. `model-draft-audit.mjs` / `g3-model-draft.json`.
- **Modelos/segurança:** payload mantém name interno distinto de title; 409 preserva name/title/body; cancelar Voltar preserva editor; preview assistido mantém string `<img>` como texto e não cria elemento img; emitir request retida, logout, liberar resposta e novo login não cria preview nem dispara print. `model-contract-audit.mjs` / `g3-model-contract.json`.
- **Data/limpar:** America/Sao_Paulo em `2026-10-09T01:30Z` resulta dia 08; em `03:30Z` resulta dia 09; limpar restaura calendário local; cancelar conserva preenchimento. `date-clear-focus.mjs` / `g3-date-clear-focus.json`.

### Último achado funcional G3

`App.tsx`, predicado de foco após fechar validação: nome com somente espaços é identificado como faltante na validação (trim), porém busca do primeiro campo usa string truthy e pula para documento. **P2**, reproduzido em ambas as datas do teste acima; Sol recebeu instrução de alinhar predicado com trim e retestar. Não é perda de dados, mas desvia foco da primeira correção necessária.

Revisão de fonte: nenhuma alteração de payload clínico/rotas/backend/banco; mudanças de API apenas adicionam AbortSignal ao diretório. Cache TTL/fila/critérios mantidos, invalidação de sessão reforçada. Preview preserva sandbox sem scripts e referrer-policy; modelos continuam renderização React de texto, sem dangerouslySetInnerHTML. Novas persistências de UI são preferências (densidade, transparência, sidebar), sem nova persistência de PII. Ativação PWA exige ação explícita, e inputs são desmontados durante aplicação para impedir digitação entre clique e controllerchange.

## Encerramento antecipado autorizado

O usuário solicitou integração imediata em main com gate pendente. Este documento mantém caráter intermediário: Astra não aprovou o estado final após a migração Tailwind 4. Retestes já executados permanecem válidos somente para seus marcos registrados. Suíte e auditoria final pendentes.
