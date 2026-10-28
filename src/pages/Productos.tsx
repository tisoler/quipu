import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import api from '../lib/api'
import { EstadoProducto } from '../types'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'

interface Producto {
  id: number
  nombre: string
  codigo?: string
  descripcion?: string
  presentacion?: string
  estado: EstadoProducto
  stockMinimo: number
  precio: number
  precioConIva?: boolean
  alicuotaIva?: number
  tipoProducto?: 'A' | 'B' | 'C' | null
  rubros?: Rubro[]
  talle?: string | null
  color?: string | null
  idProveedor?: number | null
  proveedor?: ProveedorRef | null
}

interface Rubro {
  id: number
  nombre: string
}

interface ProveedorRef {
  id: number
  nombre: string
}

export default function Productos() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const queryClient = useQueryClient()

  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await api.get('/productos')
      return response.data
    },
  })

  const { data: rubros = [] } = useQuery<Rubro[]>({
    queryKey: ['rubros'],
    queryFn: async () => {
      const response = await api.get('/rubros')
      return response.data
    },
  })

  const { data: proveedores = [] } = useQuery<ProveedorRef[]>({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const response = await api.get('/proveedores')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Producto>) => {
      const response = await api.post('/productos', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setIsModalOpen(false)
      setSelectedProducto(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Producto> }) => {
      const response = await api.patch(`/productos/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setIsModalOpen(false)
      setSelectedProducto(null)
    },
  })

  const updateEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: EstadoProducto }) => {
      const response = await api.patch(`/productos/${id}/estado`, { estado })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setSelectedProducto(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Obtener rubroIds de los checkboxes seleccionados
    const rubroIds = rubros
      .filter(r => formData.get(`rubro_${r.id}`) === 'on')
      .map(r => r.id)

    const data = {
      nombre: formData.get('nombre') as string,
      codigo: formData.get('codigo') as string,
      descripcion: formData.get('descripcion') as string,
      presentacion: formData.get('presentacion') as string,
      estado: (formData.get('estado') as EstadoProducto) || EstadoProducto.ACTIVO,
      stockMinimo: Number(formData.get('stockMinimo')),
      precio: Number(formData.get('precio')),
      precioConIva: formData.get('precioConIva') === 'on',
      alicuotaIva: Number(formData.get('alicuotaIva')) || 21,
      tipoProducto: (formData.get('tipoProducto') as 'A' | 'B' | 'C' | '') || null,
      talle: (formData.get('talle') as string) || null,
      color: (formData.get('color') as string) || null,
      idProveedor: Number(formData.get('idProveedor')) || null,
      rubroIds,
    }

    if (selectedProducto) {
      updateMutation.mutate({ id: selectedProducto.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEstadoChange = (id: number, currentEstado: EstadoProducto) => {
    const newEstado = currentEstado === EstadoProducto.ACTIVO
      ? EstadoProducto.NO_ACTIVO
      : EstadoProducto.ACTIVO
    updateEstadoMutation.mutate({ id, estado: newEstado })
  }

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Catálogo de productos terminados."
        actions={
          <button onClick={handleNew} className="btn-primary">
            <Plus size={16} strokeWidth={2} />
            Agregar Producto
          </button>
        }
      />

      <div className="mb-6">
        <DataTable
          isLoading={isLoading}
          data={productos}
          onRowClick={handleEdit}
          columns={[
            { header: 'Nombre', key: 'nombre', className: 'font-semibold' },
            { header: 'Código', key: 'codigo', className: 'font-mono' },
            { header: 'Descripción', key: 'descripcion', wrap: true },
            { header: 'Presentación', key: 'presentacion' },
            { header: 'Talle', key: 'talle' },
            { header: 'Color', key: 'color' },
            {
              header: 'Proveedor',
              key: 'proveedor',
              render: (p: Producto) => p.proveedor?.nombre || '-',
            },
            {
              header: 'Estado',
              key: 'estado',
              render: (p: Producto) => (
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.estado === EstadoProducto.ACTIVO
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                >
                  {p.estado}
                </span>
              ),
              className: 'text-center',
            },
            { header: 'Stock Mín.', key: 'stockMinimo', type: 'number' },
            { header: 'Precio', key: 'precio', type: 'currency' },
            { header: 'Tipo', key: 'tipoProducto' },
            {
              header: 'Rubros',
              key: 'rubros',
              render: (p: Producto) => (
                <div className="flex flex-wrap gap-1">
                  {p.rubros && p.rubros.length > 0 ? (
                    p.rubros.map((r: Rubro) => (
                      <span key={r.id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                        {r.nombre}
                      </span>
                    ))
                  ) : '-'}
                </div>
              )
            },
          ]}
          renderActions={(p: Producto) => (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEstadoChange(p.id, p.estado)
              }}
              className={`px-3 py-1 rounded text-xs font-medium ${p.estado === EstadoProducto.ACTIVO
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                }`}
            >
              {p.estado === EstadoProducto.ACTIVO ? 'Desactivar' : 'Activar'}
            </button>
          )}
        />
      </div>

      {isModalOpen && (
        <ProductoModal
          producto={selectedProducto}
          rubrosDisponibles={rubros}
          proveedoresDisponibles={proveedores}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProducto(null)
          }}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

function ProductoModal({
  producto,
  rubrosDisponibles,
  proveedoresDisponibles,
  onClose,
  onSubmit,
  isLoading,
}: {
  producto: Producto | null
  rubrosDisponibles: Rubro[]
  proveedoresDisponibles: ProveedorRef[]
  onClose: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}) {
  const currentRubrosIds = useMemo(() => producto?.rubros?.map(r => r.id) || [], [producto])

  return (
    <Modal
      title={producto ? 'Editar Producto' : 'Nuevo Producto'}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" form="producto-form" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="producto-form" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="form-label">Nombre *</label>
          <input
            type="text"
            name="nombre"
            required
            autoFocus
            defaultValue={producto?.nombre || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Código</label>
          <input
            type="text"
            name="codigo"
            defaultValue={producto?.codigo || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Presentación</label>
          <input
            type="text"
            name="presentacion"
            defaultValue={producto?.presentacion || ''}
            className="form-input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Descripción</label>
          <textarea
            name="descripcion"
            defaultValue={producto?.descripcion || ''}
            className="form-input"
            rows={3}
          />
        </div>
        <div>
          <label className="form-label">Estado</label>
          <select
            name="estado"
            defaultValue={producto?.estado || EstadoProducto.ACTIVO}
            className="form-input"
          >
            <option value={EstadoProducto.ACTIVO}>Activo</option>
            <option value={EstadoProducto.NO_ACTIVO}>No Activo</option>
          </select>
        </div>
        <div>
          <label className="form-label">Tipo (ABC)</label>
          <select
            name="tipoProducto"
            defaultValue={producto?.tipoProducto || ''}
            className="form-input"
          >
            <option value="">Ninguno</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
        <div>
          <label className="form-label">Stock Mínimo</label>
          <input
            type="number"
            name="stockMinimo"
            min="0"
            defaultValue={producto?.stockMinimo || 0}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Precio</label>
          <input
            type="number"
            name="precio"
            min="0"
            step="0.01"
            defaultValue={producto?.precio || 0}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Alícuota de IVA</label>
          <select
            name="alicuotaIva"
            defaultValue={String(producto?.alicuotaIva ?? 21)}
            className="form-input"
          >
            <option value="21">21%</option>
            <option value="10.5">10,5%</option>
            <option value="27">27%</option>
            <option value="5">5%</option>
            <option value="2.5">2,5%</option>
            <option value="0">0%</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer pt-5">
            <input
              type="checkbox"
              name="precioConIva"
              defaultChecked={producto?.precioConIva || false}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            <span>Precio incluye IVA</span>
          </label>
        </div>
        <div>
          <label className="form-label">Talle</label>
          <input
            type="text"
            name="talle"
            defaultValue={producto?.talle || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Color</label>
          <input
            type="text"
            name="color"
            defaultValue={producto?.color || ''}
            className="form-input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Proveedor</label>
          <select
            name="idProveedor"
            defaultValue={producto?.idProveedor ?? ''}
            className="form-input"
          >
            <option value="">Sin proveedor</option>
            {proveedoresDisponibles.map(p => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Rubros</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            {rubrosDisponibles.length === 0 && (
              <p className="col-span-full text-sm text-gray-400 dark:text-gray-500">No hay rubros cargados.</p>
            )}
            {rubrosDisponibles.map(rubro => (
              <label key={rubro.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name={`rubro_${rubro.id}`}
                  defaultChecked={currentRubrosIds.includes(rubro.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <span>{rubro.nombre}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
