import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Store, ShieldCheck, Loader2, Plus, Trash2, Pencil, Plug, Upload } from 'lucide-react'
import api from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import Skeleton from '../components/Skeleton'
import { PuntoVenta, CredencialArcaInfo } from '../types'

interface EmpresaFiscal {
  id: number
  nombre: string
  razonSocial?: string | null
  cuit: string
  localidad?: string | null
  direccion?: string | null
  condicionIva?: string
  fechaInicioActividades?: string | null
  iibb?: string | null
}

const errorMessage = (err: unknown) => (err as any)?.response?.data?.message || 'Ocurrió un error'

export default function Configuracion() {
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState('')

  const { data: empresa, isLoading: loadingEmpresa } = useQuery<EmpresaFiscal>({
    queryKey: ['configuracion-empresa'],
    queryFn: async () => (await api.get('/configuracion/empresa')).data,
  })

  const { data: puntos = [], isLoading: loadingPuntos } = useQuery<PuntoVenta[]>({
    queryKey: ['configuracion-puntos-venta'],
    queryFn: async () => (await api.get('/configuracion/puntos-venta')).data,
  })

  const { data: credenciales = [], isLoading: loadingCredenciales } = useQuery<CredencialArcaInfo[]>({
    queryKey: ['configuracion-arca'],
    queryFn: async () => (await api.get('/configuracion/arca')).data,
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Datos fiscales, puntos de venta y credenciales ARCA." />

      {feedback && <p className="text-sm text-green-600 dark:text-green-400">{feedback}</p>}

      <EmpresaFiscalForm empresa={empresa} cargando={loadingEmpresa} onGuardado={() => {
        queryClient.invalidateQueries({ queryKey: ['configuracion-empresa'] })
        setFeedback('Datos fiscales guardados')
      }} />

      <PuntosVenta puntos={puntos} loading={loadingPuntos} onChanged={() =>
        queryClient.invalidateQueries({ queryKey: ['configuracion-puntos-venta'] })} />

      <CredencialesArca credenciales={credenciales} cargando={loadingCredenciales} empresaCuit={empresa?.cuit} onChanged={() => {
        queryClient.invalidateQueries({ queryKey: ['configuracion-arca'] })
        setFeedback('Credenciales guardadas')
      }} />
    </div>
  )
}

/* ---------- Datos fiscales de la empresa ---------- */

function EmpresaFiscalForm({ empresa, cargando, onGuardado }: { empresa?: EmpresaFiscal; cargando: boolean; onGuardado: () => void }) {
  const mutation = useMutation({
    mutationFn: async (data: Partial<EmpresaFiscal>) => (await api.patch('/configuracion/empresa', data)).data,
    onSuccess: onGuardado,
  })

  if (cargando) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} strokeWidth={1.8} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datos fiscales</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Cargando datos fiscales">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    mutation.mutate({
      nombre: (fd.get('nombre') as string).trim(),
      razonSocial: (fd.get('razonSocial') as string).trim() || null,
      cuit: (fd.get('cuit') as string).trim(),
      localidad: (fd.get('localidad') as string).trim() || null,
      direccion: (fd.get('direccion') as string).trim() || null,
      condicionIva: (fd.get('condicionIva') as string).trim(),
      fechaInicioActividades: (fd.get('fechaInicioActividades') as string) || null,
      iibb: (fd.get('iibb') as string).trim() || null,
    })
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={18} strokeWidth={1.8} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datos fiscales</h2>
      </div>
      <form id="empresa-fiscal-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Nombre comercial</label>
          <input type="text" name="nombre" defaultValue={empresa?.nombre || ''} className="form-input" />
        </div>
        <div>
          <label className="form-label">Razón social</label>
          <input type="text" name="razonSocial" defaultValue={empresa?.razonSocial || ''} className="form-input" />
        </div>
        <div>
          <label className="form-label">CUIT</label>
          <input type="text" name="cuit" defaultValue={empresa?.cuit || ''} className="form-input" />
        </div>
        <div>
          <label className="form-label">Condición frente al IVA</label>
          <input type="text" name="condicionIva" defaultValue={empresa?.condicionIva || ''} className="form-input" />
        </div>
        <div>
          <label className="form-label">Domicilio comercial</label>
          <input type="text" name="direccion" defaultValue={empresa?.direccion || ''} className="form-input" />
        </div>
        <div>
          <label className="form-label">Localidad</label>
          <input type="text" name="localidad" defaultValue={empresa?.localidad || ''} className="form-input" />
        </div>
        <div>
          <label className="form-label">Ingresos Brutos</label>
          <input type="text" name="iibb" defaultValue={empresa?.iibb || ''} className="form-input" />
        </div>
        <div>
          <label className="form-label">Inicio de actividades</label>
          <input type="date" name="fechaInicioActividades" defaultValue={empresa?.fechaInicioActividades || ''} className="form-input" />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Guardar'}
          </button>
        </div>
        {mutation.isError && <p className="md:col-span-2 text-sm text-red-600 dark:text-red-400">{errorMessage(mutation.error)}</p>}
      </form>
    </div>
  )
}

/* ---------- Puntos de venta ---------- */

function PuntosVenta({ puntos, loading, onChanged }: { puntos: PuntoVenta[]; loading: boolean; onChanged: () => void }) {
  const [modal, setModal] = useState(false)
  const [editar, setEditar] = useState<PuntoVenta | null>(null)
  const [error, setError] = useState('')

  const save = useMutation({
    mutationFn: async (data: Partial<PuntoVenta>) => {
      if (editar) return (await api.patch(`/configuracion/puntos-venta/${editar.id}`, data)).data
      return (await api.post('/configuracion/puntos-venta', data)).data
    },
    onSuccess: () => { setModal(false); setEditar(null); onChanged() },
    onError: (e) => setError(errorMessage(e)),
  })

  const eliminar = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/configuracion/puntos-venta/${id}`)).data,
    onSuccess: onChanged,
    onError: (e) => setError(errorMessage(e)),
  })

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store size={18} strokeWidth={1.8} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Puntos de venta</h2>
        </div>
        <button onClick={() => { setEditar(null); setModal(true) }} className="btn-secondary">
          <Plus size={16} strokeWidth={2} /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="space-y-2" aria-label="Cargando puntos de venta">
          {[0, 1].map(i => <Skeleton key={i} className="h-11 w-full" />)}
        </div>
      ) : puntos.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No hay puntos de venta cargados. Agregá el número que te asignó ARCA.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {puntos.map(p => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{String(p.numero).padStart(4, '0')}</span>
              <span className="flex-1 text-sm text-gray-500 dark:text-gray-400">{p.descripcion || ''}</span>
              {p.predeterminado && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Predeterminado</span>
              )}
              <button onClick={() => { setEditar(p); setModal(true) }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil size={15} /></button>
              <button onClick={() => eliminar.mutate(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {modal && (
        <Modal
          title={editar ? 'Editar punto de venta' : 'Nuevo punto de venta'}
          onClose={() => { setModal(false); setEditar(null) }}
          footer={
            <>
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" form="punto-venta-form" disabled={save.isPending} className="btn-primary">Guardar</button>
            </>
          }
        >
          <form
            id="punto-venta-form"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              save.mutate({
                numero: Number(fd.get('numero')),
                descripcion: (fd.get('descripcion') as string).trim() || null,
                predeterminado: fd.get('predeterminado') === 'on',
              })
            }}
            className="space-y-4"
          >
            <div>
              <label className="form-label">Número *</label>
              <input type="number" name="numero" required defaultValue={editar?.numero || ''} className="form-input" />
            </div>
            <div>
              <label className="form-label">Descripción</label>
              <input type="text" name="descripcion" defaultValue={editar?.descripcion || ''} className="form-input" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" name="predeterminado" defaultChecked={editar?.predeterminado || false} className="rounded border-gray-300 text-blue-600 accent-blue-600" />
              <span>Predeterminado</span>
            </label>
          </form>
        </Modal>
      )}
    </div>
  )
}

const ENTORNOS_ARCA = ['homologacion', 'produccion'] as const

/* ---------- Credenciales ARCA ---------- */

function CredencialesArca({ credenciales, cargando, empresaCuit, onChanged }: {
  credenciales: CredencialArcaInfo[]
  cargando: boolean
  empresaCuit?: string
  onChanged: () => void
}) {
  const [modal, setModal] = useState<'homologacion' | 'produccion' | null>(null)
  const [certificado, setCertificado] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [probando, setProbando] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async () =>
      (await api.post('/configuracion/arca', { entorno: modal, certificado, clavePrivada: clave })).data,
    onSuccess: () => { setModal(null); setCertificado(''); setClave(''); onChanged() },
    onError: (e) => setError(errorMessage(e)),
  })

  const probar = async (entorno: string) => {
    setProbando(entorno)
    setError('')
    try {
      const res = await api.post('/configuracion/arca/probar', { entorno })
      alert(`Conexión OK (${entorno}). Ticket válido hasta ${res.data.expirationTime}`)
    } catch (e: any) {
      alert(errorMessage(e))
    } finally {
      setProbando(null)
    }
  }

  const readFile = (f: File, setter: (v: string) => void) => {
    const reader = new FileReader()
    reader.onload = () => setter(reader.result as string)
    reader.readAsText(f)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={18} strokeWidth={1.8} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Credenciales ARCA</h2>
      </div>

      {!empresaCuit && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
          Cargá el CUIT de la empresa en "Datos fiscales" antes de operar.
        </p>
      )}

      <div className="space-y-3">
        {cargando && (
          <div className="space-y-3" aria-label="Cargando credenciales">
            <Skeleton className="h-[74px] w-full" />
            <Skeleton className="h-[74px] w-full" />
          </div>
        )}
        {!cargando && ENTORNOS_ARCA.map(entorno => {
          const cred = credenciales.find(c => c.entorno === entorno)
          return (
            <div key={entorno} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{entorno === 'homologacion' ? 'Homologación' : 'Producción'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {cred ? `Cargado · vence ${cred.vencimiento || '—'}` : 'Sin certificado cargado'}
                </p>
              </div>
              <button onClick={() => { setError(''); setModal(entorno) }} className="btn-secondary">
                <Upload size={14} /> {cred ? 'Reemplazar' : 'Cargar'}
              </button>
              <button
                onClick={() => probar(entorno)}
                disabled={!cred || probando === entorno}
                className="btn-secondary"
              >
                {probando === entorno ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
                Probar conexión
              </button>
            </div>
          )
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {modal && (
        <Modal
          title={`Certificado ARCA (${modal})`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={!certificado || !clave || save.isPending}
                className="btn-primary"
              >
                {save.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="form-label">Certificado (.crt / .pem)</label>
              <input type="file" accept=".crt,.pem,.cer,.txt" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], setCertificado)} className="form-input" />
            </div>
            <div>
              <label className="form-label">Clave privada (.key)</label>
              <input type="file" accept=".key,.pem,.txt" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], setClave)} className="form-input" />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              La clave privada se cifra con AES-256 y nunca se muestra ni se devuelve por la API.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
