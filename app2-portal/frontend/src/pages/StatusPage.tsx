import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReportStatus } from '../services/reportService';
import type { ReportResponse } from '../types/report';
import { isAxiosError } from 'axios';

export default function StatusPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setErrorMsg('No se proporcionó un ID de solicitud válido.');
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchStatus = async () => {
      try {
        const data = await getReportStatus(requestId);
        if (isSubscribed) {
          setReport(data);
          setErrorMsg(null);
          setLoading(false);
          
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        if (isSubscribed) {
          clearInterval(intervalId);
          setLoading(false);
          if (isAxiosError(err) && err.response?.status === 404) {
            setErrorMsg('No se encontró ninguna solicitud con este ID.');
          } else {
            setErrorMsg('Error al consultar el estado de la solicitud. Por favor, intenta de nuevo más tarde.');
          }
        }
      }
    };

    // Initial fetch
    fetchStatus();

    // Polling every 3 seconds
    intervalId = setInterval(fetchStatus, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [requestId]);

  const renderContent = () => {
    // Si hubo un error en la llamada HTTP
    if (errorMsg) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Consulta Fallida</h2>
          <p className="text-slate-600 mb-6">{errorMsg}</p>
          <Link to="/" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md">
            Volver al inicio
          </Link>
        </div>
      );
    }

    // Si aún no tenemos los datos del reporte (primera carga)
    if (loading && !report) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 font-medium">Buscando solicitud...</p>
        </div>
      );
    }

    if (report) {
      // Estado: Procesando (PENDING o PROCESSING)
      if (report.status === 'PENDING' || report.status === 'PROCESSING') {
        return (
          <div className="flex flex-col items-center justify-center text-center py-6 animate-fade-in-up">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-indigo-100 rounded-full absolute"></div>
              <div className="w-20 h-20 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Procesando Solicitud</h2>
            <p className="text-slate-600 mb-3 leading-relaxed">Estamos recopilando tus antecedentes en nuestro sistema. Esto puede tardar unos minutos...</p>
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {report.status}
            </span>
          </div>
        );
      }

      // Estado: Exitoso (COMPLETED)
      if (report.status === 'COMPLETED') {
        return (
          <div className="flex flex-col items-center justify-center text-center py-4 animate-fade-in-up w-full">
            <div className="w-20 h-20 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-4 ring-8 ring-green-50">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Reporte Generado</h2>
            <p className="text-slate-600 mb-6">Tu consulta de antecedentes OSINT ha finalizado exitosamente.</p>
            
            {report.pdfUrl ? (
              <a 
                href={report.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 hover:shadow-indigo-200 hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar Reporte PDF
              </a>
            ) : (
              <p className="text-slate-500 italic mb-4">El archivo no se encuentra disponible en este momento.</p>
            )}
            
            <Link to="/" className="mt-5 text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors">
              Realizar nueva consulta
            </Link>
          </div>
        );
      }

      // Estado: Fallido (FAILED)
      if (report.status === 'FAILED') {
        return (
          <div className="flex flex-col items-center justify-center text-center py-4 animate-fade-in-up w-full">
            <div className="w-20 h-20 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 ring-8 ring-red-50">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Proceso Fallido</h2>
            <p className="text-slate-600 mb-6">No fue posible generar el reporte debido a un error interno del sistema o falta de información.</p>
            <Link to="/" className="w-full px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-200">
              Intentar nuevamente
            </Link>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50 p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200/60 relative overflow-hidden flex flex-col min-h-[440px] justify-between">
        
        {/* Adorno superior en la card */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="flex-grow flex items-center justify-center">
          {renderContent()}
        </div>

        {requestId && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Referencia de Solicitud</p>
            <p className="text-xs text-slate-500 font-mono bg-slate-50/80 py-1.5 px-3 rounded-md border border-slate-100 break-all select-all">
              {requestId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
