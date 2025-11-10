export const useFormatters = () => {
  /**
   * Trunca um texto para um comprimento máximo, adicionando reticências
   * @param text - Texto a ser truncado
   * @param maxLength - Comprimento máximo (padrão: 20)
   * @returns Texto truncado com "..." se necessário
   */
  const truncateText = (text: string, maxLength: number = 20): string => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return {
    truncateText,
  }
}
