import { useParams } from 'react-router-dom'

export default function StatusPage() {
  const { requestId } = useParams()
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">StatusPage</h1>
      <p>Página de estado para el reporte: {requestId}</p>
    </div>
  )
}
