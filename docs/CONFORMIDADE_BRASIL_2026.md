# Plano de adequação jurídica e segurança — sistema-clinica (2026-10-30)

> **Status:** avaliação técnico-jurídica inicial, não parecer jurídico nem certificado de conformidade. A revisão de código não comprova como a clínica opera, nem valida contratos, base legal, treinamento, políticas, infraestrutura ou a autenticidade de documentos. Não publicar/implantar sem homologação clínica e jurídica.

## 1. Fontes e método

- Acervo secundário de pesquisa: [ctresb/leis](https://github.com/ctresb/leis), particularmente [Lei 13.709/2018](https://github.com/ctresb/leis/blob/main/federal/leis-ordinarias/2018/lei-13709-2018-08-14.md) e [Lei 13.787/2018](https://github.com/ctresb/leis/blob/main/federal/leis-ordinarias/2018/lei-13787-2018-12-27.md). O acervo alerta que conversões/OCR são informativos, não fonte oficial.
- Fontes primárias para confirmação: [LGPD — Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), [Lei 13.787/2018 — Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm), [Resolução CFM 2.381/2024](https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2024/2381_2024.pdf) (incluindo alterações e atos posteriores), [regulamentações ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/) e [orientações sobre incidente](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis).
- Verificar atualização, revogação, decisões judiciais e normas do CRM local **antes da entrada em produção**. Há diferenças relevantes entre emissão de atestado original, transcrição, homologação administrativa, perícia e prontuário eletrônico.
- Código inspecionado na `main` em 30/10/2026: `api/index.py`, `api/document_models.py`, `core/auth.py`, `core/audit.py`, `core/crypto.py`, `core/db_manager.py`, `frontend/src/App.tsx`, `frontend/src/hooks/useClinicDirectory.ts`, `frontend/src/services/directoryCache.ts`, `frontend/public/sw.js` e testes.

## 2. Inventário de tratamento observado

| Fluxo | Dados | Exposição/controle atual | Responsável a confirmar |
|---|---|---|---|
| Cadastro de pacientes | nome, CPF/RG, cargo, empresa | criptografia Fernet de nome/documento em DB; retorno descriptografado na API | controlador/operador |
| Diretório de pacientes e médicos | identificadores e dados profissionais | endpoint autenticado devolve **todos** os registros; snapshot em IndexedDB por até 8h, inclusive mutações pendentes | controle de dispositivo, funções |
| Homologação/geração HTML | identificação, profissional, dias, CID quando incluído | geração protegida por JWT; documento retornado em HTML sem assinatura digital verificável | responsável técnico/médico |
| Modelos personalizados | texto e valores preenchidos | CRUD autenticado, renderização HTML | responsável pela aprovação do conteúdo |
| Acesso | admin de variável de ambiente; cookie HttpOnly | senha comparada em tempo constante, JWT até 24h ou 30 dias com lembrar-me | gestores de identidade |
| Logs | método, caminho, status, IP e duração | auditoria técnica sem associação robusta a operador individual | encarregado, segurança |

## 3. Matriz de riscos e exigências

**P0 — antes da produção**

1. **Contas individuais e controle de acesso** — LGPD arts. 6º, 37 e 46: a conta compartilhada impede atribuição confiável por pessoa. Primeiro passo: provisionamento opt-in de operadores com senhas derivadas em hash, identidade em JWT e trilha técnica pseudonimizada. Pendente: RBAC por função, MFA, revogação centralizada, desligamento de contas, sessão com expiração curta e revisão periódica.
2. **Documentação e escopo do ato médico** — CFM 2.381/2024: não confundir geração de HTML com atestado médico assinado. Determinar se há emissão, transcrição, conferência ou homologação, quem valida CRM/competência, assinatura ICP-Brasil/outra legalmente admitida, identidade e autorização para CID. O software não deve autodenominar-se certificado apenas por imprimir HTML.
3. **Diagnóstico/CID** — LGPD arts. 6º/11 e sigilo médico; CFM 2.381/2024 art. 5º, §§ 3º–4º: inclusão/reprodução de diagnóstico deve estar amparada por justa causa, dever legal ou solicitação do paciente/representante, documentada quando cabível. Atualmente CID é pedido pela interface ou pode ser marcado não informado. Pendente validar finalidade do fluxo e definir fundamento, comprovante e limites de acesso sem criar um falso "consentimento" universal.
4. **Dados salvos no dispositivo** — LGPD arts. 6º e 46: IndexedDB mantém diretório integral e fila em texto simples por até 8 horas. Pendente política de dispositivos, avaliar remoção/criptografia real do cache e plano de migração para evitar perda de fila não sincronizada. Não apagar dados offline silenciosamente.
5. **Comprovação de integridade do documento** — Lei 13.787/2018: guarda de prontuários requer autenticidade, integridade, confidencialidade e requisitos específicos de digitalização. HTML baixado não implementa, sozinho, GED, assinatura digital, trilha inviolável ou retenção mínima do prontuário (em regra 20 anos após último registro, ressalvadas especificidades).

**P1 — endurecimento técnico seguro**

6. **Minimização de logs** — evitar IP literal e conteúdo de pacientes em telemetria; registrar pseudônimo estável do operador, tipo de rota, resultado e ID aleatório de correlação. Log técnico isolado não substitui histórico clínico durável e inviolável.
7. **Cache HTTP e download** — bloquear caches intermediários/navegador de respostas privadas da API, inclusive erros e HTML; reforçar `nosniff`, `no-referrer` e `noindex` sem quebrar o preview.
8. **Superfície da API** — revisar CORS, cookies, CSRF, logs de exceções, limitação de requisições em instâncias múltiplas, gestão e rotação de chaves, backup/teste de recuperação, isolamento de tenants e vazamentos via GET/query string.
9. **Riscos de documentos falsos** — exibir distinção explícita entre rascunho conferível e documento assinado, com fluxo de aprovação do responsável quando for necessária homologação clínica.
10. **Incidentes** — LGPD art. 48 e Resolução ANPD 15/2024: processo de triagem e comunicação no prazo aplicável (regra geral 3 dias úteis para incidente relevante; exceções legais, inclusive pequeno porte, devem ser verificadas), registro e acompanhamento. Não confundir auditoria de request com registro de incidentes.

**P2 — governança e trabalho com pessoas**

11. Mapa de tratamento e hipóteses legais específicas para cada fluxo (não presumir consentimento como única base de saúde); aviso de privacidade verdadeiro; contrato com provedores, suboperadores, transferências internacionais e práticas de backup.
12. Canal de direitos do titular com identidade validada, revisão humana, prazo e mecanismos de acesso/correção sem apagar indevidamente prontuário obrigatório; indicação de encarregado ou dispensa aplicável.
13. Matriz de retenção por tipo de registro (prontuário ≠ cache ≠ log ≠ modelo), descarte, políticas de usuário, treinamento e plano de resposta.
14. Analisar legislação estadual/municipal e normas de vigilância sanitária/CFM/CRM conforme **localização real da clínica** e natureza do serviço; o acervo de terceiros não determina aplicabilidade automaticamente.

## 4. Entrega técnica incremental nesta branch

- [x] Documentar escopo, fontes, lacunas e critérios de aceite.
- [x] Endurecer cabeçalhos HTTP e política anti-cache de respostas da API.
- [x] Adicionar opção de contas individuais com hashes fortes, sem guardar senhas em claro no repositório e mantendo compatibilidade com deploy legado **até migração deliberada**.
- [x] Registrar evento HTTP estruturado com ator pseudonimizado e sem IP literal nem valores médicos.
- [x] Criar testes automatizados (execução e aprovação integral no CI dependem do estado do PR).
- [x] Exibir orientação sobre confidencialidade de CID na interface, **sem fingir que a orientação substitui fundamento legal ou autorização**.
- [x] Separar snapshot IndexedDB por identidade de operador autenticado (reduz mistura acidental; **não constitui isolamento criptográfico**).
- [ ] Revisar CID, assinatura, autorizações excepcionais e migração do cache **sem fazer alteração destrutiva**.

## 5. Critérios de aceite / operação

- Rotas autenticadas continuam retornando 401 sem sessão; HTML de homologação continua com mesmo contrato e datas.
- Respostas de dados clínicos têm `Cache-Control: no-store`, `Pragma: no-cache`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` e `X-Robots-Tag`.
- Configuração de operadores malformada deve falhar ao iniciar; hash PBKDF2 verificável; autenticação individual em JWT; login legado só quando modo de operadores não estiver configurado.
- Testes exercitam pelo menos um login de operador, senha incorreta, bloqueio de identidade removida e ausência de logs com dados pessoais.
- Não mesclar na `main` ou implantar até CI e revisão operacional, médico-responsável e jurídico. Nenhuma revisão de código garante "zero problema" regulatório.

## 6. Pendências para a clínica

Confirmar jurisdição/UF e município, razão social/controlador, equipe que acessa registros, bases legais por finalidade, se o documento é rascunho ou homologação por médico, natureza do CID recebido, política de dispositivos pessoais/compartilhados, tempo de guarda, responsável técnico, encarregado, provedores de infraestrutura e rito de incidentes. A partir daí implementar RBAC e aprovações, assinatura verificável, GED, exclusão/retenção e solicitações do titular com acompanhamento.

**Nota:** a regra de "48 horas com fins de semana excluídos" é regra do fluxo atual, **não foi tratada como prazo legal geral**. A marcação de checkbox não prova, por si, autorização por profissional competente.

## 7. Provisionamento, ativação e rollback (somente após revisão)

1. Na máquina do administrador, execute `python scripts/create_operator_account.py operador.01 admin` e informe uma senha individual forte, sem eco no terminal. Copie apenas o JSON gerado para um gerenciador de segredos; **não salve o conteúdo em Git, logs ou tickets**. Mescle contas adicionais num único objeto de `OPERATOR_ACCOUNTS_JSON`, mantendo um administrador ativo.
2. Antes do deploy, teste em ambiente de homologação; configure a variável de ambiente `OPERATOR_ACCOUNTS_JSON` com o objeto JSON completo. Com a variável presente, o login legado **não funciona**. O valor malformado impede o processo de iniciar (fail closed).
3. Teste login, logout, troca de perfil, revogação, emissão com dados sintéticos, formulários, retorno 401, observabilidade e persistência de cache. Reinicie as instâncias ao alterar a configuração; a revogação só se aplica a instâncias que já receberam a nova variável. Os papéis `admin` e `operator` **ainda não são autorização por endpoint (RBAC)**; não habilite contas reais de operadores clínicos sem definir as permissões.
4. Rotacione JWT_SECRET e demais chaves por procedimento próprio com backup controlado e teste de recuperação. Trocar ENCRYPTION_KEY indevidamente pode tornar dados indisponíveis; `core/crypto.py` ainda possui fallback arriscado ao descriptografar.
5. **Rollback**: não desligue a autenticação individual simplesmente removendo `OPERATOR_ACCOUNTS_JSON` em produção, porque isso reativa a credencial administrativa legada. Valide solução de acesso emergencial com a equipe de segurança e formalize o plano de rollback.
6. Verifique `COOKIE_SECURE=true` no domínio de produção, domínio/origem autorizada, HTTPS, `COOKIE_SAMESITE` para frontend em domínio diferente, política de sessão (incluindo lembrar-me 30 dias, atualmente longa) e uma proteção CSRF adequada a cookies e rotas autenticadas.

### Cache local e continuidade de dados

A nova chave local `active-directory-v2:<operador>` separa sessões por identificador, mas **qualquer pessoa com acesso ao mesmo perfil de navegador poderá inspecionar o IndexedDB**: isso não é uma barreira de confidencialidade. O snapshot é salvo em texto claro e contém dados de pacientes. A chave anterior `active-directory-v1` não é lida pela nova versão e será apagada por limpeza geral de cache/logout. Antes de migrar em produção, avaliar se há `pending` não sincronizados em dispositivos já utilizados, criar procedimento de reconciliação auditável e aprovar com a clínica. Não descartar filas pendentes sem reconciliação. Preferir dispositivos geridos e, em etapa seguinte, migrar a persistência para modelo realmente protegido ou desativar dados sensíveis offline.

### Pendente de implementação para conformidade material

- Identidade vinculada a profissional/autoridade competente, RBAC por perfil e por paciente, MFA, encerramento centralizado e trilha persistente à prova de alterações.
- Fluxo de atestado com assinatura digital verificável, critérios de disponibilização a terceiros, consulta de registro profissional e distinção entre rascunho/ato médico.
- Fundamentação por finalidade de dados sensíveis, documentação sobre CID, processos de direitos do titular, contratos com operadores e RIPD quando necessário.
- Gestão de incidentes, avaliação de risco, controle de backups, retenção do prontuário e revisão de normas federais/estaduais/municipais específicas da unidade.

**Não declarar conformidade LGPD/CFM integral ou colocar alterações em produção somente com este PR.**
