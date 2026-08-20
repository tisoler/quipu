import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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
        <Route path="productos" element={<Productos />} />
        <Route path="materiales" element={<Materiales />} />
        <Route path="almacenes" element={<Almacenes />} />
        <Route path="rubros" element={<Rubros />} />
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
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
