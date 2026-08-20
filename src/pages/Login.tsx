import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import LogoSvg from '../components/Logo'

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className='flex items-center justify-center gap-3'>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Quipu
            </h2>
            <LogoSvg width={80} height={80} />
          </div>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {viewMode === 'login' && 'Inicia sesión en tu cuenta'}
            {viewMode === 'register' && 'Crea tu nueva cuenta'}
            {viewMode === 'reset' && 'Recuperar contraseña'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleEmailAuth}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded">
              {successMsg}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${viewMode === 'reset' ? 'rounded-md' : 'rounded-t-md'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {viewMode !== 'reset' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 mb-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : viewMode === 'login' ? 'Iniciar sesión' : viewMode === 'register' ? 'Registrarse' : 'Enviar correo'}
            </button>

            {viewMode === 'login' && (
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="group relative w-full flex items-center justify-center py-2 px-4 mb-4 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </button>
            )}

            <div className="flex flex-col space-y-2 mt-4 text-center">
              {viewMode === 'login' ? (
                <>
                  <button type="button" onClick={() => { setViewMode('register'); setError(''); setSuccessMsg(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    ¿No tienes cuenta? Regístrate
                  </button>
                  <button type="button" onClick={() => { setViewMode('reset'); setError(''); setSuccessMsg(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    ¿Olvidaste tu contraseña?
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => { setViewMode('login'); setError(''); setSuccessMsg(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Volver al inicio de sesión
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
