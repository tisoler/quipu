import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Loading from './components/Loading'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Materiales from './pages/Materiales'
import Almacenes from './pages/Almacenes'
import Movimientos from './pages/Movimientos'
import Inventario from './pages/Inventario'
import StockActual from './pages/StockActual'
import MoverStock from './pages/MoverStock'
import Rubros from './pages/Rubros'
import Proveedores from './pages/Proveedores'
import PuestoVenta from './pages/PuestoVenta'
import Cajas from './pages/Cajas'
import CajaCentral from './pages/CajaCentral'
import Clientes from './pages/Clientes'
import Ventas from './pages/Ventas'
import Configuracion from './pages/Configuracion'

import { TipoArticulo, TipoMovimiento } from './types'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { loading, firebaseUser } = useAuth()

  // Pantalla completa inicial si no sabemos nada aún
  if (loading && !firebaseUser) {
    return <Loading fullScreen />
  }

  // Si ya sabemos que NO hay usuario de Firebase, al login
  if (!loading && !firebaseUser) {
    return <Navigate to="/login" replace />
  }

  // Si hay firebaseUser, permitimos entrar (aunque isAuthenticated sea false porque el perfil sigue cargando)
  // El Layout manejará el estado de carga interno para el contenido.
  return <>{children}</>
}

// Redirección por defecto: un vendedor puro (con permiso de puesto de venta y sin
// permisos de gestión) entra directo al puesto; el resto al dashboard.
function RedirectHome() {
  const { permisos, loading } = useAuth()
  if (loading) return <Loading />
  const esVendedor = permisos.includes('escritura:puesto-venta') && !permisos.includes('lectura:movimiento')
  return <Navigate to={esVendedor ? '/puesto' : '/'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="home" element={<RedirectHome />} />
        <Route path="puesto" element={<PuestoVenta />} />
        <Route path="cajas" element={<Cajas />} />
        <Route path="caja-central" element={<CajaCentral />} />
        <Route path="productos" element={<Productos />} />
        <Route path="materiales" element={<Materiales />} />
        <Route path="almacenes" element={<Almacenes />} />
        <Route path="rubros" element={<Rubros />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="movimientos" element={<Movimientos />} />
        <Route
          path="compra-productos"
          element={
            <Movimientos
              title="Compra/entrada de productos"
              fixedTipoArticulo={TipoArticulo.PRODUCTO}
              fixedTipoMovimiento={TipoMovimiento.COMPRA}
              addPermission="escritura:compra-producto"
            />
          }
        />
        <Route
          path="venta-productos"
          element={
            <Movimientos
              title="Venta/salida de productos"
              fixedTipoArticulo={TipoArticulo.PRODUCTO}
              fixedTipoMovimiento={TipoMovimiento.VENTA}
              addPermission="escritura:venta-producto"
            />
          }
        />
        <Route
          path="compra-materiales"
          element={
            <Movimientos
              title="Compra/entrada de materiales"
              fixedTipoArticulo={TipoArticulo.MATERIAL}
              fixedTipoMovimiento={TipoMovimiento.COMPRA}
              addPermission="escritura:compra-material"
            />
          }
        />
        <Route
          path="produccion-productos"
          element={
            <Movimientos
              title="Fabricación de productos"
              fixedTipoArticulo={TipoArticulo.PRODUCTO}
              fixedTipoMovimiento={TipoMovimiento.PRODUCCION}
              addPermission="escritura:produccion-producto"
            />
          }
        />
        <Route path="inventario" element={<Inventario />} />
        <Route path="stock-actual" element={<StockActual />} />
        <Route path="mover-stock" element={<MoverStock />} />

      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
