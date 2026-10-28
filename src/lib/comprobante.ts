import api from './api'

export type CopiaComprobante = 'original' | 'duplicado' | 'triplicado'

/** Descarga el PDF del comprobante de una venta como Blob. */
export async function obtenerPdfVentaBlob(idVenta: number, copia: CopiaComprobante = 'original'): Promise<Blob> {
  try {
    const res = await api.get(`/facturacion/ventas/${idVenta}/pdf`, {
      params: { copia },
      responseType: 'blob',
    })
    return res.data as Blob
  } catch (e: any) {
    throw new Error(await mensajeErrorPdf(e))
  }
}

/** Descarga el PDF del comprobante de una venta y lo abre en una pestaña nueva. */
export async function abrirPdfVenta(idVenta: number, copia: CopiaComprobante = 'original'): Promise<void> {
  const blob = await obtenerPdfVentaBlob(idVenta, copia)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

async function mensajeErrorPdf(e: any): Promise<string> {
  try {
    const text = await e?.response?.data?.text?.()
    const parsed = text ? JSON.parse(text) : null
    const m = parsed?.message
    if (m) return Array.isArray(m) ? m.join(', ') : m
  } catch {
    /* respuesta no parseable: mensaje genérico */
  }
  return 'No se pudo generar el PDF'
}

/** Letra del comprobante a partir de su código AFIP (1=A, 6=B, 11=C). */
export function letraComprobante(tipoComprobante: number): string {
  if (tipoComprobante === 1) return 'A'
  if (tipoComprobante === 6) return 'B'
  if (tipoComprobante === 11) return 'C'
  return ''
}

/**
 * Normaliza un teléfono argentino para wa.me (solo dígitos con código país).
 * 03465 15-123456 -> 5493465123456 · 03465 421234 -> 543465421234.
 */
export function normalizarTelefonoAR(tel: string): string {
  let d = (tel || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('0')) d = d.slice(1)
  const movil = d.match(/^(\d{2,4})15(\d{6,8})$/)
  if (movil) return `549${movil[1]}${movil[2]}`
  if (d.startsWith('54')) return d
  return `54${d}`
}

export function linkWhatsapp(telefonoNormalizado: string, texto: string): string {
  return `https://wa.me/${telefonoNormalizado}?text=${encodeURIComponent(texto)}`
}
