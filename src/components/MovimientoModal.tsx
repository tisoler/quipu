import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { TipoMovimiento, TipoArticulo } from '../types'
import Autocomplete from './Autocomplete'
import Modal from './Modal'

interface Producto {
  id: number
  nombre: string
  precio: number
}

interface Material {
  id: number
  nombre: string
  precio: number
}

interface Almacen {
  id: number
  nombre: string
}

interface MovimientoModalProps {
  onClose: () => void
  onSuccess?: () => void
  fixedTipoArticulo?: TipoArticulo | ''
  fixedTipoMovimiento?: TipoMovimiento | ''
}

export default function MovimientoModal({
  onClose,
  onSuccess,
  fixedTipoArticulo = '',
  fixedTipoMovimiento = '',
}: MovimientoModalProps) {
  const [formData, setFormData] = useState({
    tipoArticulo: fixedTipoArticulo || '' as TipoArticulo | '',
    idArticulo: '',
    tipoMovimiento: fixedTipoMovimiento || '' as TipoMovimiento | '',
    cantidad: '',
    precio: '',
    idAlmacen: '',
    descripcion: '',
  })

  const queryClient = useQueryClient()

  const titulo = `Ingresar ${fixedTipoMovimiento || 'movimiento'}`

  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: async () => {
      const response = await api.get('/productos')
      return response.data
    },
  })

  const { data: materiales = [] } = useQuery<Material[]>({
    queryKey: ['materiales'],
    queryFn: async () => {
      const response = await api.get('/materiales')
      return response.data
    },
  })

  const { data: almacenes = [] } = useQuery<Almacen[]>({
    queryKey: ['almacenes'],
    queryFn: async () => {
      const response = await api.get('/almacenes')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/movimientos', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['inventario-grafico'] })
      onSuccess?.()
      onClose()
    },
  })

  const articulosDisponibles = useMemo(() => {
    if (formData.tipoArticulo === TipoArticulo.PRODUCTO) {
      return productos
    } else if (formData.tipoArticulo === TipoArticulo.MATERIAL) {
      return materiales
    }
    return []
  }, [formData.tipoArticulo, productos, materiales])

  const articuloSeleccionado = useMemo(() => {
    if (!formData.idArticulo) return null
    return articulosDisponibles.find((a: any) => a.id === parseInt(formData.idArticulo))
  }, [formData.idArticulo, articulosDisponibles])

  const total = useMemo(() => {
    const cantidad = parseFloat(formData.cantidad) || 0
    const precio = parseFloat(formData.precio) || 0
    return cantidad * precio
  }, [formData.cantidad, formData.precio])

  useEffect(() => {
    if (articuloSeleccionado) {
      setFormData((prev: any) => ({ ...prev, precio: articuloSeleccionado.precio.toString() }))
    }
  }, [articuloSeleccionado])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      idArticulo: parseInt(formData.idArticulo),
      cantidad: parseFloat(formData.cantidad),
      precio: parseFloat(formData.precio),
      total,
      idAlmacen: parseInt(formData.idAlmacen),
    })
  }

  const articuloOptions = useMemo(() =>
    articulosDisponibles.map((a: any) => ({ id: a.id, label: a.nombre })),
    [articulosDisponibles]
  )

  return (
    <Modal
      title={titulo}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" form="movimiento-form" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="movimiento-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!fixedTipoArticulo && (
          <div>
            <label className="form-label">Tipo Artículo *</label>
            <select
              required
              value={formData.tipoArticulo}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  tipoArticulo: e.target.value as TipoArticulo,
                  idArticulo: '',
                  precio: '',
                }))
              }
              className="form-input"
            >
              <option value="">Seleccione...</option>
              <option value={TipoArticulo.PRODUCTO}>Producto</option>
              <option value={TipoArticulo.MATERIAL}>Material</option>
            </select>
          </div>
        )}

        {!fixedTipoMovimiento && (
          <div>
            <label className="form-label">Tipo Movimiento *</label>
            <select
              required
              value={formData.tipoMovimiento}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, tipoMovimiento: e.target.value as TipoMovimiento }))
              }
              className="form-input"
            >
              <option value="">Seleccione...</option>
              <option value={TipoMovimiento.VENTA}>Venta</option>
              <option value={TipoMovimiento.COMPRA}>Compra</option>
              <option value={TipoMovimiento.CONSUMO}>Consumo</option>
              <option value={TipoMovimiento.PRODUCCION}>Producción</option>
              <option value={TipoMovimiento.TRANSFERENCIA}>Transferencia</option>
            </select>
          </div>
        )}

        <Autocomplete
          className="md:col-span-2"
          label={fixedTipoArticulo ? fixedTipoArticulo.charAt(0).toUpperCase() + fixedTipoArticulo.slice(1) : "Artículo"}
          required
          options={articuloOptions}
          value={formData.idArticulo}
          onChange={(val) => setFormData((prev: any) => ({ ...prev, idArticulo: val.toString() }))}
          disabled={!formData.tipoArticulo}
          placeholder={formData.tipoArticulo ? `Buscar ${fixedTipoArticulo ?? 'artículo'}...` : "Primero seleccione tipo"}
        />

        <div>
          <label className="form-label">Almacén *</label>
          <select
            required
            value={formData.idAlmacen}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, idAlmacen: e.target.value }))}
            className="form-input"
          >
            <option value="">Seleccione...</option>
            {almacenes.map((almacen: any) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Cantidad *</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.cantidad}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, cantidad: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Precio *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, precio: e.target.value }))}
              className="form-input"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Total</label>
          <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white font-mono font-bold text-sm">
            $ {total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="form-label">Descripción</label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, descripcion: e.target.value }))}
            className="form-input"
            rows={3}
            placeholder="Notas adicionales..."
          />
        </div>
      </form>
    </Modal>
  )
}
