/**
 * Returns a title for the representative
 * @param level Representative level
 * @param chamber Representative's chamber
 * @returns Title given the inputs
 */
export function getTitle(level?: string | null, chamber?: string | null) {
  if (level === 'national') {
    return `${chamber}`
  }
}