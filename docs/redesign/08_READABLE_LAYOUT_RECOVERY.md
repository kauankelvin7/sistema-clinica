# Recuperação visual após captura em Windows/PWA

A captura de 1364×768 mostrou layout fora dos limites: sidebar recolhida com barra de rolagem, progresso escapando do banner e fonte/títulos pesados. Esta alteração restaura a composição estável anterior ao Clinical Signature v3, inclusive logo/wordmark e Inter, sem perder correções funcionais da v2.

## Correções
- Remove folha de CSS do experimento visual e fontes Nunito/DM Sans.
- Restaura a marca e composição do menu e login da versão validada anterior.
- Mantém navegação compacta, sem overflow lateral, com itens de tamanho acessível.
- Faz o banner da homologação organizar texto, status e progresso por grade com limites explícitos; muda para uma coluna sob 1200px.
- Reserva área de rolagem para a barra de impressão, agora compacta e sem decoração excessiva.
- Mantém formulários sólidos, campos legíveis e bordas/sombras discretas.
- Preserva lógica de seleção, emissão, autenticação, API, impressão automática e dados clínicos.
- Atualiza identificador de cache do PWA (sem limpar dados de pacientes nem forçar refresh enquanto o usuário digita).

## Verificações
CI: lint, build, typecheck e testes E2E existentes. Dois novos testes de layout exercitam a dimensão da captura (1364×768 em modo escuro com menu recolhido) e navegação móvel (375×812).
