# Design System web

## Autoridade visual

Duas pranchas fornecidas: login e Nova Homologação. Direção: Manrope, superfícies translúcidas, bordas finas, ícones outline Lucide, vinho e verde sóbrio, fundos com profundidade, navegação lateral escura e formulários claros. A imagem de documento/credencial é decorativa e não representa dados do usuário. Ilustração pode ser vetorial/CSS para evitar novo asset pesado.

Arquivos de referência: `/home/kauankelvin/.codex/attachments/799c80ad-d07d-47ed-bdf0-02b481643a7a/image-1.png` e `/home/kauankelvin/.codex/attachments/799c80ad-d07d-47ed-bdf0-02b481643a7a/image-2.png`.

## Tokens

- Marca Garnet: #7A1F2A, destaque #B94B5A, base #2E1216.
- Emerald Slate: #176B5C; Midnight Blue: #12558C; Graphite Sand: #715B43. Manter chaves emerald/sapphire/graphite. Amber legado também permanece.
- Neutros claros: #0F172A texto, #475569 secundário, #CBD5E1 borda, #F1F5F9 superfície suave, branco translúcido. Escuro: superfícies tintadas por tema e texto claro.
- Semânticos: canvas, panel, input, ink, muted, border, brand, brand-hover, sidebar, success, warning, danger. Estados clínicos não herdam cor de marca.
- Espaço: 4/8/12/16/24/32/48/64 px. Radius: 6/12/16/24 px. Sombras leves em cards, médias em overlays; blur 8/16/24 px com fundo sólido de fallback.
- Tipografia Manrope com fallback sans-serif: corpo 14–16/20–24; títulos de seção 16–20; título principal 28–40 conforme viewport. Labels legíveis, sem truncar informações essenciais.

## Composição

Desktop: sidebar de aproximadamente 224 px, topbar compacta, conteúdo fluido, hero com título + ilustração + status real. Três seções do formulário quando largura útil permitir, duas ou uma antes disso. Footer de ações sticky dentro do workspace, respeitando área da sidebar e espaço para campos/foco.

Mobile: cabeçalho compacto, navegação em drawer acessível que agrupa apenas ações existentes (homologação, pacientes, médicos, configurações e logout), formulário vertical, campos e botões com área mínima de toque 44 px, overlays com rolagem interna. Não renderizar botões sem ação ou recursos ausentes como relatórios/histórico. Opções de diretório usam os componentes e callbacks atuais; selecionar não perde os outros dados do formulário. Gerar/limpar continuam sticky e alcançáveis; reservar scroll-padding para header/footer.

## Primitives e estados

Reaproveitar SectionCard, AutocompleteInput, DirectoryStatus e classes de botões existentes. Centralizar campo/label/help text e diálogo/foco onde a repetição justificar. Corrigir labels associados, combobox com listbox e teclado, foco visível, retorno de foco e escape em overlays. Tema deve ter uma fonte compartilhada entre Header e Settings; paletas não duplicam catálogo.

Loading, empty, error, disabled e cache/offline mantêm mensagens reais. Não usar contagens fictícias nem perfil inventado. Estado de erro é alert, progresso é progressbar, mensagens não críticas são status. Ícones decorativos ocultos para leitores de tela. Respeitar reduced-motion e contraste AA.

## Validação

Harness funcional antes/depois, capturas desktop/mobile e matriz 375/430/768/1024/1280/1440/1920 em cinco paletas claro/escuro. Comparação visual humana das capturas e revisão Terra independente. Melhorias de performance apenas em assets/composição/imports de UI, sem mudar consistência/cache do diretório ou dados do documento.
