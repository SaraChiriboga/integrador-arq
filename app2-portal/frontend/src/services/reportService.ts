import { api } from './api';
import type { CreateReportRequest, ReportResponse } from '../types/report';

export const createReport = async (data: CreateReportRequest): Promise<ReportResponse> => {
  const response = await api.post<ReportResponse>('/reports', data);
  return response.data;
};

export const getReportStatus = async (requestId: string): Promise<ReportResponse> => {
  const response = await api.get<ReportResponse>(`/reports/${requestId}`);
  return response.data;
};
