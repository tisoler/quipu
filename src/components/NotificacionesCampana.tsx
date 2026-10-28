import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import clsx from 'clsx'
import api from '../lib/api'
import { Notificacion } from '../types'

/**
 * Campanita de notificaciones para perfiles admin (lectura:caja-central).
 * 'abajo' abre el panel hacia abajo (header mobile);
 * 'arriba' abre hacia arriba y a la derecha (pie del sidebar).
 */
export default function NotificacionesCampana({ posicion = 'abajo' }: { posicion?: 'abajo' | 'arriba' }) {
  const [abierto, setAbierto] = useState(false)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: async () => (await api.get('/notificaciones')).data,
    refetchInterval: 60000,
  })

  const leerMutation = useMutation({
    mutationFn: async (id: number) => (await api.patch(`/notificaciones/${id}/leer`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  const noLeidas: number = data?.noLeidas ?? 0
  const notificaciones: Notificacion[] = data?.notificaciones ?? []

  const handleClick = (n: Notificacion) => {
    if (!n.leida) leerMutation.mutate(n.id)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        title="Notificaciones"
        aria-label="Notificaciones"
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell size={18} strokeWidth={1.6} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div
            className={clsx(
              'absolute z-50 w-80 card p-2 max-h-96 overflow-y-auto animate-[modal-in_150ms_ease-out]',
              posicion === 'abajo' ? 'top-full right-0 mt-2' : 'bottom-full left-0 mb-2',
            )}
          >
            <p className="px-3 py-1.5 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Notificaciones
            </p>
            {notificaciones.length === 0 ? (
              <p className="px-3 pb-3 text-sm text-gray-400 dark:text-gray-500">Sin notificaciones.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {notificaciones.map(n => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={clsx(
                        'w-full text-left px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        !n.leida && 'bg-blue-50/60 dark:bg-blue-900/10',
                      )}
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {n.titulo}
                        {!n.leida && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-500 align-middle" />}
                      </p>
                      {n.mensaje && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.mensaje}</p>
                      )}
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(n.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
