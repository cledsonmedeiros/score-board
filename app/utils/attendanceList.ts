/**
 * Lista de presença colada do WhatsApp (ou uma lista simples, um nome por
 * linha): leitura do texto e casamento com os jogadores já cadastrados.
 * Funções puras; quem aplica o resultado é a store.
 */

/**
 * Linha numerada: "1. Ana", "1) Ana", "02 - Ana", "4.Ana", "5 Ana".
 * Exige separador ou espaço após o número para que "21h vôlei" não conte.
 */
const NUMBERED_LINE = /^(\d{1,3})(?:\s*[.):\-–—]\s*|\s+)(.*)$/

/**
 * Caracteres invisíveis em geral: formatação (zero-width, marcas de direção,
 * BOM), seletores de variação de emoji e os "espaços" de preenchimento
 * Hangul que aparecem em nomes de contato do WhatsApp.
 */
const HIDDEN_CHARS =
  /[\p{Cf}\u{FE00}-\u{FE0F}\u{115F}\u{1160}\u{3164}\u{FFA0}]/gu

/** Emoji e demais símbolos gráficos (✅, ⚽, 🏐...). */
const SYMBOLS = /[\p{Extended_Pictographic}\p{So}\p{Sk}]/gu

/** Anotações como "(pago)" ou "[goleira]" ao lado do nome na lista. */
const ANNOTATIONS = /\([^)]*\)|\[[^\]]*\]/g

/**
 * Nome como veio na lista, limpo para exibição e cadastro: sem invisíveis,
 * emoji, anotações, "~"/"@" iniciais e espaços repetidos.
 */
export function cleanAttendanceName(name: string): string {
  return name
    .replace(HIDDEN_CHARS, '')
    .replace(SYMBOLS, ' ')
    .replace(ANNOTATIONS, ' ')
    .replace(/^[\s~@]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Chave de comparação de nomes: ignora maiúsculas, acentos, invisíveis,
 * emoji, pontuação e espaços extras. Só letras e números contam.
 */
export function attendanceMatchKey(name: string): string {
  return name
    .replace(HIDDEN_CHARS, '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
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
    .replace(HIDDEN_CHARS, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const numbered = lines
    .map((line) => NUMBERED_LINE.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)

  const candidates = (
    numbered.length > 0 ? numbered.map((match) => match[2]!) : lines
  ).map(cleanAttendanceName)

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
