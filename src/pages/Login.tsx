import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
} from 'firebase/auth'
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { auth, googleProvider } from '../lib/firebase'
import LogoSvg from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

const inputClass =
  'w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 ' +
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ' +
  'outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Modos de vista: 'login', 'register', 'reset'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'reset'>('login')

  const navigate = useNavigate()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (viewMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await sendEmailVerification(cred.user)
        setSuccessMsg('Registro exitoso. Se ha enviado un email de verificación.')
        setViewMode('login')
      } else if (viewMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
        navigate('/')
      } else if (viewMode === 'reset') {
        await sendPasswordResetEmail(auth, email)
        setSuccessMsg('Email de recuperación enviado. Revisa tu bandeja de entrada.')
        setViewMode('login')
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') setError('Usuario no encontrado.')
      else if (err.code === 'auth/wrong-password') setError('Contraseña incorrecta.')
      else if (err.code === 'auth/email-already-in-use') setError('El email ya está registrado.')
      else setError(err.message || 'Ocurrió un error.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }

  const switchView = (mode: 'login' | 'register' | 'reset') => {
    setViewMode(mode)
    setError('')
    setSuccessMsg('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 px-4">
      {/* Selector de tema, siempre accesible */}
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center pb-12">
        <div className="w-full max-w-md">
          {/* Marca */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3">
              <LogoSvg width={56} height={56} />
              <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Quipu
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Gestión de stock, ventas, compras y almacenes
            </p>
          </div>

          {/* Tarjeta principal */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-8">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {viewMode === 'login' && 'Iniciar sesión'}
              {viewMode === 'register' && 'Crear cuenta'}
              {viewMode === 'reset' && 'Recuperar contraseña'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {viewMode === 'login' && 'Ingresá tus credenciales para continuar.'}
              {viewMode === 'register' && 'Completá tus datos para registrarte.'}
              {viewMode === 'reset' && 'Te enviaremos un correo para restablecer tu contraseña.'}
            </p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-3 py-2.5 rounded-lg mb-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm px-3 py-2.5 rounded-lg mb-4">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleEmailAuth}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClass}
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {viewMode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contraseña
                    </label>
                    {viewMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchView('reset')}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete={viewMode === 'register' ? 'new-password' : 'current-password'}
                      className={inputClass}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Procesando...' : viewMode === 'login' ? 'Iniciar sesión' : viewMode === 'register' ? 'Crear cuenta' : 'Enviar correo'}
              </button>

              {viewMode === 'login' && (
                <>
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500">o</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Enlaces secundarios */}
          <div className="mt-6 text-center text-sm">
            {viewMode === 'login' ? (
              <p className="text-gray-500 dark:text-gray-400">
                ¿No tenés cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Registrate
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => switchView('login')}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
