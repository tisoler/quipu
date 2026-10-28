import PageHeader from '../components/PageHeader'

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general de tu inventario."
      />
      <div className="card p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Bienvenido al dashboard. El contenido se agregará próximamente.
        </p>
      </div>
    </div>
  )
}
