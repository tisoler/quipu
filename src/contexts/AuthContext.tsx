import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import api from '../lib/api'

interface User {
  id: number
  nombreUsuario: string
  idEmpresa: number
  nombreEmpresa: string
  roles: string[]
  permisos: string[]
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  permisos: string[]
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [permisos, setPermisos] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setLoading(true)
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser)
        try {
          // Esperar un momento a que el token este disponible
          await currentFirebaseUser.getIdToken()
          // Pedir al backend los detalles del usuario
          const response = await api.get('/auth/me')
          const userData = response.data
          setUser(userData)
          setPermisos(userData.permisos || [])
        } catch (error) {
          console.error('Error obteniendo perfil del backend', error)
          // Si el usuario no existe en la BD o falla la conexion, 
          // probablemente deberiamos desloguearlo o mostrar un error
          setUser(null)
          setPermisos([])
        }
      } else {
        setFirebaseUser(null)
        setUser(null)
        setPermisos([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setFirebaseUser(null)
    setPermisos([])
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, permisos, loading, logout }}>
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
