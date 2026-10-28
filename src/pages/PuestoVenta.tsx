import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Store,
  LockKeyhole,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Landmark,
  Banknote,
  QrCode,
  NotebookText,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import api from '../lib/api'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import DesglosePagos from '../components/DesglosePagos'
import FacturarVentaModal from '../components/FacturarVentaModal'
import { useAuth } from '../contexts/AuthContext'
import { CajaPuesto, EstadoCaja, ProductoPuesto, VentaCaja, TipoPago, ETIQUETAS_TIPO_PAGO } from '../types'

interface MiCajaResponse {
  caja: CajaPuesto | null
  ventas: VentaCaja[]
  totalVendido: number
}

interface ItemCarrito {
  producto: ProductoPuesto
  cantidad: number
}

const fmt = (n: number) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const errorMessage = (error: unknown) =>
  (error as any)?.response?.data?.message || 'Ocurrió un error inesperado'

// Replica visual del desglose fiscal del backend (solo informativo;
// los importes oficiales los calcula el servidor al emitir).
function desgloseLinea(producto: ProductoPuesto, cantidad: number) {
  const base = cantidad * producto.precio
  const alicuota = Number(producto.alicuotaIva ?? 21)
  if (producto.precioConIva && alicuota > 0) {
    const neto = base / (1 + alicuota / 100)
    return { neto, iva: base - neto, total: base, alicuota }
  }
  return { neto: base, iva: base * (alicuota / 100), total: base * (1 + alicuota / 100), alicuota }
}

function desglosarCarrito(items: ItemCarrito[]) {
  let neto = 0
  let total = 0
  for (const i of items) {
    const d = desgloseLinea(i.producto, i.cantidad)
    neto += d.neto
    total += d.total
  }
  return { neto, iva: total - neto, total }
}

export default function PuestoVenta() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery<MiCajaResponse>({
    queryKey: ['mi-caja'],
    queryFn: async () => {
      const response = await api.get('/puestos/mi-caja')
      return response.data
    },
  })

  if (isLoading) return <Loading />

  if (isError) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage(error)}</p>
      </div>
    )
  }

  const caja = data?.caja ?? null

  if (!caja) return <AbrirCaja />
  if (caja.estado === EstadoCaja.CERRADA) return <CajaCerrada caja={caja} />

  return (
    <CajaAbierta
      caja={caja}
      ventas={data?.ventas ?? []}
      totalVendido={data?.totalVendido ?? 0}
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['mi-caja'] })}
    />
  )
}

/* ---------- Estado 1: sin caja, permitir abrir ---------- */

function AbrirCaja() {
  const queryClient = useQueryClient()
  const [idAlmacen, setIdAlmacen] = useState('')
  const [errorApertura, setErrorApertura] = useState('')

  const { data: almacenes = [] } = useQuery({
    queryKey: ['almacenes'],
    queryFn: async () => (await api.get('/almacenes')).data,
  })

  const abrirMutation = useMutation({
    mutationFn: async () => (await api.post('/puestos/abrir', { idAlmacen: Number(idAlmacen) })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-caja'] })
    },
    onError: (err) => setErrorApertura(errorMessage(err)),
  })

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-4">
            <Store size={28} strokeWidth={1.6} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Abrir puesto de venta</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Se abrirá una caja nueva para el día de hoy.
          </p>
        </div>

        <label className="form-label">Almacén del puesto</label>
        <select
          value={idAlmacen}
          onChange={(e) => setIdAlmacen(e.target.value)}
          className="form-input"
        >
          <option value="">Seleccione...</option>
          {almacenes.map((a: any) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>

        {errorApertura && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorApertura}</p>
        )}

        <button
          onClick={() => abrirMutation.mutate()}
          disabled={!idAlmacen || abrirMutation.isPending}
          className="btn-primary w-full mt-6"
        >
          {abrirMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} strokeWidth={2} />}
          Abrir caja
        </button>
      </div>
    </div>
  )
}

/* ---------- Estado 2: caja cerrada hoy, solo resumen ---------- */

function CajaCerrada({ caja }: { caja: CajaPuesto }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card w-full max-w-lg p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 flex items-center justify-center mb-4">
            <LockKeyhole size={26} strokeWidth={1.6} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Caja cerrada</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cerraste la caja a las {new Date(caja.fechaCierre!).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.
            Solo un administrador puede rehabilitarla.
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          <FilaResumen label="Total vendido (sistema)" valor={fmt(Number(caja.totalVendido))} />
          <FilaResumen label="Dinero declarado" valor={fmt(Number(caja.montoDeclarado ?? 0))} />
          {Number(caja.faltante ?? 0) > 0 && (
            <FilaResumen label="Faltante" valor={fmt(Number(caja.faltante))} clase="text-red-600 dark:text-red-400" />
          )}
          {Number(caja.sobrante ?? 0) > 0 && (
            <FilaResumen label="Sobrante" valor={fmt(Number(caja.sobrante))} clase="text-amber-600 dark:text-amber-400" />
          )}
          <FilaResumen
            label="Transferido a caja central"
            valor={fmt(Number(caja.montoTransferido ?? 0))}
            clase="font-semibold text-gray-900 dark:text-white"
          />
        </dl>

        {caja.totalesPorPago && Object.keys(caja.totalesPorPago).length > 0 && (
          <div className="mt-5 border-t border-gray-100 dark:border-gray-700/50 pt-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Por medio de pago</p>
            <DesglosePagos totales={caja.totalesPorPago} />
          </div>
        )}
      </div>
    </div>
  )
}

function FilaResumen({ label, valor, clase }: { label: string; valor: string; clase?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={clsx('font-medium text-gray-700 dark:text-gray-200 font-mono tabular-nums', clase)}>{valor}</dd>
    </div>
  )
}

/* ---------- Estado 3: caja abierta, POS ---------- */

function CajaAbierta({
  caja,
  ventas,
  totalVendido,
  onRefresh,
}: {
  caja: CajaPuesto
  ventas: VentaCaja[]
  totalVendido: number
  onRefresh: () => void
}) {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [tipoPago, setTipoPago] = useState<TipoPago | null>(null)
  const [modalCerrar, setModalCerrar] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [ventaParaFacturar, setVentaParaFacturar] = useState<{ id: number; total: number } | null>(null)
  const { permisos, user } = useAuth()
  const esRI = (user?.condicionIvaEmpresa || '').includes('Responsable Inscripto')

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(''), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  const agregar = (producto: ProductoPuesto) => {
    setCarrito(prev => {
      const existente = prev.find(i => i.producto.id === producto.id)
      if (existente) {
        if (existente.cantidad >= producto.stockPuesto) return prev
        return prev.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  const cambiarCantidad = (idProducto: number, delta: number) => {
    setCarrito(prev =>
      prev
        .map(i => i.producto.id === idProducto ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter(i => i.cantidad > 0),
    )
  }

  const totalCarrito = carrito.reduce((acc, i) => acc + i.cantidad * i.producto.precio, 0)
  const desglose = desglosarCarrito(carrito)

  return (
    <div>
      {/* Barra superior de la caja */}
      <div className="card px-6 py-5 mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center">
            <Store size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Puesto de venta</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {caja.almacen?.nombre} · abierta {new Date(caja.fechaApertura).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 ml-auto">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Vendido hoy</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white font-mono tabular-nums">{fmt(totalVendido)}</p>
          </div>
          <button onClick={() => setModalCerrar(true)} className="btn-secondary">
            <LockKeyhole size={16} strokeWidth={2} />
            Cerrar caja
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3">
        {/* Búsqueda de productos */}
        <Buscador idCaja={caja.id} onAgregar={agregar} />

        {/* Venta en curso y ventas del día */}
        <div className="space-y-3">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Venta en curso</h2>

            {carrito.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
                Buscá un producto y agregalo acá.
              </p>
            ) : (
              <ul className="space-y-3 mb-4">
                {carrito.map(item => {
                  const d = esRI ? desgloseLinea(item.producto, item.cantidad) : null
                  return (
                  <li key={item.producto.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.producto.nombre}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                        {fmt(item.producto.precio)} × {item.cantidad}
                        {d && (
                          <span> · IVA {d.alicuota}% ({fmt(d.iva)})</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BotonCantidad onClick={() => cambiarCantidad(item.producto.id, -1)} aria="Quitar uno">
                        <Minus size={18} />
                      </BotonCantidad>
                      <span className="w-8 text-center text-base font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
                        {item.cantidad}
                      </span>
                      <BotonCantidad
                        onClick={() => cambiarCantidad(item.producto.id, 1)}
                        disabled={item.cantidad >= item.producto.stockPuesto}
                        aria="Sumar uno"
                      >
                        <Plus size={18} />
                      </BotonCantidad>
                    </div>
                    {d ? (
                      <div className="w-24 text-right shrink-0">
                        <p className="text-[11px] font-mono tabular-nums text-gray-400 dark:text-gray-500">{fmt(d.neto)}</p>
                        <p className="text-sm font-mono tabular-nums font-medium text-gray-700 dark:text-gray-200">{fmt(d.total)}</p>
                      </div>
                    ) : (
                      <span className="w-20 text-right text-sm font-mono tabular-nums text-gray-700 dark:text-gray-200">
                        {fmt(item.cantidad * item.producto.precio)}
                      </span>
                    )}
                  </li>
                  )
                })}
              </ul>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white font-mono tabular-nums">{fmt(totalCarrito)}</span>
              </div>
              {esRI && carrito.length > 0 && (
                <div className="mb-4 space-y-1 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                    <span className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(desglose.neto)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">IVA</span>
                    <span className="font-mono tabular-nums text-gray-700 dark:text-gray-200">{fmt(desglose.iva)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Total c/IVA (factura)</span>
                    <span className="font-mono tabular-nums font-semibold text-gray-900 dark:text-white">{fmt(desglose.total)}</span>
                  </div>
                </div>
              )}
              <ToggleTipoPago valor={tipoPago} onChange={setTipoPago} />
              <RegistrarVenta
                idCaja={caja.id}
                items={carrito}
                tipoPago={tipoPago}
                onRegistrado={(venta) => {
                  setCarrito([])
                  setTipoPago(null)
                  setFeedback('Venta registrada')
                  onRefresh()
                  if (permisos.includes('escritura:facturacion')) {
                    setVentaParaFacturar(venta)
                  }
                }}
              />
            </div>

            {feedback && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 size={15} /> {feedback}
              </p>
            )}
          </div>

          <VentasDelDia ventas={ventas} onRefresh={onRefresh} />
        </div>
      </div>

      {modalCerrar && (
        <CerrarCajaModal
          caja={caja}
          ventas={ventas}
          totalVendido={totalVendido}
          onClose={() => setModalCerrar(false)}
        />
      )}

      {ventaParaFacturar && (
        <FacturarVentaModal
          ventaId={ventaParaFacturar.id}
          ventaTotal={ventaParaFacturar.total}
          onClose={() => setVentaParaFacturar(null)}
          onSuccess={() => {
            setVentaParaFacturar(null)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

function BotonCantidad({ children, onClick, disabled, aria }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  aria: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
    >
      {children}
    </button>
  )
}

/* ---------- Medio de cobro ---------- */

const OPCIONES_PAGO: { valor: TipoPago; etiqueta: string; Icono: LucideIcon }[] = [
  { valor: TipoPago.TARJETA_CREDITO, etiqueta: 'T. crédito', Icono: CreditCard },
  { valor: TipoPago.TARJETA_DEBITO, etiqueta: 'T. débito', Icono: Landmark },
  { valor: TipoPago.EFECTIVO, etiqueta: 'Efectivo', Icono: Banknote },
  { valor: TipoPago.TRANSFERENCIA_QR, etiqueta: 'Transf. / QR', Icono: QrCode },
  { valor: TipoPago.CUENTA_CORRIENTE, etiqueta: 'Cta. corriente', Icono: NotebookText },
]

function IconoPago({ tipo, size = 15 }: { tipo: TipoPago; size?: number }) {
  const opcion = OPCIONES_PAGO.find(o => o.valor === tipo)
  const Icono = opcion?.Icono || Banknote
  return <Icono size={size} strokeWidth={1.8} />
}

function ToggleTipoPago({ valor, onChange }: { valor: TipoPago | null; onChange: (t: TipoPago) => void }) {
  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Medio de cobro *</p>
      {/* Toggle continuo sin gap: las opciones se reparten en 1 ó 2 líneas según el ancho */}
      <div className="flex flex-wrap rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
        {OPCIONES_PAGO.map(({ valor: v, etiqueta, Icono }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={clsx(
              'flex-1 min-w-[33%] flex flex-col items-center justify-center gap-1 px-2 py-3 -mr-px -mb-px border-r border-b border-gray-200 dark:border-gray-600 text-xs font-medium transition-colors',
              valor === v
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            )}
          >
            <Icono size={21} strokeWidth={1.8} className="shrink-0" />
            <span className="truncate w-full text-center">{etiqueta}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Buscador de productos con stock ---------- */

function Buscador({ idCaja, onAgregar }: { idCaja: number; onAgregar: (p: ProductoPuesto) => void }) {
  const [texto, setTexto] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(texto), 300)
    return () => clearTimeout(t)
  }, [texto])

  const { data: productos = [], isFetching } = useQuery<ProductoPuesto[]>({
    queryKey: ['puesto-productos', idCaja, debounced],
    queryFn: async () => {
      const response = await api.get('/puestos/productos', { params: { idCaja, search: debounced || undefined } })
      return response.data
    },
  })

  return (
    <div className="card p-6">
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre, código, talle o presentación..."
          className="form-input pl-10"
        />
        {isFetching && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
      </div>

      {productos.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          No se encontraron productos.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-[420px] overflow-y-auto -mx-2">
          {productos.map(p => {
            const sinStock = p.stockPuesto <= 0
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onAgregar(p)}
                  disabled={sinStock}
                  className={clsx(
                    'w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left transition-colors',
                    sinStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50/60 dark:hover:bg-blue-400/5',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {[p.codigo, p.presentacion, p.talle, p.color].filter(Boolean).join(' · ') || 'Sin detalles'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono tabular-nums">{fmt(p.precio)}</p>
                    <p className={clsx(
                      'text-xs tabular-nums',
                      sinStock ? 'text-red-500' : p.stockPuesto <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500',
                    )}>
                      Puesto: {p.stockPuesto} · Total: {p.stockGeneral}
                    </p>
                  </div>
                  {!sinStock && <Plus size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ---------- Registrar venta (batch) ---------- */

function RegistrarVenta({ idCaja, items, tipoPago, onRegistrado }: {
  idCaja: number
  items: ItemCarrito[]
  tipoPago: TipoPago | null
  onRegistrado: (venta: { id: number; total: number }) => void
}) {
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        tipoPago,
        items: items.map(i => ({ idProducto: i.producto.id, cantidad: i.cantidad, precio: i.producto.precio })),
      }
      return (await api.post(`/puestos/${idCaja}/ventas`, payload)).data
    },
    onSuccess: (data) => {
      setError('')
      onRegistrado({ id: data?.venta?.id, total: Number(data?.venta?.total ?? 0) })
    },
    onError: (err) => setError(errorMessage(err)),
  })

  return (
    <>
      <button
        onClick={() => mutation.mutate()}
        disabled={items.length === 0 || !tipoPago || mutation.isPending}
        className="btn-primary w-full"
      >
        {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} strokeWidth={2} />}
        Registrar venta
      </button>
      {!tipoPago && items.length > 0 && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">Elegí el medio de cobro para registrar.</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </>
  )
}

/* ---------- Ventas del día ---------- */

function VentasDelDia({ ventas, onRefresh }: { ventas: VentaCaja[]; onRefresh: () => void }) {
  const [error, setError] = useState('')

  const anularMutation = useMutation({
    mutationFn: async (idMovimiento: number) => (await api.delete(`/puestos/ventas/${idMovimiento}`)).data,
    onSuccess: () => {
      setError('')
      onRefresh()
    },
    onError: (err) => setError(errorMessage(err)),
  })

  return (
    <div className="card p-6">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Ventas registradas ({ventas.length})
      </h2>

      {ventas.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">Todavía no hay ventas en esta caja.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-[320px] overflow-y-auto">
          {ventas.map(v => (
            <li key={v.id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{v.producto?.nombre || `Producto #${v.idProducto}`}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-wrap">
                  <span>{new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>·</span>
                  <span>x {Math.abs(Number(v.cantidad))}</span>
                  {v.tipoPago && (
                    <>
                      <span>·</span>
                      <span title={ETIQUETAS_TIPO_PAGO[v.tipoPago]} className="inline-flex items-center gap-1">
                        <IconoPago tipo={v.tipoPago} size={12} />
                        {ETIQUETAS_TIPO_PAGO[v.tipoPago]}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <span className="text-sm font-mono tabular-nums text-gray-700 dark:text-gray-200">
                {fmt(Math.abs(Number(v.total)))}
              </span>
              <button
                type="button"
                onClick={() => anularMutation.mutate(v.id)}
                title="Anular venta"
                aria-label="Anular venta"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

/* ---------- Modal de cierre con arqueo ---------- */

// Orden de las filas del arqueo: crédito y débito quedan contiguas para la celda combinada "Tarjetas"
const MEDIOS_ARQUEO: TipoPago[] = [
  TipoPago.TARJETA_CREDITO,
  TipoPago.TARJETA_DEBITO,
  TipoPago.EFECTIVO,
  TipoPago.TRANSFERENCIA_QR,
  TipoPago.CUENTA_CORRIENTE,
]

/**
 * Filas de medios de pago: crédito y débito agrupan en un bloque con tinte
 * azul y el subtotal "Tarjetas" como celda lateral (rowspan); el resto va en
 * filas con ícono y separadores sutiles no de ancho completo.
 */
function FilasArqueo({ valores, renderValor }: {
  valores: Record<string, number>
  renderValor: (tipo: TipoPago) => React.ReactNode
}) {
  const totalTarjetas =
    Number(valores[TipoPago.TARJETA_CREDITO] || 0) + Number(valores[TipoPago.TARJETA_DEBITO] || 0)

  const fila = (tipo: TipoPago) => {
    const opcion = OPCIONES_PAGO.find(o => o.valor === tipo)
    const Icono = opcion?.Icono || Banknote
    return (
      <div className="flex items-center gap-2.5 px-2 h-10">
        <Icono size={16} strokeWidth={1.8} className="shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="flex-1 text-sm text-gray-600 dark:text-gray-300">{ETIQUETAS_TIPO_PAGO[tipo]}</span>
        <div className="w-32 flex justify-end">{renderValor(tipo)}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Grupo tarjetas: débito + crédito con subtotal combinado a la derecha */}
      <div className="grid grid-cols-[1fr_auto] rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10">
        <div className="px-1 divide-y divide-blue-100/80 dark:divide-blue-900/40">
          {fila(TipoPago.TARJETA_CREDITO)}
          {fila(TipoPago.TARJETA_DEBITO)}
        </div>
        <div className="flex flex-col items-end justify-center gap-0.5 px-3 border-l border-blue-100 dark:border-blue-900/50">
          <span className="text-[11px] uppercase tracking-wide text-blue-400 dark:text-blue-400/70">Tarjetas</span>
          <span className="font-mono tabular-nums text-sm font-medium text-blue-700 dark:text-blue-300">{fmt(totalTarjetas)}</span>
        </div>
      </div>

      {/* Resto de medios con separadores sutiles entre filas */}
      <div className="mt-2 px-2 divide-y divide-gray-100 dark:divide-gray-700/50">
        {fila(TipoPago.EFECTIVO)}
        {fila(TipoPago.TRANSFERENCIA_QR)}
        {fila(TipoPago.CUENTA_CORRIENTE)}
      </div>
    </div>
  )
}

function CerrarCajaModal({ caja, ventas, totalVendido, onClose }: {
  caja: CajaPuesto
  ventas: VentaCaja[]
  totalVendido: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  // Acuse de caja: lo que el operador cuenta físicamente por medio de pago
  const [acusado, setAcusado] = useState<Record<string, string>>({})
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')

  const parseAcusado = (s: string) => {
    const n = parseFloat(s)
    return isNaN(n) || n < 0 ? 0 : n
  }
  const acusadoNumerico = MEDIOS_ARQUEO.reduce<Record<string, number>>((acc, t) => {
    acc[t] = parseAcusado(acusado[t] || '')
    return acc
  }, {})
  const hayAcuse = MEDIOS_ARQUEO.some(t => (acusado[t] || '').trim() !== '')
  const declarado = hayAcuse ? MEDIOS_ARQUEO.reduce((a, t) => a + acusadoNumerico[t], 0) : null

  const diferencia = declarado === null ? null : declarado - totalVendido
  const hayDiferencia = diferencia !== null && Math.abs(diferencia) >= 0.005
  const requiereObservacion = hayDiferencia && !observaciones.trim()

  // Totales por medio de pago de las ventas de la caja
  const porPago = ventas.reduce<Record<string, number>>((acc, v) => {
    if (!v.tipoPago) return acc
    acc[v.tipoPago] = (acc[v.tipoPago] || 0) + Math.abs(Number(v.total))
    return acc
  }, {})

  const mutation = useMutation({
    mutationFn: async () =>
      (await api.post(`/puestos/${caja.id}/cerrar`, {
        montoDeclarado: declarado,
        observaciones: observaciones || undefined,
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-caja'] })
      onClose()
    },
    onError: (err) => setError(errorMessage(err)),
  })

  return (
    <Modal
      title="Cerrar caja"
      onClose={onClose}
      size="2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            type="submit"
            form="cerrar-caja-form"
            disabled={declarado === null || declarado < 0 || requiereObservacion || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Cerrando...' : 'Confirmar cierre'}
          </button>
        </>
      }
    >
      <form
        id="cerrar-caja-form"
        onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
        className="space-y-4"
      >
        <div className="grid md:grid-cols-2 gap-4">
          {/* Columna izquierda: lo registrado por el sistema (solo lectura) */}
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Total vendido (sistema)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono tabular-nums">{fmt(totalVendido)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">Por medio de pago (sistema)</p>
              <FilasArqueo
                valores={porPago}
                renderValor={tipo => (
                  <span className={clsx(
                    'font-mono tabular-nums',
                    Number(porPago[tipo] || 0) > 0
                      ? 'text-gray-700 dark:text-gray-200'
                      : 'text-gray-300 dark:text-gray-600',
                  )}>
                    {fmt(Number(porPago[tipo] || 0))}
                  </span>
                )}
              />
            </div>
          </div>

          {/* Columna derecha: acuse de caja que ingresa el operador */}
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-500/80 dark:text-blue-400/80 mb-1">Total declarado (acuse)</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono tabular-nums">
                {fmt(declarado ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">Acuse de caja por medio de pago</p>
              <FilasArqueo
                valores={acusadoNumerico}
                renderValor={tipo => (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    autoFocus={tipo === MEDIOS_ARQUEO[0]}
                    value={acusado[tipo] || ''}
                    onChange={(e) => setAcusado(a => ({ ...a, [tipo]: e.target.value }))}
                    className="form-input font-mono text-right w-full !py-1.5"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {diferencia !== null && (
          <div className={clsx(
            'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm',
            Math.abs(diferencia) < 0.005
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : diferencia < 0
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
          )}>
            {Math.abs(diferencia) < 0.005 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {Math.abs(diferencia) < 0.005
              ? 'La caja cierra exacta.'
              : diferencia < 0
                ? `Faltante de ${fmt(Math.abs(diferencia))}: se registra pero no se transfiere.`
                : `Sobrante de ${fmt(diferencia)}: se transfiere a caja central.`}
          </div>
        )}

        <div>
          <label className="form-label">
            Observaciones{hayDiferencia && <span className="text-red-500"> *</span>}
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            placeholder={hayDiferencia ? 'Explicá la diferencia del arqueo (obligatorio)' : 'Notas del arqueo (opcional)'}
            className="form-input"
          />
          {requiereObservacion && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Hay faltante o sobrante: la observación es obligatoria.
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          El dinero declarado se transfiere a la caja central. Una vez cerrada, solo un administrador puede rehabilitar la caja.
        </p>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>
    </Modal>
  )
}
