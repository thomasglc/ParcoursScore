import { ref, shallowRef, computed } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import PdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PDFDocumentProxy } from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfjsWorkerUrl

export interface DossierRange {
  start: number
  end: number
}

export function usePdf() {
  const pdfDoc = shallowRef<PDFDocumentProxy | null>(null)
  const pdfSelected = shallowRef(false)
  const isPdfParsing = shallowRef(false)
  const dossierIndex = ref<Record<string, DossierRange>>({})
  const searching = ref<Set<string>>(new Set())

  const hasPdf = computed(() => pdfSelected.value)

  async function loadPdf(file: File): Promise<void> {
    pdfSelected.value = true
    isPdfParsing.value = true
    const buffer = await file.arrayBuffer()
    pdfDoc.value = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    isPdfParsing.value = false
  }

  async function getCode(
    doc: PDFDocumentProxy,
    p: number,
    cache: Map<number, string | null>
  ): Promise<string | null> {
    if (p < 1 || p > doc.numPages) return null
    if (cache.has(p)) return cache.get(p)!
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const text = (content.items as { str: string }[]).map(i => i.str).join('')
    // Matches "N°XXXXX" (header) and "Dossier n°XXXXX" (footer) — uniquely identifies a dossier
    const code = text.match(/°(\d{5,7})/)?.[1] ?? null
    cache.set(p, code)
    return code
  }

  async function findRange(doc: PDFDocumentProxy, targetCode: string): Promise<DossierRange | null> {
    const total = doc.numPages
    const target = parseInt(targetCode, 10)
    if (isNaN(target)) return null

    const cache = new Map<number, string | null>()
    const gc = (p: number) => getCode(doc, p, cache)

    // Binary search — codes are numerically sorted in the PDF
    let lo = 1, hi = total
    while (hi - lo > 15) {
      const mid = Math.floor((lo + hi) / 2)
      const code = await gc(mid)
      const n = code ? parseInt(code, 10) : null

      if (n === null) {
        // Inner page with no readable code — try a neighbour
        const near = await gc(mid - 4) ?? await gc(mid + 4)
        if (!near) { lo = mid + 1; continue }
        parseInt(near) <= target ? (lo = mid + 1) : (hi = mid)
      } else if (n < target) {
        lo = mid + 1
      } else if (n > target) {
        hi = mid
      } else {
        // Found — dossier start is at or before mid
        hi = mid
        lo = Math.max(1, mid - 12)
        break
      }
    }

    // Linear scan in the narrowed window to find exact page range
    let startPage = -1, endPage = -1
    for (let p = Math.max(1, lo - 5); p <= Math.min(total, hi + 12); p++) {
      const code = await gc(p)
      if (code === targetCode) {
        if (startPage === -1) startPage = p
        endPage = p
      } else if (startPage !== -1) {
        break
      }
    }

    if (startPage === -1) return null
    return { start: startPage, end: endPage }
  }

  function getDossierRange(code: string | number): DossierRange | null {
    const key = String(code)
    if (dossierIndex.value[key]) return dossierIndex.value[key]
    if (!pdfDoc.value || searching.value.has(key)) return null

    searching.value = new Set([...searching.value, key])
    findRange(pdfDoc.value, key).then(range => {
      if (range) dossierIndex.value = { ...dossierIndex.value, [key]: range }
      const next = new Set(searching.value)
      next.delete(key)
      searching.value = next
    })
    return null
  }

  function isSearching(code: string | number): boolean {
    return searching.value.has(String(code))
  }

  return {
    pdfDoc,
    hasPdf,
    isPdfParsing,
    loadPdf,
    getDossierRange,
    isSearching,
  }
}
