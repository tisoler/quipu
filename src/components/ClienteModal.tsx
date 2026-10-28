import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import Modal from './Modal'
import { Cliente, CONDICIONES_IVA_CLIENTE } from '../types'

export default function ClienteModal({ cliente, onClose, onSaved }: {
  cliente: Cliente | null
  onClose: () => void
  onSaved: (cliente: Cliente) => void
}) {
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: async (data: Partial<Cliente>) =>
      (cliente
        ? (await api.patch(`/clientes/${cliente.id}`, data)).data
        : (await api.post('/clientes', data)).data) as Cliente,
    onSuccess: (guardado) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      onSaved(guardado)
    },
    onError: (err: any) => setError(err?.response?.data?.message || 'Error al guardar el cliente'),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    save.mutate({
      nombre: (formData.get('nombre') as string).trim(),
      cuit: (formData.get('cuit') as string).trim() || null,
      condicionIva: (formData.get('condicionIva') as string) || null,
      domicilio: (formData.get('domicilio') as string).trim() || null,
      telefono: (formData.get('telefono') as string).trim() || null,
      email: (formData.get('email') as string).trim() || null,
    })
  }

  return (
    <Modal
      title={cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" form="cliente-form" disabled={save.isPending} className="btn-primary">
            {save.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="cliente-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="form-label">Nombre / Razón Social *</label>
          <input
            type="text"
            name="nombre"
            required
            autoFocus
            defaultValue={cliente?.nombre || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">CUIT</label>
          <input
            type="text"
            name="cuit"
            defaultValue={cliente?.cuit || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Condición frente al IVA</label>
          <select
            name="condicionIva"
            defaultValue={cliente?.condicionIva || ''}
            className="form-input"
          >
            <option value="">Seleccione...</option>
            {CONDICIONES_IVA_CLIENTE.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Domicilio</label>
          <input
            type="text"
            name="domicilio"
            defaultValue={cliente?.domicilio || ''}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Teléfono</label>
          <input
            type="text"
            name="telefono"
            defaultValue={cliente?.telefono || ''}
            className="form-input"
            placeholder="Ej. 3465 123456"
          />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={cliente?.email || ''}
            className="form-input"
          />
        </div>
        {error && (
          <p className="md:col-span-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </form>
    </Modal>
  )
}
