export interface CreateReportRequest {
  cedula: string;
  email: string;
}

export interface ReportResponse {
  requestId: string;
  cedula: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  pdfUrl: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface ApiErrorResponse {
  error?: string;
  [key: string]: string | undefined;
}
