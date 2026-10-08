# Notas de release — Clinical Glass

Status: rascunho para revisão; não representa uma release publicada. Implementação local em revisão; a suíte integral e a auditoria de dependências frontend ainda estão em andamento. HEAD de referência do inventário: `7d3216feabc79ca7a7fb0db47698dd85e0bb080d` em `design/clinical-glass-fastflow`.

## Escopo esperado

- Atualizar a experiência visual e operacional do frontend preservando os fluxos atuais de homologação, modelos, diretórios, configurações e consultas oficiais.
- Preservar a impressão automática após a geração bem-sucedida e a prévia pronta, além dos controles existentes de imprimir novamente, baixar, tela cheia e fechar.
- Não alterar contratos de backend, autenticação, dados pessoais, PWA ou impressão sem revisão do integrador.

## Alterações confirmadas nesta versão

No estado de trabalho inspecionado, foram implementados: data padrão pelo calendário local; proteção contra clique duplicado e respostas atrasadas de geração após mudança de sessão; confirmação ao limpar formulário alterado e foco no primeiro campo ausente; proteção de rascunho/navegação de modelos; impressão automática idempotente por geração com controle manual; aviso de atualização do app que espera trabalho, preview ou modal aberto antes de habilitar aplicação; busca/ordenação de modelos; preferências de densidade e transparência reduzida. Sol deve confirmar o diff integrado antes de esta lista ser considerada final.

## Guia operacional mínimo

1. **Iniciar atendimento:** acesse Homologação e preencha Paciente, Atestado e Médico; use autocomplete ou os botões de busca de cadastros para selecionar registros.
2. **Validar e emitir:** acione **Gerar Declaração**. Campos pendentes ficam destacados; feche a mensagem de validação para levar o foco ao primeiro campo que precisa de correção. Com dados válidos, o sistema solicita o documento e abre a prévia; quando pronta, tenta imprimir automaticamente uma vez. A prévia permanece aberta e oferece impressão manual, download HTML, tela cheia e fechar.
3. **Limpar com segurança:** em formulário alterado, **Limpar** abre confirmação. Cancelar preserva os dados; confirmar limpa o atendimento. Sem alterações, a limpeza não exige confirmação.
4. **Modelos:** abra Modelos pela navegação, pesquise por nome/título e ordene por atualização ou nome. Ao editar, Nome do modelo e Título do documento são campos separados. Use Adicionar campo para inserir marcadores; salve antes de sair ou descarte explicitamente as alterações. Preencher e emitir mantém a mesma prévia e impressão automática.
5. **Aplicar atualização:** se aparecer Atualização disponível, conclua/limpe o formulário, salve ou descarte o rascunho e feche prévia/diretório. O botão de atualizar fica habilitado quando não há trabalho em andamento; aplique a atualização nesse momento.
6. **Ajustar visual:** em Configurações, idioma, paleta, modo claro/escuro, modo compacto e redução de transparência. A navegação também permite alternar o layout do formulário. Instalação PWA depende do suporte do navegador.

## Validação observada até agora

O Sol confirmou lint, typecheck, typecheck E2E e build aprovados; recorte crítico de 9 cenários × Chromium/Firefox aprovado em 18/18; Bandit passou e `pip-audit` não encontrou vulnerabilidades. Evidências em `/workspace/clinical-evidence/final`. A suíte integral está sendo repetida após ajustes; `e2e-first.log` foi parcial/interrompida. A auditoria geral de dependências JS ainda tem triagem em andamento: relatório runtime sem vulnerabilidades, mas inicialmente havia dependências dev vulneráveis e a migração/fix ainda não foi reauditada. Não declarar release ou gate final aprovado até novos logs e revisão final do Sol.

## Pendências de publicação

- Confirmar o diff final integrado e resultados completos da suíte.
- Atualizar matriz com a nova auditoria geral do npm e testes backend, se executados.
- Registrar limitações e rollback após a revisão do release candidate.
- Nenhum deploy/publicação foi feito por este trabalho.

## Integração antecipada

Integração em main solicitada explicitamente pelo usuário em 08/10/2026, com gate final pendente. Não constitui homologação final. Ver 03_IMPLEMENTATION_REPORT.md para verificações e limites.
