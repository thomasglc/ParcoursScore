import { ref, shallowRef, computed, readonly } from 'vue'
import * as XLSX from 'xlsx'

export type RawRow = (string | number | null | undefined)[]

export interface CandidatRow {
  index: number
  raw: RawRow
  noteNiveau: string | number
  noteComportement: string | number
  noteMotivation: string | number
  remarque: string | number
}

export interface DisplayCols {
  nom: number
  prenom: number
  serie: number
}

export interface EvaluationData {
  noteNiveau: string | number
  noteComportement: string | number
  noteMotivation: string | number
  remarque: string | number
}

const COL_NIVEAU = 26
const COL_COMPORTEMENT = 27
const COL_MOTIVATION = 28
const COL_REMARQUE = 29

const COL_CODE = 3 // "Candidat - Code"

type SavedEvals = Record<string, EvaluationData>

function storageKey(fileName: string) { return `parcoursscore:${fileName}` }

function persistEvals(fileName: string, data: RawRow[]) {
  const saved: SavedEvals = {}
  data.slice(1).forEach(row => {
    const code = String(row[COL_CODE] ?? '')
    if (!code) return
    saved[code] = {
      noteNiveau: row[COL_NIVEAU] ?? '',
      noteComportement: row[COL_COMPORTEMENT] ?? '',
      noteMotivation: row[COL_MOTIVATION] ?? '',
      remarque: row[COL_REMARQUE] ?? '',
    }
  })
  try { localStorage.setItem(storageKey(fileName), JSON.stringify(saved)) } catch {}
}

function restoreEvals(fileName: string, data: RawRow[]) {
  try {
    const raw = localStorage.getItem(storageKey(fileName))
    if (!raw) return
    const saved: SavedEvals = JSON.parse(raw)
    data.slice(1).forEach(row => {
      const code = String(row[COL_CODE] ?? '')
      const e = saved[code]
      if (!e) return
      while (row.length <= COL_REMARQUE) row.push(undefined)
      row[COL_NIVEAU] = e.noteNiveau
      row[COL_COMPORTEMENT] = e.noteComportement
      row[COL_MOTIVATION] = e.noteMotivation
      row[COL_REMARQUE] = e.remarque
    })
  } catch {}
}

export function useCandidats() {
  const rows = ref<RawRow[]>([])
  const selectedIndex = shallowRef(0)
  let currentFileName = ''

  const headers = computed<RawRow>(() => rows.value[0] ?? [])

  const candidats = computed<CandidatRow[]>(() =>
    rows.value.slice(1).map((row, i) => ({
      index: i,
      raw: row,
      noteNiveau: row[COL_NIVEAU] ?? '',
      noteComportement: row[COL_COMPORTEMENT] ?? '',
      noteMotivation: row[COL_MOTIVATION] ?? '',
      remarque: row[COL_REMARQUE] ?? '',
    }))
  )

  const selectedCandidat = computed<CandidatRow | null>(
    () => candidats.value[selectedIndex.value] ?? null
  )

  const hasData = computed(() => rows.value.length > 1)

  const displayCols = computed<DisplayCols>(() => {
    const h = (headers.value as RawRow).map(v =>
      String(v ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    )

    function findCol(...terms: string[]): number {
      for (const t of terms) {
        const i = h.findIndex(x => x === t)
        if (i !== -1) return i
      }
      for (const t of terms) {
        const i = h.findIndex(x => x.includes(t))
        if (i !== -1) return i
      }
      return -1
    }

    const nomIdx = h.findIndex(x => /\bnom\b/.test(x) && !/prenom/.test(x))
    const prenomIdx = findCol('prenom', 'firstname')
    const serieIdx = findCol('serie du diplome', 'serie', 'diplome', 'bac')

    return {
      nom: nomIdx !== -1 ? nomIdx : 1,
      prenom: prenomIdx !== -1 ? prenomIdx : 2,
      serie: serieIdx !== -1 ? serieIdx : 3,
    }
  })

  async function loadFile(file: File): Promise<void> {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]!]!

    // Parcoursup exports set !ref to the full sheet (1 048 576 rows).
    // Re-derive !ref from actual cell keys to avoid processing millions of empty rows.
    const cellKeys = Object.keys(ws).filter(k => !k.startsWith('!'))
    if (cellKeys.length > 0) {
      let maxRow = 0
      let maxCol = 0
      for (const key of cellKeys) {
        const addr = XLSX.utils.decode_cell(key)
        if (addr.r > maxRow) maxRow = addr.r
        if (addr.c > maxCol) maxCol = addr.c
      }
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } })
    }

    const data = XLSX.utils.sheet_to_json<RawRow>(ws, { header: 1, defval: '' })
    currentFileName = file.name
    restoreEvals(currentFileName, data)
    rows.value = data
    selectedIndex.value = 0
  }

  function updateEvaluation(index: number, data: EvaluationData): void {
    const row = rows.value[index + 1]
    if (!row) return
    while (row.length <= COL_REMARQUE) row.push(undefined)
    row[COL_NIVEAU] = data.noteNiveau
    row[COL_COMPORTEMENT] = data.noteComportement
    row[COL_MOTIVATION] = data.noteMotivation
    row[COL_REMARQUE] = data.remarque
    if (currentFileName) persistEvals(currentFileName, rows.value)
  }

  function exportFile(originalName: string): void {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows.value)
    XLSX.utils.book_append_sheet(wb, ws, 'Candidats')
    const baseName = originalName.replace(/\.[^.]+$/, '')
    XLSX.writeFile(wb, `${baseName}_evalue.xlsx`)
  }

  function select(index: number): void {
    selectedIndex.value = index
  }

  function selectPrev(): void {
    if (selectedIndex.value > 0) selectedIndex.value--
  }

  function selectNext(): void {
    if (selectedIndex.value < candidats.value.length - 1) selectedIndex.value++
  }

  return {
    headers,
    candidats,
    selectedCandidat,
    selectedIndex: readonly(selectedIndex),
    hasData,
    displayCols,
    loadFile,
    updateEvaluation,
    exportFile,
    select,
    selectPrev,
    selectNext,
  }
}
