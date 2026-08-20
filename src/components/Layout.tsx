import { useState, useMemo } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Wrench,
  Warehouse,
  History,
  ArrowRightLeft,
  ShoppingCart,
  TrendingUp,
  Factory,
  Boxes,
  Tag
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import clsx from 'clsx'
import LogoSvg from './Logo'
import Loading from './Loading'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading, logout } = useAuth()
  const location = useLocation()

  const menuItems = useMemo(() => {
    const items = [
      { path: '/', label: 'Inicio', icon: LayoutDashboard },
    ]

    const permisos = user?.permisos || []

    if (permisos.includes('lectura:producto')) {
      items.push({ path: '/productos', label: 'Productos', icon: Package })
    }
    if (permisos.includes('lectura:material')) {
      items.push({ path: '/materiales', label: 'Materiales', icon: Wrench })
    }
    if (permisos.includes('lectura:almacen')) {
      items.push({ path: '/almacenes', label: 'Almacenes', icon: Warehouse })
    }
    if (permisos.includes('lectura:rubro')) {
      items.push({ path: '/rubros', label: 'Rubros', icon: Tag })
    }
    if (permisos.includes('lectura:movimiento')) {
      items.push({ path: '/movimientos', label: 'Movimientos', icon: History })
    }
    if (permisos.includes('lectura:inventario')) {
      items.push({ path: '/inventario', label: 'Historial Inventario', icon: History })
      items.push({ path: '/stock-actual', label: 'Stock Actual', icon: Boxes })
    }
    if (permisos.includes('escritura:movimiento')) {
      items.push({ path: '/mover-stock', label: 'Mover entre almacenes', icon: ArrowRightLeft })
    }
    if (permisos.includes('escritura:compra-producto')) {
      items.push({ path: '/compra-productos', label: 'Compra/entrada de productos', icon: ShoppingCart })
    }
    if (permisos.includes('escritura:venta-producto')) {
      items.push({ path: '/venta-productos', label: 'Venta/salida de productos', icon: TrendingUp })
    }
    if (permisos.includes('escritura:compra-material')) {
      items.push({ path: '/compra-materiales', label: 'Compra/entrada de materiales', icon: ShoppingCart })
    }
    if (permisos.includes('escritura:produccion-producto')) {
      items.push({ path: '/produccion-productos', label: 'Fabricación de Productos', icon: Factory })
    }

    return items
  }, [user?.permisos])

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile header */}
      <div className="xl:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className='flex items-center justify-center gap-1'>
            <LogoSvg width={40} height={40} />
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">Quipu</div>
          </div>
          {user?.nombreEmpresa && (
            <div className="text-base font-medium text-gray-500 pl-2 dark:text-gray-400 truncate max-w-[150px] border-l-2 border-l-gray-200 dark:border-l-gray-700">
              {user.nombreEmpresa}
            </div>
          )}
          <div className="w-6" /> {/* Spacer */}
        </div>
        {sidebarOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              {user?.nombreUsuario}
            </div>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex px-4 py-2 text-sm',
                  isActive(item.path)
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span className="mr-2"><item.icon size={18} strokeWidth={1.2} /></span>
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden xl:flex xl:flex-col xl:w-64 xl:fixed xl:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex gap-1 items-center justify-center flex-shrink-0 px-4 pb-2">
              <LogoSvg width={40} height={40} />
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Quipu</h1>
            </div>
            {user?.nombreEmpresa && (
              <div className="py-2 text-center border-y border-y-gray-200 dark:border-y-gray-700">
                <p className="text-base font-medium text-gray-500 dark:text-gray-400 truncate">
                  {user.nombreEmpresa}
                </p>
              </div>
            )}
            <div className="mt-5 flex-1 px-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    isActive(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="mr-2"><item.icon size={20} strokeWidth={1.4} /></span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {user?.nombreUsuario}
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 xl:pl-64">
          <main className="py-6">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 xl:px-8">
              {loading ? <Loading /> : <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
