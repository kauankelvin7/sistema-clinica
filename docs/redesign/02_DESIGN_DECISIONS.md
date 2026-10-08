# Clinical Glass — decisões de design

Data: 2026-10-08. Base auditada: 7d3216feabc79ca7a7fb0db47698dd85e0bb080d. Sol integra; Astra revisa independentemente; Luna documenta inventário/matriz.

## Operação antes de decoração

Homologação permanece numa única tela com paciente, atestado e médico visíveis conforme largura útil. Sem wizard, dashboard, agenda ou histórico. Formulário usa superfícies sólidas; vidro limitado à topbar/sidebar/overlay. Cabeçalho de tarefa compacto, status real e modelos opcionais recolhíveis. Navegação lateral 184px, recolhível a ícones com título/label e persistência apenas de preferências visuais.

Inter existente, texto #0F172A, secundário #475569, borda #CBD5E1, superfície #FFFFFF e canvas #F8FAFC; Garnet #7A1F2A e Emerald #176B5C. Cinco chaves de paleta preservadas. Escala 4/8/12/16/24/32, radii 8/12/16/20, transições até 180ms; nenhum atraso decorativo de ação. Densidade confortável/compacta independente do layout legado vertical/horizontal.

A identidade pública em uso é estetoscópio dos favicons/PWA, enquanto shell usa HeartPulse e logos não utilizados mostram cruz/escudo. Padronizar símbolo original simples de estetoscópio com documento sem emblema protegido, mantendo nome atual. SVG leve com variantes monocromáticas e raster derivados somente com ferramentas disponíveis; Python desktop permanece fora do escopo.

## Contratos e segurança de trabalho

Data padrão pelo calendário local. Limpar só confirma se houver alteração. Validação identifica campos e foco de correção sem etapas sucessivas. Impressão dispara quando iframe pronto, uma vez por identidade de geração mantida na sessão de App; manual e fallback preservados. HTML idêntico gerado outra vez recebe nova identidade. Nenhuma PII em localStorage/artefatos; cache legado permanece e sessão encerrada apaga estado/cancela respostas tardias.

Atualização PWA fica disponível, sem reload automático nem skipWaiting no install. Aplicar exige trabalho não editado, pedidos concluídos e overlays fechados; não persistir rascunhos privados para contornar reload. Modelos mantêm name/title independentes, texto simples e marcadores escapados. Guardas de saída preservam rascunho após 409; busca/ordem/metadados locais sem novo backend.

## Skills e revisão

Fontes/SHAs/licenças em `.agents/skills/SOURCES.md`. frontend-design orientou redução do hero e de passos numerados; regras React orientam estado derivado/eventos/cancelamento; guidelines fixadas orientam foco, confirmação, contraste e aria. Preferências do contrato prevalecem sobre sugestões genéricas das skills (Inter e SPA sem router existentes).

Verificação deve comparar capturas reais, overflow/foco em 320–1920px, claro/escuro e cinco paletas, 200% e redução de movimento/transparência. Tempos instrumentados medem ambiente sintético local, não desempenho em produção; políticas físicas de impressão e fontes oficiais remotas são limites explícitos.
