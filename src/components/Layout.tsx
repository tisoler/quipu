import { useState, useMemo, useEffect } from 'react'
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
  Tag,
  Store,
  Landmark,
  Banknote,
  Truck,
  Users,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import clsx from 'clsx'
import LogoSvg from './Logo'
import Loading from './Loading'
import ThemeToggle from './ThemeToggle'
import NotificacionesCampana from './NotificacionesCampana'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [colapsado, setColapsado] = useState(() => localStorage.getItem('quipu:sidebar-colapsado') === '1')
  const { user, loading, logout } = useAuth()
  const location = useLocation()

  // En el puesto de venta el sidebar arranca colapsado para aprovechar la pantalla;
  // el usuario puede expandirlo manualmente con el botón del sidebar.
  useEffect(() => {
    if (location.pathname === '/puesto') setColapsado(true)
  }, [location.pathname])

  const toggleColapsado = () => {
    setColapsado(v => {
      localStorage.setItem('quipu:sidebar-colapsado', String(!v))
      return !v
    })
  }

  const menuItems = useMemo(() => {
    const items = [
      { path: '/', label: 'Inicio', icon: LayoutDashboard },
    ]

    const permisos = user?.permisos || []

    if (permisos.includes('lectura:puesto-venta')) {
      items.push({ path: '/puesto', label: 'Puesto de venta', icon: Store })
    }
    if (permisos.includes('lectura:caja-central')) {
      items.push({ path: '/cajas', label: 'Cajas', icon: Landmark })
      items.push({ path: '/caja-central', label: 'Caja central', icon: Banknote })
    }
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
    if (permisos.includes('lectura:proveedor')) {
      items.push({ path: '/proveedores', label: 'Proveedores', icon: Truck })
    }
    if (permisos.includes('lectura:facturacion')) {
      items.push({ path: '/clientes', label: 'Clientes', icon: Users })
      items.push({ path: '/ventas', label: 'Ventas', icon: Receipt })
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
  const esAdminCajas = (user?.permisos || []).includes('lectura:caja-central')
  const puedeConfigurar = (user?.permisos || []).includes('lectura:configuracion')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile header */}
      <div className="xl:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className='flex items-center justify-center gap-1'>
            <LogoSvg width={32} height={32} />
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">Quipu</div>
          </div>
          <div className="flex items-center gap-2">
            {user?.nombreEmpresa && (
              <div className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                {user.nombreEmpresa}
              </div>
            )}
            {esAdminCajas && <NotificacionesCampana posicion="abajo" />}
            <ThemeToggle />
          </div>
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
            {puedeConfigurar && (
              <Link
                to="/configuracion"
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex px-4 py-2 text-sm',
                  isActive('/configuracion')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span className="mr-2"><Settings size={18} strokeWidth={1.2} /></span>
                Configuración
              </Link>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <LogOut size={16} strokeWidth={1.6} />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className={clsx(
          'hidden xl:flex xl:flex-col xl:fixed xl:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-[width] duration-200',
          colapsado ? 'xl:w-20' : 'xl:w-64',
        )}>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className={clsx(
              'flex items-center flex-shrink-0 pb-2',
              colapsado ? 'flex-col gap-1.5 px-2' : 'justify-between px-4',
            )}>
              <div className={clsx('flex items-center', !colapsado && 'gap-1')}>
                <LogoSvg width={colapsado ? 32 : 40} height={colapsado ? 32 : 40} />
                {!colapsado && <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Quipu</h1>}
              </div>
              <button
                onClick={toggleColapsado}
                title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
                aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {colapsado ? <PanelLeftOpen size={18} strokeWidth={1.6} /> : <PanelLeftClose size={18} strokeWidth={1.6} />}
              </button>
            </div>
            {user?.nombreEmpresa && !colapsado && (
              <div className="py-2 text-center border-y border-y-gray-200 dark:border-y-gray-700">
                <p className="text-base font-medium text-gray-500 dark:text-gray-400 truncate">
                  {user.nombreEmpresa}
                </p>
              </div>
            )}
            <div className={clsx('mt-5 flex-1 space-y-1', colapsado ? 'px-2' : 'px-3')}>
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={clsx(
                    'group flex items-center text-sm font-medium rounded-md',
                    colapsado ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                    isActive(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon size={20} strokeWidth={1.4} className="shrink-0" />
                  {!colapsado && <span className="ml-2">{item.label}</span>}
                </Link>
              ))}
            </div>
            <div className={clsx('py-4 border-t border-gray-200 dark:border-gray-700 space-y-3', colapsado ? 'px-2' : 'px-3')}>
              {puedeConfigurar && (
                <Link
                  to="/configuracion"
                  title="Configuración"
                  className={clsx(
                    'group flex items-center text-sm font-medium rounded-md',
                    colapsado ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                    isActive('/configuracion')
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <Settings size={20} strokeWidth={1.4} className="shrink-0" />
                  {!colapsado && <span className="ml-2">Configuración</span>}
                </Link>
              )}
              <div className={clsx('flex items-center', colapsado ? 'justify-center' : 'gap-2')}>
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-bold uppercase shrink-0"
                  title={user?.nombreUsuario}
                >
                  {(user?.nombreUsuario || '?').charAt(0)}
                </div>
                {!colapsado && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {user?.nombreUsuario}
                  </div>
                )}
              </div>
              <div className={clsx(
                colapsado
                  ? 'flex flex-col items-center gap-1'
                  : 'flex items-center justify-between gap-2',
              )}>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  {esAdminCajas && <NotificacionesCampana posicion="arriba" />}
                </div>
                <button
                  onClick={logout}
                  title="Cerrar Sesión"
                  className={clsx(
                    'flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors',
                    colapsado ? 'justify-center p-2' : 'px-3 py-2',
                  )}
                >
                  <LogOut size={16} strokeWidth={1.6} />
                  {!colapsado && 'Salir'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className={clsx('flex-1 transition-[padding] duration-200', colapsado ? 'xl:pl-20' : 'xl:pl-64')}>
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
