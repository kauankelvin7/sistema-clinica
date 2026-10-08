# Fluxo e desempenho — gate pendente

Baseline sintético no mesmo ambiente: 2 cliques e 4 ações de teclado; impressão única. Chromium: feedback 411,4 ms, impressão observada 858,3 ms. Firefox: feedback 480 ms, impressão observada 898 ms. Preenchimento automatizado não mede velocidade humana. Bundle baseline: CSS 72,09 KB e JS 461,62 KB (gzip 11,85/128,57 KB).

Astra observou antes da migração Tailwind 4: em 1280×800 e 1440×900, 13/13 controles acima da barra; em 375 px, 4 controles visíveis contra zero baseline. Não extrapolar esse resultado para o build final sem recaptura.

Medição final e matriz visual após atualização das ferramentas PENDENTES por solicitação do usuário de integração antecipada. Não declarar ganho de latência ou ausência de regressões finais.
