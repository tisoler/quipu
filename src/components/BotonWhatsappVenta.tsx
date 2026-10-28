import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Loader2 } from 'lucide-react'
import api from '../lib/api'
import Modal from './Modal'
import ClienteModal from './ClienteModal'
import { Cliente, Comprobante } from '../types'
import { normalizarTelefonoAR, linkWhatsapp, letraComprobante } from '../lib/comprobante'

const fmt = (n: number) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface VentaDetalle {
  venta: { id: number; total: number; tipoPago?: string | null; cliente?: Cliente | null }
  comprobante: Comprobante | null
}

export default function BotonWhatsappVenta({ ventaId, conEtiqueta = false }: {
  ventaId: number
  conEtiqueta?: boolean
}) {
  const [ocupado, setOcupado] = useState(false)
  const [datos, setDatos] = useState<VentaDetalle | null>(null)
  const [editarCliente, setEditarCliente] = useState<Cliente | null>(null)
  const [pedirTel, setPedirTel] = useState(false)
  const [telTemp, setTelTemp] = useState('')
  const queryClient = useQueryClient()

  const iniciar = async () => {
    setOcupado(true)
    try {
      const { data } = await api.get(`/facturacion/ventas/${ventaId}`)
      const tel = data.venta?.cliente?.telefono?.trim()
      if (tel) {
        await enviar(data, tel)
      } else if (data.venta?.cliente) {
        setDatos(data)
        setEditarCliente(data.venta.cliente)
      } else {
        setDatos(data)
        setTelTemp('')
        setPedirTel(true)
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'No se pudo preparar el envío')
    } finally {
      setOcupado(false)
    }
  }

  const enviar = async (data: VentaDetalle, telefono: string) => {
    const comp = data.comprobante
    if (!comp || comp.estado !== 'aprobado') {
      alert('La venta no tiene un comprobante aprobado para compartir')
      return
    }
    const tel = normalizarTelefonoAR(telefono)
    if (!tel) {
      alert('El número de teléfono no es válido')
      return
    }
    const letra = letraComprobante(comp.tipoComprobante)
    const pto = String(comp.puntoVenta).padStart(4, '0')
    const nro = String(comp.nroComprobante).padStart(8, '0')
    const total = comp.snapshot?.detalle?.impTotal ?? Number(data.venta.total)
    const nombre = data.venta.cliente?.nombre || 'cliente'

    // Publica el PDF y comparte su URL: funciona en WhatsApp Web (desktop)
    // y en la app (mobile), donde WhatsApp solo acepta texto.
    const { url } = (await api.post(`/facturacion/ventas/${ventaId}/pdf-url`)).data as { url: string }
    const texto = `Hola ${nombre}, te compartimos la Factura ${letra} ${pto}-${nro} por ${fmt(total)} (CAE ${comp.cae}): ${url}`
    window.open(linkWhatsapp(tel, texto), '_blank')
  }

  const finalizarEdicion = async (guardado: Cliente) => {
    setEditarCliente(null)
    queryClient.invalidateQueries({ queryKey: ['ventas'] })
    if (!datos) return
    if (guardado.telefono?.trim()) {
      setOcupado(true)
      try {
        await enviar(datos, guardado.telefono)
      } catch (e: any) {
        alert(e?.message || 'No se pudo compartir la factura')
      } finally {
        setOcupado(false)
        setDatos(null)
      }
    } else {
      setDatos(null)
    }
  }

  const confirmarTelefono = async () => {
    if (!telTemp.trim() || !datos) return
    setPedirTel(false)
    setOcupado(true)
    try {
      await enviar(datos, telTemp.trim())
    } catch (e: any) {
      alert(e?.message || 'No se pudo compartir la factura')
    } finally {
      setOcupado(false)
      setDatos(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void iniciar()}
        disabled={ocupado}
        title="Compartir por WhatsApp"
        aria-label="Compartir por WhatsApp"
        className="px-2.5 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 inline-flex items-center gap-1 disabled:opacity-60"
      >
        {ocupado ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
        {conEtiqueta && 'WhatsApp'}
      </button>

      {editarCliente && (
        <ClienteModal
          cliente={editarCliente}
          onClose={() => { setEditarCliente(null); setDatos(null) }}
          onSaved={(guardado) => void finalizarEdicion(guardado)}
        />
      )}

      {pedirTel && (
        <Modal
          title="Celular del cliente"
          onClose={() => { setPedirTel(false); setDatos(null) }}
          footer={
            <>
              <button type="button" onClick={() => { setPedirTel(false); setDatos(null) }} className="btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarTelefono()}
                disabled={!telTemp.trim() || ocupado}
                className="btn-primary"
              >
                Compartir
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            La venta es a consumidor final. Ingresá el celular para compartirle la factura.
          </p>
          <label className="form-label">Celular</label>
          <input
            type="tel"
            autoFocus
            value={telTemp}
            onChange={(e) => setTelTemp(e.target.value)}
            placeholder="Ej. 3465 123456"
            className="form-input"
          />
        </Modal>
      )}
    </>
  )
}
