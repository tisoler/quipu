import LogoSvg from './Logo';

export default function Loading({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen' : 'h-[60vh]'} bg-transparent`}>
      <div className="relative">
        {/* Logo que gira suavemente */}
        <div className="animate-spin-slow">
          <LogoSvg width={100} height={100} />
        </div>

        {/* Spinner circular adicional (opcional para más detalle visual) */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 dark:border-blue-900/30 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
      </div>

      <div className="mt-8 text-center animate-pulse-soft">
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Quipu</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Preparando tu entorno...</p>
      </div>
    </div>
  );
}
