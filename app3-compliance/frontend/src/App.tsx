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
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-indigo-50/80 to-blue-100 p-4 md:p-8 font-sans text-slate-800 relative overflow-hidden">
      {/* Elementos decorativos de fondo tipo orb (blur) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/30 blur-3xl pointer-events-none animate-pulse duration-1000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300/30 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-10 flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-6 sm:p-8 transition-all hover:bg-white/80 duration-500">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-800 tracking-tight">Compliance Engine</h1>
              <p className="text-slate-500 font-medium mt-1">Centro de Auditoría y Monitoreo OSINT</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10">
          {/* Panel Izquierdo: Buscador */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 border border-white/80 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            
            <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight">Búsqueda de Reportes</h2>
            <form onSubmit={handleSearch} className="mb-8 relative">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por cédula o nombre..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 bg-white/50 text-slate-800 placeholder-slate-400 shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:w-auto w-full py-4 px-8 rounded-2xl text-white font-bold shadow-lg shadow-indigo-500/25 transition-all duration-300 flex justify-center items-center bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Consultando...' : 'Consultar'}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {searchResults.length === 0 && !loading && (
                <div className="p-10 text-center bg-white/40 rounded-2xl border border-slate-200/50 border-dashed">
                  <p className="text-slate-500 font-medium">Ingresa un criterio para iniciar la búsqueda en Elasticsearch.</p>
                </div>
              )}
              {loading && (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              )}
              {searchResults.map((report) => (
                <div key={report.id} className="p-6 border border-slate-200/60 rounded-2xl bg-white/60 hover:bg-white/90 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-900">{report.fullName}</h3>
                    <span className="px-3 py-1.5 bg-emerald-100/80 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wider border border-emerald-200">
                      {report.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 bg-slate-100/50 w-fit px-3 py-1 rounded-lg">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                    <strong>Cédula:</strong> {report.targetId}
                  </div>
                  <a
                    href={report.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Descargar Reporte OSINT
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Derecho: Feed de Alertas */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 border border-white/80 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute"></div>
                  <div className="w-3 h-3 rounded-full bg-red-500 relative"></div>
                </div>
                Alertas de Riesgo
              </h2>
              <span className="bg-red-500 text-white text-sm py-1.5 px-3 rounded-xl font-bold shadow-md shadow-red-500/20">
                {alerts.length} Detectadas
              </span>
            </div>
            
            <div className="space-y-5 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {alerts.length === 0 && (
                <div className="p-10 text-center bg-white/40 rounded-2xl border border-slate-200/50 border-dashed">
                  <p className="text-slate-500 font-medium">Sistema en monitoreo. No se han detectado riesgos de compliance.</p>
                </div>
              )}
              {alerts.map((alert) => (
                <div key={alert.alertId} className="p-6 rounded-2xl bg-white shadow-md border border-red-100 relative overflow-hidden group hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
                  
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-400 to-rose-600"></div>
                  
                  <div className="flex justify-between items-start mb-3 pl-3">
                    <h3 className="text-lg font-extrabold text-slate-900">{alert.fullName}</h3>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="pl-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                      {alert.targetId}
                    </span>
                  </div>

                  <div className="ml-3 bg-red-50/80 p-4 rounded-xl text-sm font-medium text-red-900 border border-red-100 flex items-start shadow-inner">
                    <div className="bg-red-100 p-1.5 rounded-lg mr-3 shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                    </div>
                    <span className="leading-relaxed pt-0.5">{alert.matchReason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
