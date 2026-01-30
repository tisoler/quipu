import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

interface User {
  id: number
  nombreUsuario: string
  idEmpresa: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (nombreUsuario: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (accessToken && refreshToken) {
      // Intentar validar el token decodificándolo (sin verificar, solo para obtener datos)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        setUser({
          id: payload.sub,
          nombreUsuario: payload.nombreUsuario,
          idEmpresa: payload.idEmpresa,
        })
        setIsAuthenticated(true)
      } catch (error) {
        // Si el token es inválido, limpiar y redirigir
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }
    setLoading(false)
  }, [])

  const login = async (nombreUsuario: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        nombreUsuario,
        password,
      })

      const { accessToken, refreshToken, user: userData } = response.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      setUser(userData)
      setIsAuthenticated(true)
      navigate('/')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión')
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setIsAuthenticated(false)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
