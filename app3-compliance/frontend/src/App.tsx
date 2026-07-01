import { useState, useEffect } from 'react'

interface Alert {
  alertId: string;
  requestId: string;
  targetId: string;
  fullName: string;
  riskLevel: string;
  matchReason: string;
  timestamp: number;
}

interface OsintReport {
  id: string;
  targetId: string;
  fullName: string;
  pdfUrl: string;
  status: string;
  completedAt: number;
}

function App() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OsintReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/v1/compliance/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8081/api/v1/compliance/search?q=${searchQuery}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll every 5 seconds for new alerts
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitoreo de alertas y reportes OSINT</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel Izquierdo: Buscador */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Búsqueda de Reportes</h2>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar por cédula o nombre..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                Buscar
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {searchResults.length === 0 && !loading && (
              <p className="text-gray-500 text-center py-4">No hay resultados de búsqueda.</p>
            )}
            {loading && <p className="text-gray-500 text-center py-4">Buscando...</p>}
            {searchResults.map((report) => (
              <div key={report.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900">{report.fullName}</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1"><strong>Cédula:</strong> {report.targetId}</p>
                <a
                  href={report.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver PDF OSINT
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Derecho: Feed de Alertas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            Alertas Recientes
            <span className="bg-red-100 text-red-700 text-xs py-1 px-2 rounded-full font-bold">
              {alerts.length}
            </span>
          </h2>
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
            {alerts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay alertas recientes.</p>
            )}
            {alerts.map((alert) => (
              <div key={alert.alertId} className="p-4 border-l-4 border-red-500 rounded-r-lg bg-red-50">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900">{alert.fullName}</h3>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2"><strong>Cédula:</strong> {alert.targetId}</p>
                <div className="bg-white p-3 rounded text-sm text-red-800 border border-red-100">
                  {alert.matchReason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
