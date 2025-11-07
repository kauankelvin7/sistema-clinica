/**
 * Remove acentos e normaliza texto para comparação
 * Exemplo: "José" → "jose", "Vânia" → "vania", "João" → "joao"
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD') // Decompõe caracteres combinados (á → a + ´)
    .replace(/[\u0300-\u036f]/g, '') // Remove marcas diacríticas
    .toLowerCase() // Converte para minúsculas
}
