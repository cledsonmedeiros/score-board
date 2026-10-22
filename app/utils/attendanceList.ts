/**
 * Lista de presença colada do WhatsApp (ou uma lista simples, um nome por
 * linha): leitura do texto e casamento com os jogadores já cadastrados.
 * Funções puras; quem aplica o resultado é a store.
 */

/** Marcas de direção e BOM que o WhatsApp costuma inserir ao copiar texto. */
const INVISIBLE_CHARS = new RegExp(
  '[\\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069\\ufeff]',
  'g',
)

/**
 * Linha numerada: "1. Ana", "1) Ana", "02 - Ana", "4.Ana", "5 Ana".
 * Exige separador ou espaço após o número para que "21h vôlei" não conte.
 */
const NUMBERED_LINE = /^(\d{1,3})(?:\s*[.):\-–—]\s*|\s+)(.*)$/

/** Chave de comparação de nomes: ignora maiúsculas, acentos e espaços extras. */
export function attendanceMatchKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

/**
 * Extrai os nomes do texto. Se houver linhas numeradas, só elas contam (o
 * título e seções como "Suplentes" ficam de fora); sem numeração, cada linha
 * não vazia é um nome. Vagas em aberto e repetidos são descartados.
 */
export function parseAttendanceList(text: string): string[] {
  const lines = text
    .replace(INVISIBLE_CHARS, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const numbered = lines
    .map((line) => NUMBERED_LINE.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)

  const candidates =
    numbered.length > 0 ? numbered.map((match) => match[2]!.trim()) : lines

  const seen = new Set<string>()
  return candidates.filter((name) => {
    const key = attendanceMatchKey(name)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export interface AttendanceEntry {
  name: string
  /** Id do jogador já cadastrado com esse nome, ou `null` se for novo. */
  existingId: string | null
}

export interface AttendancePlan {
  entries: AttendanceEntry[]
  /** Jogadores cadastrados que não estão na lista. */
  disableIds: string[]
}

export function planAttendance(
  players: ReadonlyArray<{ id: string; name: string }>,
  names: string[],
): AttendancePlan {
  const idByKey = new Map<string, string>()
  players.forEach((player) => {
    const key = attendanceMatchKey(player.name)
    if (!idByKey.has(key)) idByKey.set(key, player.id)
  })

  const entries = names.map((name) => ({
    name,
    existingId: idByKey.get(attendanceMatchKey(name)) ?? null,
  }))

  const presentIds = new Set(entries.map((entry) => entry.existingId))
  const disableIds = players
    .filter((player) => !presentIds.has(player.id))
    .map((player) => player.id)

  return { entries, disableIds }
}
