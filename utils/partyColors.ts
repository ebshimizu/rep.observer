/**
 * badge colors for each party
 */
export const PartyColors: Record<string, string> = {
  'democratic': 'blue',
  'republican': 'red',
  'independent': 'green'
}

export function getPartyColor(party: string) {
  if (party.toLowerCase() in PartyColors) {
    return PartyColors[party.toLowerCase()]
  }

  return 'green'
}