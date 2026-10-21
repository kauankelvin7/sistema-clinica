# Homologação de atestados — prazo de 48 horas

Regra de negócio solicitada:

- O formulário continua solicitando **somente a data do atestado**, sem hora.
- O prazo de **48 horas efetivamente contadas** começa às **00h00 da data informada**, no fuso **America/Sao_Paulo**.
- Durante sábados e domingos, o contador fica pausado. Feriados não são excluídos.
- **No instante exato de 48 horas, é permitida a homologação sem exceção**. A partir de qualquer instante posterior, a confirmação explícita é obrigatória.
- A checkbox **“Confirmo que a homologação fora do prazo foi autorizada.”** aparece apenas quando o prazo foi ultrapassado.
- Não existe campo de horário nem justificativa. Desmarcada, a homologação é bloqueada no frontend **e na API**.
- Se a data do atestado for alterada, a confirmação volta a ficar desmarcada.
- As rotas `/api/generate-html`, `/api/generate-document` e `/api/generate-pdf` aplicam a mesma verificação.
- A API rejeita datas inválidas ou futuras. Este critério não substitui a avaliação médica nem verifica quem autorizou; a checkbox é uma declaração explícita feita pelo operador autenticado.

## Exemplos (horário de Brasília)

| Data do atestado | Limite de 48 horas úteis | Situação após o limite |
| --- | --- | --- |
| Segunda-feira 19/10/2026 | Quarta-feira 21/10/2026, 00h00 | Exige checkbox a partir de 00h00:00.001 |
| Sexta-feira 16/10/2026 | Terça-feira 20/10/2026, 00h00 | Sábado e domingo não contam |
| Sábado 17/10/2026 | Quarta-feira 21/10/2026, 00h00 | A contagem começa na segunda-feira |
| Domingo 18/10/2026 | Quarta-feira 21/10/2026, 00h00 | A contagem começa na segunda-feira |

**Convenção necessária:** sem o horário real de emissão não é possível saber o instante real de 48h; a origem às 00h00 é a definição operacional do sistema. Se a regra institucional exigir outra origem, altere e aprove a especificação antes da implantação.

## Contrato da API

Em `atestado`, novo campo booleano opcional `autorizacao_fora_prazo` (padrão `false`). A API retorna HTTP **403** se o prazo tiver vencido e o campo não for `true`, sem gerar o documento. Dados futuros são rejeitados com HTTP **422**.

A confirmação não autentica uma segunda pessoa nem estabelece vínculo com autorização externa; seu alcance é o registro declaratório no pedido da emissão. Para trilha de auditoria persistente, adicionar futuramente armazenamento de evento de homologação, sujeito às regras de privacidade da organização.
