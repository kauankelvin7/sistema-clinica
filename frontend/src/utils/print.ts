/**
 * Utilitário para impressão de HTML de forma robusta e segura,
 * evitando bloqueios de popup e comportamentos de "about:blank".
 */

export function imprimirHTML(htmlContent: string): void {
  // 1. Cria um Blob com o HTML gerado
  const blob = new Blob([htmlContent], { type: "text/html; charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  // 2. Cria um iframe invisível
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;";
  document.body.appendChild(iframe);

  // 3. Carrega o HTML no iframe e aciona a impressão
  iframe.onload = () => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    } catch (e) {
      console.error("Erro ao tentar imprimir:", e);
    } finally {
      // 4. Limpa recursos após a impressão (delay para garantir que o Safari processe)
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }
  };

  iframe.src = blobUrl;
}

/**
 * Alternativa: Baixar o HTML como arquivo para abertura manual.
 */
export function baixarHTML(htmlContent: string, nomeArquivo: string): void {
  const blob = new Blob([htmlContent], { type: "text/html; charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
