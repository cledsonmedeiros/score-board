import { describe, expect, it } from 'vitest'
import { TeamDrawer, type DrawStrategy } from './teamDrawer'
import type { Gender, Player } from '~/stores/scoreboard'
import type { PairRule, PairRuleType } from './pairRules'
import { emptyPositions, type Position } from './playerProfile'

let nextId = 1
const RUNS = 30

function makePlayer(
  weight: number,
  gender: Gender = 'M',
  positions: Position[] = [],
  name?: string,
): Player {
  const id = String(nextId++)
  const playerPositions = emptyPositions()
  positions.forEach((position) => (playerPositions[position] = true))
  return {
    id,
    name: name ?? `Jogador ${id}`,
    weight,
    gender,
    positions: playerPositions,
    seed: false,
    enabled: true,
    createdAt: Date.now(),
  }
}

function rule(
  playerA: Player,
  playerB: Player,
  type: PairRuleType = 'cannot',
): PairRule {
  return {
    id: `${playerA.id}-${playerB.id}`,
    type,
    playerAId: playerA.id,
    playerBId: playerB.id,
  }
}

function draw(
  players: Player[],
  numberOfTeams: number,
  strategy: DrawStrategy = 'balanced',
  rules: PairRule[] = [],
) {
  return new TeamDrawer(players, numberOfTeams, rules).draw(strategy)
}

const totalWeight = (members: Player[]) =>
  members.reduce((sum, member) => sum + member.weight, 0)

const spread = (values: number[]) => Math.max(...values) - Math.min(...values)

const weightSpread = (teams: { members: Player[] }[]) =>
  spread(teams.map((team) => totalWeight(team.members)))

const countPosition = (members: Player[], position: Position) =>
  members.filter((member) => member.positions[position]).length

const femaleCount = (members: Player[]) =>
  members.filter((member) => member.gender === 'F').length

const seed = (player: Player): Player => ({ ...player, seed: true })

/** Funções (LEV/REC/ATA) que a equipe consegue cobrir com pessoas diferentes (força bruta). */
function coveredRoles(members: Player[]): number {
  const roles: Position[] = ['setter', 'receiver', 'attacker']
  const best = (roleIndex: number, used: Set<string>): number => {
    if (roleIndex === roles.length) return 0
    let result = best(roleIndex + 1, used) // função descoberta
    for (const member of members) {
      if (used.has(member.id) || !member.positions[roles[roleIndex]!]) continue
      used.add(member.id)
      result = Math.max(result, 1 + best(roleIndex + 1, used))
      used.delete(member.id)
    }
    return result
  }
  return best(0, new Set())
}

const teamIndexOf = (teams: { members: Player[] }[], player: Player) =>
  teams.findIndex((team) => team.members.some((m) => m.id === player.id))

describe('TeamDrawer', () => {
  describe('validação de entrada', () => {
    it('lança erro quando não há jogadores', () => {
      expect(() => new TeamDrawer([], 2)).toThrow(
        'Nenhum jogador habilitado para sorteio',
      )
    })

    it.each([0, -1, 1.5])(
      'lança erro quando a quantidade de equipes é inválida (%s)',
      (numberOfTeams) => {
        expect(() => new TeamDrawer([makePlayer(5)], numberOfTeams)).toThrow(
          'A quantidade de equipes deve ser um número inteiro maior que 0',
        )
      },
    )

    it('lança erro quando há mais equipes do que jogadores', () => {
      const players = [makePlayer(5), makePlayer(5)]
      expect(() => new TeamDrawer(players, 3)).toThrow(
        'Não é possível formar 3 equipes com 2 jogadores.',
      )
    })
  })

  describe('quantidade e tamanho das equipes', () => {
    it('cria exatamente a quantidade de equipes pedida, com tamanhos iguais quando a divisão é exata', () => {
      const players = Array.from({ length: 12 }, () => makePlayer(5))
      const teams = draw(players, 3)

      expect(teams).toHaveLength(3)
      expect(teams.map((t) => t.members.length)).toEqual([4, 4, 4])
    })

    it('mantém a diferença de tamanho entre equipes em no máximo 1 jogador', () => {
      const players = Array.from({ length: 17 }, () => makePlayer(5))
      const teams = draw(players, 3)

      expect(teams.map((t) => t.members.length).sort()).toEqual([5, 6, 6])
    })

    it('nomeia as equipes sequencialmente', () => {
      const teams = draw(
        Array.from({ length: 4 }, () => makePlayer(5)),
        2,
      )
      expect(teams.map((t) => t.name)).toEqual(['EQUIPE 1', 'EQUIPE 2'])
    })

    it('inclui cada jogador exatamente uma vez', () => {
      const players = Array.from({ length: 11 }, (_, i) => makePlayer(i + 1))
      const teams = draw(players, 4)

      const ids = teams.flatMap((t) => t.members.map((m) => m.id)).sort()
      expect(ids).toEqual(players.map((p) => p.id).sort())
    })
  })

  describe('equilíbrio de habilidade (força total)', () => {
    it('mantém a força total dentro da tolerância em relação à melhor divisão', () => {
      // Soma 21 em 2 equipes de 3: o melhor possível é 11 x 10.
      for (let run = 0; run < RUNS; run++) {
        const players = [6, 5, 4, 3, 2, 1].map((w) => makePlayer(w))
        // Ótimo = 1; a tolerância de 1.5 aceita até 2.5.
        expect(weightSpread(draw(players, 2))).toBeLessThanOrEqual(2.5)
      }
    })

    it('mantém a força total próxima com muitos jogadores e meios pontos', () => {
      const weights = Array.from({ length: 24 }, (_, i) => 1 + (i % 19) * 0.5)
      for (let run = 0; run < RUNS; run++) {
        const players = weights.map((w) => makePlayer(w))
        expect(weightSpread(draw(players, 4))).toBeLessThanOrEqual(0.5 + 1.5)
      }
    })

    it('compensa a equipe com menos jogadores com jogadores mais fortes', () => {
      // 5 jogadores em 2 equipes (3 x 2). Força total igual (12 x 12) só é
      // possível colocando o jogador 9 na equipe de 2.
      for (let run = 0; run < RUNS; run++) {
        const strongest = makePlayer(9)
        const players = [strongest, ...[6, 3, 3, 3].map((w) => makePlayer(w))]
        const teams = draw(players, 2)

        expect(weightSpread(teams)).toBe(0)
        const smallTeam = teams.find((t) => t.members.length === 2)!
        expect(smallTeam.members.map((m) => m.id)).toContain(strongest.id)
      }
    })
  })

  describe('equilíbrio de posições', () => {
    it.each(['balanced', 'random'] as const)(
      'distribui levantadores, recepcionadores e atacantes entre as equipes (%s)',
      (strategy) => {
        for (let run = 0; run < RUNS; run++) {
          const players = [
            makePlayer(5, 'M', ['setter']),
            makePlayer(5, 'M', ['setter']),
            makePlayer(5, 'M', ['setter']),
            makePlayer(5, 'M', ['receiver']),
            makePlayer(5, 'M', ['receiver', 'attacker']),
            makePlayer(5, 'M', ['receiver']),
            ...Array.from({ length: 6 }, () =>
              makePlayer(5, 'M', ['attacker']),
            ),
          ]
          const teams = draw(players, 3, strategy)

          teams.forEach((team) => {
            expect(countPosition(team.members, 'setter')).toBe(1)
            expect(countPosition(team.members, 'receiver')).toBe(1)
          })
          expect(
            spread(teams.map((t) => countPosition(t.members, 'attacker'))),
          ).toBeLessThanOrEqual(1)
        }
      },
    )

    it('prioriza posições sobre habilidade', () => {
      // Juntar os dois levantadores daria 15 x 15; separá-los dá 17.5 x 12.5.
      // Como posição vem antes de habilidade, eles precisam ficar separados.
      for (let run = 0; run < RUNS; run++) {
        const setterA = makePlayer(10, 'M', ['setter'])
        const setterB = makePlayer(5, 'M', ['setter'])
        const players = [setterA, setterB, makePlayer(7.5), makePlayer(7.5)]
        const teams = draw(players, 2)

        expect(teamIndexOf(teams, setterA)).not.toBe(
          teamIndexOf(teams, setterB),
        )
        expect(weightSpread(teams)).toBe(5)
      }
    })
  })

  describe('cobertura de posições por pessoas diferentes', () => {
    it('cobre o máximo possível de funções com pessoas diferentes (caso real do app)', () => {
      // Sorteio real do app. Só 5 pessoas distintas levantam ou recebem
      // (Kel, Betao, Pedro, Fagner, Cleverton), mas 3 equipes precisariam de 6:
      // o melhor possível é uma única função descoberta no total.
      for (let run = 0; run < RUNS; run++) {
        const players = [
          makePlayer(8.5, 'M', ['setter', 'receiver', 'attacker'], 'Kel'),
          makePlayer(6.5, 'F', [], 'Mercia'),
          makePlayer(7.5, 'M', ['attacker'], 'Betinho'),
          makePlayer(7, 'M', ['attacker'], 'Petrus'),
          makePlayer(6, 'F', ['attacker'], 'Lu'),
          makePlayer(8, 'M', ['setter'], 'Betao'),
          makePlayer(7, 'M', ['attacker'], 'Binho'),
          makePlayer(8.5, 'M', ['receiver', 'attacker'], 'Pedro'),
          makePlayer(9, 'M', ['setter', 'receiver', 'attacker'], 'Fagner'),
          makePlayer(2.5, 'F', [], 'Karol'),
          makePlayer(10, 'M', ['setter', 'receiver', 'attacker'], 'Cleverton'),
          makePlayer(8, 'M', ['attacker'], 'Henry'),
        ]
        const teams = draw(players, 3)

        const covered = teams.map((team) => coveredRoles(team.members))
        expect(covered.reduce((sum, value) => sum + value, 0)).toBe(8)
        covered.forEach((value) => expect(value).toBeGreaterThanOrEqual(2))
      }
    })

    it('compensa com força extra a equipe que fica com função descoberta', () => {
      // Elenco do segundo sorteio real: ainda só 5 pessoas levantam ou recebem
      // para 3 equipes, então uma fica descoberta. Média 7.375 => compensação
      // de ~3.69 pontos para essa equipe.
      for (let run = 0; run < RUNS; run++) {
        const all: Position[] = ['setter', 'receiver', 'attacker']
        const players = [
          seed(makePlayer(9, 'M', all, 'Fagner')),
          seed(makePlayer(8.5, 'M', all, 'Kel')),
          seed(makePlayer(10, 'M', all, 'Cleverton')),
          makePlayer(8.5, 'M', all, 'Pedro'),
          makePlayer(8, 'M', ['setter'], 'Betao'),
          makePlayer(6, 'F', ['attacker'], 'Lu'),
          makePlayer(7, 'M', ['attacker'], 'Petrus'),
          makePlayer(6.5, 'F', [], 'Mercia'),
          makePlayer(7.5, 'M', ['attacker'], 'Betinho'),
          makePlayer(7, 'M', ['attacker'], 'Binho'),
          makePlayer(2.5, 'F', [], 'Karol'),
          makePlayer(8, 'M', ['attacker'], 'Henry'),
        ]
        const teams = draw(players, 3)
        const covered = teams.map((team) => coveredRoles(team.members))
        const strengths = teams.map((team) => totalWeight(team.members))

        const uncoveredTeam = covered.indexOf(2)
        expect(covered.filter((value) => value === 2)).toHaveLength(1)
        strengths.forEach((strength, team) => {
          if (team !== uncoveredTeam) {
            // Com mulheres espalhadas e a tolerância de força, a vantagem varia
            // (+0.5 a +2.5 medidos), mas a equipe descoberta é sempre a mais forte.
            expect(strengths[uncoveredTeam]! - strength).toBeGreaterThan(0)
          }
        })
      }
    })

    it('um jogador completo sozinho conta como uma função só', () => {
      // 2 equipes: os dois completos precisam ficar separados, e o levantador
      // e o recepcionador puros também, para cada equipe ter 2 pessoas com função.
      for (let run = 0; run < RUNS; run++) {
        const players = [
          makePlayer(5, 'M', ['setter', 'receiver']),
          makePlayer(5, 'M', ['setter', 'receiver']),
          makePlayer(5, 'M', ['setter']),
          makePlayer(5, 'M', ['receiver']),
        ]
        const teams = draw(players, 2)
        teams.forEach((team) => expect(coveredRoles(team.members)).toBe(2))
      }
    })
  })

  describe('cabeças de chave', () => {
    it.each(['balanced', 'random'] as const)(
      'coloca no máximo um cabeça de chave por equipe quando há um por equipe (%s)',
      (strategy) => {
        for (let run = 0; run < RUNS; run++) {
          const seeds = [10, 9.5, 9].map((w) => seed(makePlayer(w)))
          const others = [5, 5, 5, 4, 4, 4, 3, 3, 3].map((w) => makePlayer(w))
          const teams = draw([...seeds, ...others], 3, strategy)

          teams.forEach((team) =>
            expect(team.members.filter((m) => m.seed)).toHaveLength(1),
          )
        }
      },
    )

    it('prioriza cabeças de chave sobre posições', () => {
      // Separar os cabeças obriga um dos levantadores a ficar junto de um deles.
      for (let run = 0; run < RUNS; run++) {
        const seedA = seed(makePlayer(10, 'M', ['setter']))
        const seedB = seed(makePlayer(10))
        const players = [
          seedA,
          seedB,
          makePlayer(5, 'M', ['setter']),
          makePlayer(5),
        ]
        const teams = draw(players, 2)

        expect(teamIndexOf(teams, seedA)).not.toBe(teamIndexOf(teams, seedB))
      }
    })
  })

  describe('equilíbrio de gênero', () => {
    it.each(['balanced', 'random'] as const)(
      'distribui homens e mulheres quando não há conflito com os outros critérios (%s)',
      (strategy) => {
        for (let run = 0; run < RUNS; run++) {
          const players = [
            ...Array.from({ length: 4 }, () => makePlayer(5, 'M')),
            ...Array.from({ length: 2 }, () => makePlayer(5, 'F')),
          ]
          const teams = draw(players, 2, strategy)
          teams.forEach((team) => expect(femaleCount(team.members)).toBe(1))
        }
      },
    )

    it('espalha as mulheres mesmo quando isso piora a força', () => {
      // Com força igual (12 x 12) as duas ficariam juntas em {8, 2, 2}; como
      // mulheres espalhadas vêm antes da habilidade, ficam uma em cada equipe.
      for (let run = 0; run < RUNS; run++) {
        const players = [
          makePlayer(2, 'F'),
          makePlayer(2, 'F'),
          makePlayer(8, 'M'),
          makePlayer(4, 'M'),
          makePlayer(4, 'M'),
          makePlayer(4, 'M'),
        ]
        const teams = draw(players, 2)

        teams.forEach((team) => expect(femaleCount(team.members)).toBe(1))
        expect(weightSpread(teams)).toBe(4) // 14 x 10: o melhor possível assim
      }
    })
  })

  describe('elenco real do app', () => {
    const all: Position[] = ['setter', 'receiver', 'attacker']
    const roster = () => [
      seed(makePlayer(9, 'M', all, 'Fagner')),
      seed(makePlayer(8.5, 'M', all, 'Kel')),
      seed(makePlayer(10, 'M', all, 'Cleverton')),
      makePlayer(8.5, 'M', all, 'Pedro'),
      makePlayer(8, 'M', ['setter'], 'Betao'),
      makePlayer(6, 'F', ['attacker'], 'Lu'),
      makePlayer(7, 'M', ['attacker'], 'Petrus'),
      makePlayer(6.5, 'F', [], 'Mercia'),
      makePlayer(7.5, 'M', ['attacker'], 'Betinho'),
      makePlayer(7, 'M', ['attacker'], 'Binho'),
      makePlayer(2.5, 'F', [], 'Karol'),
      makePlayer(8, 'M', ['attacker'], 'Henry'),
    ]

    it('coloca uma mulher em cada equipe', () => {
      for (let run = 0; run < RUNS; run++) {
        draw(roster(), 3).forEach((team) =>
          expect(femaleCount(team.members)).toBe(1),
        )
      }
    })

    it('não repete sempre as mesmas equipes', () => {
      // Antes da tolerância, a equipe do Kel saía idêntica em 200 de 200 sorteios.
      const kelTeams = new Set<string>()
      for (let run = 0; run < RUNS; run++) {
        const teams = draw(roster(), 3)
        const kelTeam = teams.find((t) =>
          t.members.some((m) => m.name === 'Kel'),
        )!
        kelTeams.add(
          kelTeam.members
            .map((m) => m.name)
            .sort()
            .join(','),
        )
      }
      expect(kelTeams.size).toBeGreaterThan(1)
    })
  })

  describe('regra de "não pode jogar junto"', () => {
    it('nunca coloca os dois jogadores na mesma equipe', () => {
      for (let run = 0; run < RUNS; run++) {
        const players = Array.from({ length: 8 }, () => makePlayer(5))
        const [a, b] = players
        const teams = draw(players, 2, 'balanced', [rule(a!, b!)])
        expect(teamIndexOf(teams, a!)).not.toBe(teamIndexOf(teams, b!))
      }
    })

    it('lança erro quando as restrições tornam o sorteio impossível', () => {
      const [a, b, c] = Array.from({ length: 3 }, () => makePlayer(5))
      const rules = [rule(a!, b!), rule(a!, c!), rule(b!, c!)]

      expect(() => draw([a!, b!, c!], 2, 'balanced', rules)).toThrow(
        'Não foi possível montar equipes com as restrições atuais.',
      )
    })
  })

  describe('regra de "deve jogar junto"', () => {
    it.each(['balanced', 'random'] as const)(
      'sempre coloca o par na mesma equipe (%s)',
      (strategy) => {
        for (let run = 0; run < RUNS; run++) {
          const players = [10, 10, 8, 6, 4, 2, 2, 6].map((w) => makePlayer(w))
          const [a, b] = players
          const teams = draw(players, 2, strategy, [rule(a!, b!, 'must')])

          expect(teamIndexOf(teams, a!)).toBe(teamIndexOf(teams, b!))
          expect(teams.map((t) => t.members.length)).toEqual([4, 4])
        }
      },
    )

    it('aplica a regra de forma transitiva e combina com "não pode"', () => {
      for (let run = 0; run < RUNS; run++) {
        const players = Array.from({ length: 9 }, () => makePlayer(5))
        const [a, b, c, d] = players
        const rules = [
          rule(a!, b!, 'must'),
          rule(b!, c!, 'must'),
          rule(a!, d!, 'cannot'),
        ]
        const teams = draw(players, 3, 'random', rules)

        const teamOfA = teamIndexOf(teams, a!)
        expect(teamIndexOf(teams, b!)).toBe(teamOfA)
        expect(teamIndexOf(teams, c!)).toBe(teamOfA)
        expect(teamIndexOf(teams, d!)).not.toBe(teamOfA)
      }
    })

    it('coloca o grupo na equipe maior quando só ela comporta o grupo', () => {
      // 7 jogadores em 3 equipes => tamanhos 3, 2 e 2: o trio só cabe na de 3.
      for (let run = 0; run < RUNS; run++) {
        const players = Array.from({ length: 7 }, () => makePlayer(5))
        const [a, b, c] = players
        const rules = [rule(a!, b!, 'must'), rule(b!, c!, 'must')]
        const teams = draw(players, 3, 'balanced', rules)

        const trioTeam = teams[teamIndexOf(teams, a!)]!
        expect(trioTeam.members.map((m) => m.id).sort()).toEqual(
          [a!.id, b!.id, c!.id].sort(),
        )
      }
    })

    it('ignora regras com jogadores que não estão no sorteio', () => {
      const players = Array.from({ length: 4 }, () => makePlayer(5))
      const outsider = makePlayer(5)
      const rules = [
        rule(players[0]!, outsider, 'must'),
        rule(outsider, players[1]!, 'must'),
      ]
      const teams = draw(players, 2, 'balanced', rules)
      expect(teams.map((t) => t.members.length)).toEqual([2, 2])
    })

    it('lança erro quando o grupo é maior que o tamanho máximo das equipes', () => {
      const [a, b, c, d] = Array.from({ length: 4 }, (_, i) =>
        makePlayer(5, 'M', [], `P${i}`),
      )
      const rules = [rule(a!, b!, 'must'), rule(b!, c!, 'must')]

      expect(() => new TeamDrawer([a!, b!, c!, d!], 2, rules)).toThrow(
        'O grupo que deve jogar junto (P0, P1, P2) tem 3 jogadores, mais do que o limite de 2 por equipe.',
      )
    })

    it('lança erro quando as regras são contraditórias', () => {
      const [a, b, c, d] = Array.from({ length: 4 }, () => makePlayer(5))
      const rules = [
        rule(a!, b!, 'must'),
        rule(b!, c!, 'must'),
        rule(a!, c!, 'cannot'),
      ]

      expect(() => new TeamDrawer([a!, b!, c!, d!], 2, rules)).toThrow(
        'Há regras contraditórias',
      )
    })
  })
})
