import { describe, expect, it } from 'vitest'
import { TeamDrawer } from './teamDrawer'
import type { CannotPairRule, Gender, Player } from '~/stores/scoreboard'

let nextId = 1

function makePlayer(
  weight: number,
  gender: Gender = 'M',
  name?: string,
): Player {
  const id = String(nextId++)
  return {
    id,
    name: name ?? `Jogador ${id}`,
    weight,
    gender,
    enabled: true,
    createdAt: Date.now(),
  }
}

function rule(playerA: Player, playerB: Player): CannotPairRule {
  return {
    id: `${playerA.id}-${playerB.id}`,
    playerAId: playerA.id,
    playerBId: playerB.id,
  }
}

function teamOf(drawer: TeamDrawer, strategy: 'balanced' | 'random' = 'balanced') {
  return drawer.draw(strategy)
}

function totalWeight(members: Player[]) {
  return members.reduce((sum, member) => sum + member.weight, 0)
}

function genderCounts(members: Player[]) {
  const female = members.filter((m) => m.gender === 'F').length
  return { female, male: members.length - female }
}

describe('TeamDrawer', () => {
  describe('validação de entrada', () => {
    it('lança erro quando não há jogadores', () => {
      expect(() => new TeamDrawer([], 3)).toThrow(
        'Nenhum jogador habilitado para sorteio',
      )
    })

    it('lança erro quando playersPerTeam é menor que 1', () => {
      const players = [makePlayer(3)]
      expect(() => new TeamDrawer(players, 0)).toThrow(
        'Número de jogadores por time deve ser maior que 0',
      )
    })
  })

  describe('tamanho e composição das equipes', () => {
    it('divide jogadores em equipes completas quando o total é múltiplo do tamanho pedido', () => {
      const players = Array.from({ length: 6 }, () => makePlayer(3))
      const drawer = new TeamDrawer(players, 3)
      const teams = teamOf(drawer)

      expect(teams).toHaveLength(2)
      expect(teams.map((t) => t.members.length)).toEqual([3, 3])
    })

    it('cria uma equipe menor com o restante quando o total não é múltiplo do tamanho pedido', () => {
      const players = Array.from({ length: 7 }, () => makePlayer(3))
      const drawer = new TeamDrawer(players, 3)
      const teams = teamOf(drawer)

      expect(teams).toHaveLength(3)
      expect(teams.map((t) => t.members.length).sort()).toEqual([1, 3, 3])
    })

    it('nomeia as equipes sequencialmente', () => {
      const players = Array.from({ length: 4 }, () => makePlayer(3))
      const drawer = new TeamDrawer(players, 2)
      const teams = teamOf(drawer)

      expect(teams.map((t) => t.name)).toEqual(['EQUIPE 1', 'EQUIPE 2'])
    })

    it('inclui cada jogador exatamente uma vez, sem perder nem duplicar ninguém', () => {
      const players = Array.from({ length: 11 }, () => makePlayer(3))
      const drawer = new TeamDrawer(players, 4)
      const teams = teamOf(drawer)

      const allIds = teams.flatMap((t) => t.members.map((m) => m.id)).sort()
      expect(allIds).toEqual(players.map((p) => p.id).sort())
    })
  })

  describe('sorteio balanceado por habilidade (peso)', () => {
    it('distribui jogadores de pesos distintos equilibrando o peso total de cada equipe', () => {
      // Pesos distintos tornam o resultado determinístico: o desempate entre
      // equipes com o mesmo peso acumulado sempre favorece a de menor índice,
      // e o embaralhamento inicial só afeta a ordem entre pesos iguais.
      const players = [6, 5, 4, 3, 2, 1].map((weight) => makePlayer(weight))
      const drawer = new TeamDrawer(players, 3)
      const [teamA, teamB] = teamOf(drawer, 'balanced')

      expect(teamA!.members.map((m) => m.weight)).toEqual([6, 3, 2])
      expect(teamB!.members.map((m) => m.weight)).toEqual([5, 4, 1])
      expect(totalWeight(teamA!.members)).toBe(11)
      expect(totalWeight(teamB!.members)).toBe(10)
    })

    it('mantém o peso total das equipes próximo mesmo com muitos jogadores', () => {
      const weights = Array.from({ length: 20 }, (_, i) => (i % 5) + 1)
      const players = weights.map((weight) => makePlayer(weight))
      const drawer = new TeamDrawer(players, 5)
      const teams = teamOf(drawer, 'balanced')

      const totals = teams.map((t) => totalWeight(t.members))
      expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(2)
    })
  })

  describe('equilíbrio de gênero', () => {
    it('distribui homens e mulheres proporcionalmente quando os times têm o mesmo tamanho', () => {
      const players = [
        ...Array.from({ length: 4 }, () => makePlayer(3, 'M')),
        ...Array.from({ length: 2 }, () => makePlayer(3, 'F')),
      ]
      const drawer = new TeamDrawer(players, 3)
      const teams = teamOf(drawer, 'balanced')

      teams.forEach((team) => {
        expect(genderCounts(team.members)).toEqual({ male: 2, female: 1 })
      })
    })

    it('usa o método dos maiores restos quando a divisão de gênero não é exata', () => {
      // 8 jogadores (5 homens, 3 mulheres) em 2 equipes de 4: a cota "ideal"
      // de mulheres por equipe seria 1.5, então uma equipe fica com 2 e a
      // outra com 1, mas a soma total de cada gênero continua correta.
      const players = [
        ...Array.from({ length: 5 }, () => makePlayer(3, 'M')),
        ...Array.from({ length: 3 }, () => makePlayer(3, 'F')),
      ]
      const drawer = new TeamDrawer(players, 4)
      const teams = teamOf(drawer, 'balanced')

      const counts = teams.map((t) => genderCounts(t.members))
      expect(counts.map((c) => c.female).sort()).toEqual([1, 2])
      expect(counts.reduce((sum, c) => sum + c.female, 0)).toBe(3)
      expect(counts.reduce((sum, c) => sum + c.male, 0)).toBe(5)
    })

    it('também equilibra gênero no sorteio aleatório', () => {
      const players = [
        ...Array.from({ length: 4 }, () => makePlayer(3, 'M')),
        ...Array.from({ length: 2 }, () => makePlayer(3, 'F')),
      ]
      const drawer = new TeamDrawer(players, 3)
      const teams = teamOf(drawer, 'random')

      teams.forEach((team) => {
        expect(genderCounts(team.members)).toEqual({ male: 2, female: 1 })
      })
    })

    it('trata jogadoras como a menor equipe quando os tamanhos das equipes são desiguais', () => {
      // 7 jogadores (5 homens, 2 mulheres) em times de até 3: sizes = [3, 3, 1].
      // A equipe menor (tamanho 1) não recebe mulher; as outras duas dividem as 2.
      const players = [
        ...Array.from({ length: 5 }, () => makePlayer(3, 'M')),
        ...Array.from({ length: 2 }, () => makePlayer(3, 'F')),
      ]
      const drawer = new TeamDrawer(players, 3)
      const teams = teamOf(drawer, 'balanced')

      const smallestTeam = [...teams].sort(
        (a, b) => a.members.length - b.members.length,
      )[0]!
      expect(genderCounts(smallestTeam.members).female).toBe(0)

      const totalFemale = teams.reduce(
        (sum, t) => sum + genderCounts(t.members).female,
        0,
      )
      expect(totalFemale).toBe(2)
    })
  })

  describe('restrição de "não pode jogar junto"', () => {
    it('nunca coloca dois jogadores com regra de restrição na mesma equipe', () => {
      const players = Array.from({ length: 8 }, () => makePlayer(3))
      const [playerA, playerB] = players
      const rules = [rule(playerA!, playerB!)]

      const drawer = new TeamDrawer(players, 4, rules)
      const teams = teamOf(drawer, 'balanced')

      const teamOfPlayer = (id: string) =>
        teams.findIndex((t) => t.members.some((m) => m.id === id))

      expect(teamOfPlayer(playerA!.id)).not.toBe(teamOfPlayer(playerB!.id))
    })

    it('lança erro quando as restrições tornam o sorteio impossível', () => {
      // 3 jogadores que não podem jogar juntos entre si (clique completo),
      // mas o tamanho de equipe força pelo menos 2 deles na mesma equipe.
      const [a, b, c] = Array.from({ length: 3 }, () => makePlayer(3))
      const rules = [rule(a!, b!), rule(a!, c!), rule(b!, c!)]

      const drawer = new TeamDrawer([a!, b!, c!], 2, rules)

      expect(() => teamOf(drawer, 'balanced')).toThrow(
        'Não foi possível montar equipes com as restrições atuais. Revise as regras de jogadores que não podem jogar juntos.',
      )
    })
  })
})
