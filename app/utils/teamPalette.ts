/** Cores das equipes na ordem do sorteio (1ª vermelha, 2ª azul, ...). */
const PALETTE = [
  { card: 'border-red-300 bg-red-50', title: 'text-red-800' },
  { card: 'border-blue-300 bg-blue-50', title: 'text-blue-800' },
  { card: 'border-green-300 bg-green-50', title: 'text-green-800' },
  { card: 'border-yellow-300 bg-yellow-50', title: 'text-yellow-800' },
  { card: 'border-purple-300 bg-purple-50', title: 'text-purple-800' },
] as const

/** Classes de cartão e título da equipe `index` (as cores se repetem em ciclo). */
export const teamPalette = (index: number) => PALETTE[index % PALETTE.length]!
