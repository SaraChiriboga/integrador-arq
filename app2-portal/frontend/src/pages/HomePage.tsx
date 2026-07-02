import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidCedula } from '../utils/cedulaValidator';
import { createReport } from '../services/reportService';
import { isAxiosError } from 'axios';

export default function HomePage() {
  const navigate = useNavigate();
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validate cedula only if the user has typed 10 chars
  const isCedulaComplete = cedula.length === 10;
  const isCedulaValid = useMemo(() => isCedulaComplete && isValidCedula(cedula), [cedula, isCedulaComplete]);
  const showCedulaError = isCedulaComplete && !isCedulaValid;

  // Basic email validation regex
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid = isCedulaValid && isEmailValid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await createReport({ cedula, email });
      // Se guarda el correo para que StatusPage pueda disparar el envío real
      // vía EmailJS cuando el reporte quede listo (el backend ya no lo hace).
      localStorage.setItem(`report-email-${response.requestId}`, email);
      navigate(`/status/${response.requestId}`);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        const data = error.response.data as Record<string, string>;
        
        if (status === 409) {
          setErrorMsg('Ya existe una solicitud en proceso para esta cédula. Intenta consultar el estado más tarde o espera unos minutos.');
        } else if (status === 400 && data) {
          // Extraemos los errores de validación
          const validationErrors = Object.entries(data)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(' | ');
          setErrorMsg(validationErrors || 'Datos inválidos. Por favor, revisa la información ingresada.');
        } else {
          setErrorMsg('Ocurrió un error en el servidor, intenta nuevamente.');
        }
      } else {
        setErrorMsg('Ocurrió un error de red, por favor verifica tu conexión e intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200/60 relative overflow-hidden">
        
        {/* Adorno superior en la card */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-4 ring-8 ring-indigo-50/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Portal Ciudadano</h1>
          <p className="text-slate-500 text-sm font-medium">Consulta de Antecedentes (OSINT)</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200/70 text-red-700 text-sm flex items-start shadow-sm animate-fade-in-up">
            <svg className="w-5 h-5 mr-2.5 mt-0.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="cedula" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Número de Cédula
            </label>
            <input
              id="cedula"
              type="text"
              maxLength={10}
              value={cedula}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCedula(val);
              }}
              className={`w-full px-4 py-3 rounded-xl border ${
                showCedulaError 
                  ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500 bg-red-50/30' 
                  : 'border-slate-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-slate-50/50'
              } text-slate-800 placeholder-slate-400 shadow-sm outline-none transition-all duration-200`}
              placeholder="Ej: 1710034065"
              required
            />
            {showCedulaError && (
              <p className="mt-1.5 text-sm text-red-500 font-medium">
                La cédula ingresada no es válida.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 placeholder-slate-400 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200"
              placeholder="tu@correo.com"
              required
            />
            <p className="mt-2 text-xs text-slate-500 font-medium">
              A este correo enviaremos tu reporte finalizado.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold shadow-md transition-all duration-200 flex justify-center items-center ${
                !isFormValid || loading
                  ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:shadow-lg active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando solicitud...
                </>
              ) : (
                'Consultar Antecedentes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
