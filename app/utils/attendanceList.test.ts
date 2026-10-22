import { describe, expect, it } from 'vitest'
import {
  attendanceMatchKey,
  parseAttendanceList,
  planAttendance,
} from './attendanceList'

const WHATSAPP_SAMPLE = `Vôlei sexta Cebase 21h

1. Kel
2. Lu
3. Fagner
4. Karol
5. Eloah
6. Mércia
7. Elisa
8. Vinicius`

describe('parseAttendanceList', () => {
  it('lê só as linhas numeradas de uma lista do WhatsApp, ignorando o título', () => {
    expect(parseAttendanceList(WHATSAPP_SAMPLE)).toEqual([
      'Kel',
      'Lu',
      'Fagner',
      'Karol',
      'Eloah',
      'Mércia',
      'Elisa',
      'Vinicius',
    ])
  })

  it('aceita variações de numeração', () => {
    const text = '1) Ana\n02 - Bia\n3- Caio\n4.Duda\n5 Edu\n6: Fê\n7 – Gil'
    expect(parseAttendanceList(text)).toEqual([
      'Ana',
      'Bia',
      'Caio',
      'Duda',
      'Edu',
      'Fê',
      'Gil',
    ])
  })

  it('ignora vagas em aberto (número sem nome)', () => {
    expect(parseAttendanceList('1. Ana\n2.\n3. \n4. Bia')).toEqual([
      'Ana',
      'Bia',
    ])
  })

  it('ignora linhas não numeradas quando há numeração (ex.: suplentes)', () => {
    const text = 'Jogo\n1. Ana\n2. Bia\nSuplentes:\nCaio'
    expect(parseAttendanceList(text)).toEqual(['Ana', 'Bia'])
  })

  it('sem nenhuma numeração, cada linha não vazia vira um nome', () => {
    expect(parseAttendanceList('João\n\n  Maria  \nPedro')).toEqual([
      'João',
      'Maria',
      'Pedro',
    ])
  })

  it('não confunde título que começa com horário com linha numerada', () => {
    expect(parseAttendanceList('21h vôlei\n1. Ana')).toEqual(['Ana'])
  })

  it('remove caracteres invisíveis que o WhatsApp insere ao copiar', () => {
    const LRM = String.fromCodePoint(0x200e)
    const RLM = String.fromCodePoint(0x200f)
    const BOM = String.fromCodePoint(0xfeff)
    expect(parseAttendanceList(`${LRM}1. Ana${RLM}\n${BOM}2. Bia`)).toEqual([
      'Ana',
      'Bia',
    ])
  })

  it('descarta nomes repetidos, mantendo a primeira ocorrência', () => {
    expect(parseAttendanceList('1. Ana\n2. ana\n3. Ána\n4. Bia')).toEqual([
      'Ana',
      'Bia',
    ])
  })

  it('aceita quebras de linha do Windows', () => {
    expect(parseAttendanceList('1. Ana\r\n2. Bia\r\n')).toEqual(['Ana', 'Bia'])
  })
})

describe('attendanceMatchKey', () => {
  it('ignora maiúsculas, acentos e espaços extras', () => {
    expect(attendanceMatchKey('  Mércia  Silva ')).toBe(
      attendanceMatchKey('mercia silva'),
    )
  })
})

describe('planAttendance', () => {
  const players = [
    { id: 'p1', name: 'Mercia' },
    { id: 'p2', name: 'KEL' },
    { id: 'p3', name: 'Rafael' },
  ]

  it('marca quem já existe, quem é novo e quem deve ser desabilitado', () => {
    const plan = planAttendance(players, ['Kel', 'Mércia', 'Lu'])

    expect(plan.entries).toEqual([
      { name: 'Kel', existingId: 'p2' },
      { name: 'Mércia', existingId: 'p1' },
      { name: 'Lu', existingId: null },
    ])
    expect(plan.disableIds).toEqual(['p3'])
  })

  it('lista vazia não casa ninguém e desabilita todos', () => {
    const plan = planAttendance(players, [])
    expect(plan.entries).toEqual([])
    expect(plan.disableIds).toEqual(['p1', 'p2', 'p3'])
  })
})
