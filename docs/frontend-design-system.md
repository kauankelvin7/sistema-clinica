# Design System web

## Autoridade visual

Duas pranchas fornecidas: login e Nova Homologação. Direção: Inter, superfícies translúcidas, bordas finas, ícones outline Lucide, vinho e verde sóbrio, fundos com profundidade, navegação lateral escura e formulários claros. A imagem de documento/credencial é decorativa e não representa dados do usuário. Ilustração pode ser vetorial/CSS para evitar novo asset pesado.

Arquivos de referência: `/home/kauankelvin/.codex/attachments/799c80ad-d07d-47ed-bdf0-02b481643a7a/image-1.png` e `/home/kauankelvin/.codex/attachments/799c80ad-d07d-47ed-bdf0-02b481643a7a/image-2.png`.

## Tokens

- Marca Garnet: #7A1F2A, destaque #B94B5A, base #2E1216.
- Emerald Slate: #176B5C; Midnight Blue: #12558C; Graphite Sand: #715B43. Manter chaves emerald/sapphire/graphite. Amber legado também permanece.
- Neutros claros: #0F172A texto, #475569 secundário, #CBD5E1 borda, #F1F5F9 superfície suave, branco translúcido. Escuro: superfícies tintadas por tema e texto claro.
- Semânticos: canvas, panel, input, ink, muted, border, brand, brand-hover, sidebar, success, warning, danger. Estados clínicos não herdam cor de marca.
- Espaço: 4/8/12/16/24/32/48/64 px. Radius: 6/12/16/24 px. Sombras leves em cards, médias em overlays; blur 8/16/24 px com fundo sólido de fallback.
- Tipografia Inter com fallback sans-serif: corpo 14–16/20–24; títulos de seção 16–20; título principal 28–40 conforme viewport. Labels legíveis, sem truncar informações essenciais.

## Composição

Desktop: sidebar de aproximadamente 224 px, topbar compacta, conteúdo fluido, hero com título + ilustração + status real. Três seções do formulário quando largura útil permitir, duas ou uma antes disso. Footer de ações sticky dentro do workspace, respeitando área da sidebar e espaço para campos/foco.

Mobile: cabeçalho compacto, navegação em drawer acessível que agrupa apenas ações existentes (homologação, modelos autorizados, pacientes, médicos, configurações e logout), formulário vertical, campos e botões com área mínima de toque 44 px, overlays com rolagem interna. Não renderizar botões sem ação ou recursos ausentes como relatórios/histórico. Opções de diretório usam os componentes e callbacks atuais; selecionar não perde os outros dados do formulário. Gerar/limpar continuam sticky e alcançáveis; reservar scroll-padding para header/footer.

## Primitives e estados

Reaproveitar SectionCard, AutocompleteInput, DirectoryStatus e classes de botões existentes. Centralizar campo/label/help text e diálogo/foco onde a repetição justificar. Corrigir labels associados, combobox com listbox e teclado, foco visível, retorno de foco e escape em overlays. Tema deve ter uma fonte compartilhada entre Header e Settings; paletas não duplicam catálogo.

Loading, empty, error, disabled e cache/offline mantêm mensagens reais. Não usar contagens fictícias nem perfil inventado. Estado de erro é alert, progresso é progressbar, mensagens não críticas são status. Ícones decorativos ocultos para leitores de tela. Respeitar reduced-motion e contraste AA.

## Validação

Harness funcional antes/depois, capturas desktop/mobile e matriz 375/430/768/1024/1280/1440/1920 em cinco paletas claro/escuro. Comparação visual humana das capturas e revisão Terra independente. Melhorias de performance apenas em assets/composição/imports de UI, sem mudar consistência/cache do diretório ou dados do documento.

## Implementação e uso

- `index.css` / `tailwind.config.js`: tokens RGB semânticos, classes compartilhadas de campo, botões, cards e diretórios. `brand-foreground` usa a rampa clara no modo escuro; `brand` mantém contraste com texto branco nos botões. Warning/success/danger não mudam com a paleta.
- `themeManager` / `useTheme`: catálogo único de cinco paletas, persistência nas chaves existentes e evento `theme_changed` para sincronizar Header/Settings. Tema salvo é aplicado na inicialização; ausência de preferência segue o sistema.
- `Field`: associa label, id e hint por `aria-describedby`. Reutiliza o controle nativo ou AutocompleteInput; não adiciona validação de negócio.
- `AutocompleteInput`: combobox/listbox, opção ativa, ArrowUp/ArrowDown/Enter/Escape e foco no input durante seleção por mouse. Busca e limite de oito sugestões preservados.
- `Dialog`: portal com dialog nativo modal; Escape, backdrop, contenção/retorno de foco e cleanup compartilhados. Preview, consulta externa e diretórios mantêm conteúdos e ações próprios.
- `AppShell` / `Header`: sidebar desktop, drawer mobile, atalho para conteúdo, preferências e ações reais. Seleção do diretório usa o mesmo callback das seções do formulário.
- `ClinicalArtwork`: SVG decorativo com ids únicos e sem dados pessoais. Sem biblioteca de ilustração ou raster pesado.

Controles principais e fechamento de overlays têm alvo de 44 px. Foco visível global usa `brand-foreground`; scroll-padding evita que header/footer sticky ocultem campos focados. Reduced-motion e reduced-transparency removem transições/blur. Fontes usam fallback local quando Inter não carregar. Banners anunciam erro/status e progresso possui valor acessível. As bandeiras são decorativas; os botões de idioma mantêm texto.
