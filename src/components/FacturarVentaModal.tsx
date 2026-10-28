import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, CheckCircle2, XCircle, FileText, Eye } from 'lucide-react'
import api from '../lib/api'
import { abrirPdfVenta } from '../lib/comprobante'
import Modal from './Modal'
import BotonWhatsappVenta from './BotonWhatsappVenta'
import { Cliente, Comprobante, SimulacionFactura, CONDICIONES_IVA_CLIENTE } from '../types'

const fmt = (n: number) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function FacturarVentaModal({ ventaId, ventaTotal, onClose, onSuccess }: {
  ventaId: number
  ventaTotal: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [modo, setModo] = useState<'consumidor' | 'existente' | 'nuevo'>('consumidor')
  const [idCliente, setIdCliente] = useState('')
  const [error, setError] = useState('')
  const [nuevo, setNuevo] = useState({ nombre: '', cuit: '', condicionIva: '', domicilio: '', telefono: '', email: '' })
  const [nuevoId, setNuevoId] = useState<number | null>(null)
  const [idClienteEmitir, setIdClienteEmitir] = useState<number | undefined>(undefined)
  const [vista, setVista] = useState<'receptor' | 'preview'>('receptor')
  const [simulacion, setSimulacion] = useState<SimulacionFactura | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [emitDirecto, setEmitDirecto] = useState(false)
  const [emitido, setEmitido] = useState<Comprobante | null>(null)
  const [abriendo, setAbriendo] = useState(false)

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => (await api.get('/clientes')).data,
  })

  /** Resuelve el cliente a facturar; en modo "nuevo" lo crea (una vez) o actualiza. */
  const resolverIdCliente = async (): Promise<number | undefined> => {
    if (modo === 'existente') return idCliente ? Number(idCliente) : undefined
    if (modo === 'nuevo') {
      if (nuevoId) {
        await api.patch(`/clientes/${nuevoId}`, nuevo)
        return nuevoId
      }
      const creado = (await api.post('/clientes', nuevo)).data
      setNuevoId(creado.id)
      return creado.id
    }
    return undefined
  }

  const verPreview = async () => {
    setSimulando(true)
    setError('')
    try {
      const id = await resolverIdCliente()
      setIdClienteEmitir(id)
      const sim = (await api.post(
        `/facturacion/ventas/${ventaId}/simulacion`,
        id ? { idCliente: id } : {},
      )).data as SimulacionFactura
      setSimulacion(sim)
      setVista('preview')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo simular el comprobante')
    } finally {
      setSimulando(false)
    }
  }

  const emitir = useMutation({
    mutationFn: async (idCliente?: number) =>
      (await api.post(
        `/facturacion/ventas/${ventaId}/emitir`,
        idCliente ? { idCliente } : {},
      )).data as Comprobante,
    onSuccess: (data) => {
      setError('')
      setEmitido(data)
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Error al facturar'),
    onSettled: () => setEmitDirecto(false),
  })

  const emitirDirecto = async () => {
    setEmitDirecto(true)
    setError('')
    try {
      const id = await resolverIdCliente()
      emitir.mutate(id)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al facturar')
      setEmitDirecto(false)
    }
  }

  const verComprobante = async () => {
    setAbriendo(true)
    setError('')
    try {
      await abrirPdfVenta(ventaId, 'original')
    } catch (e: any) {
      setError(e?.message || 'No se pudo generar el PDF')
    } finally {
      setAbriendo(false)
    }
  }

  if (emitido) {
    const aprobado = emitido.estado === 'aprobado'
    return (
      <Modal
        title={aprobado ? 'Comprobante emitido' : 'Comprobante rechazado'}
        onClose={onSuccess}
        footer={
          <>
            {aprobado && (
              <button type="button" onClick={verComprobante} disabled={abriendo} className="btn-secondary">
                {abriendo ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} strokeWidth={2} />}
                Ver comprobante
              </button>
            )}
            {aprobado && <BotonWhatsappVenta ventaId={ventaId} conEtiqueta />}
            <button type="button" onClick={onSuccess} className="btn-primary">
              Cerrar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {aprobado ? (
            <>
              <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-medium">
                <CheckCircle2 size={18} /> ARCA autorizó el comprobante.
              </p>
              <dl className="text-sm space-y-1.5">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Punto de venta</dt>
                  <dd className="font-mono font-medium text-gray-900 dark:text-white">{String(emitido.puntoVenta).padStart(4, '0')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Comprobante N°</dt>
                  <dd className="font-mono font-medium text-gray-900 dark:text-white">{String(emitido.nroComprobante).padStart(8, '0')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">CAE</dt>
                  <dd className="font-mono font-medium text-gray-900 dark:text-white">{emitido.cae}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-gray-400">Vencimiento CAE</dt>
                  <dd className="font-mono font-medium text-gray-900 dark:text-white">{emitido.caeVencimiento}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <XCircle size={18} className="shrink-0 mt-0.5" />
              <span>{emitido.mensajeError || 'ARCA rechazó el comprobante.'}</span>
            </p>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </Modal>
    )
  }

  if (vista === 'preview' && simulacion) {
    return (
      <Modal
        title={`Vista previa — Factura ${simulacion.letra}`}
        onClose={onClose}
        size="2xl"
        footer={
          <>
            <button type="button" onClick={() => setVista('receptor')} className="btn-secondary">Volver</button>
            <button
              type="button"
              onClick={() => emitir.mutate(idClienteEmitir)}
              disabled={emitir.isPending}
              className="btn-primary"
            >
              {emitir.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Emitir comprobante'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-1">
            <p className="font-semibold text-gray-900 dark:text-white">
              Factura {simulacion.letra} · Punto de venta {String(simulacion.puntoVenta).padStart(4, '0')}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {simulacion.empresa.razonSocial} (CUIT {simulacion.empresa.cuit})
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Receptor: <span className="font-medium">{simulacion.receptor.nombre}</span>
              {simulacion.receptor.cuit && <span className="font-mono"> · CUIT {simulacion.receptor.cuit}</span>}
              <span className="text-gray-500 dark:text-gray-400"> · {simulacion.receptor.condicionIva}</span>
            </p>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {simulacion.items.map((it, i) => (
              <li key={i} className="py-2 flex items-start gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{it.descripcion}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                    {it.cantidad} × {fmt(it.precioUnitarioNeto)} + IVA {it.alicuotaIva}%
                  </p>
                </div>
                <span className="font-mono tabular-nums text-gray-700 dark:text-gray-200">
                  {fmt(it.subtotalConIva)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="text-sm space-y-1 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Subtotal (neto)</dt>
              <dd className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(simulacion.netoGravado)}</dd>
            </div>
            {simulacion.ivaPorAlicuota.map(a => (
              <div key={a.id} className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-gray-400">IVA {a.alicuota}%</dt>
                <dd className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(a.importe)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 pt-1">
              <dt className="font-semibold text-gray-900 dark:text-white">Total</dt>
              <dd className="font-mono tabular-nums font-bold text-gray-900 dark:text-white">{fmt(simulacion.impTotal)}</dd>
            </div>
          </dl>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Vista previa sin validez fiscal: el número de comprobante y el CAE se asignan al emitir.
          </p>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title={`Facturar venta #${ventaId}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            type="button"
            onClick={verPreview}
            disabled={simulando || emitir.isPending || emitDirecto || (modo === 'nuevo' && !nuevo.nombre.trim())}
            className="btn-secondary"
          >
            {simulando ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} strokeWidth={2} />}
            Vista previa
          </button>
          <button
            type="button"
            onClick={emitirDirecto}
            disabled={emitDirecto || emitir.isPending || simulando || (modo === 'nuevo' && !nuevo.nombre.trim())}
            className="btn-primary"
          >
            {emitDirecto || emitir.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Emitir comprobante'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Total registrado: <span className="font-mono font-semibold">{fmt(ventaTotal)}</span>
        </p>

        <div>
          <label className="form-label">Receptor</label>
          <div className="flex flex-wrap gap-2">
            {([
              ['consumidor', 'Consumidor Final'],
              ['existente', 'Cliente existente'],
              ['nuevo', 'Nuevo cliente'],
            ] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${modo === m
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {modo === 'existente' && (
          <div>
            <label className="form-label">Cliente</label>
            <select value={idCliente} onChange={(e) => setIdCliente(e.target.value)} className="form-input">
              <option value="">Seleccione...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}{c.cuit ? ` (${c.cuit})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {modo === 'nuevo' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="form-label">Nombre / Razón Social *</label>
              <input
                type="text"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">CUIT</label>
              <input
                type="text"
                value={nuevo.cuit}
                onChange={(e) => setNuevo({ ...nuevo, cuit: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Condición IVA</label>
              <select
                value={nuevo.condicionIva}
                onChange={(e) => setNuevo({ ...nuevo, condicionIva: e.target.value })}
                className="form-input"
              >
                <option value="">Seleccione...</option>
                {CONDICIONES_IVA_CLIENTE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Domicilio</label>
              <input
                type="text"
                value={nuevo.domicilio}
                onChange={(e) => setNuevo({ ...nuevo, domicilio: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                value={nuevo.telefono}
                onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
                className="form-input"
                placeholder="Ej. 3465 123456"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={nuevo.email}
                onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </Modal>
  )
}
