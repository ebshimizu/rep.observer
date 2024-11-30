/**
 * badge colors for each party
 */
export const PartyColors: Record<string, string> = {
  'democratic': 'blue',
  'republican': 'red',
  'independent': 'green',
  'd': 'blue',
  'r': 'red'
}

export function getPartyColor(party: string) {
  if (party.toLowerCase() in PartyColors) {
    return PartyColors[party.toLowerCase()]
  }

  return 'green'
}