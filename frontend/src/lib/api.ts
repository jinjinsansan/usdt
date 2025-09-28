import type { TraceRequest, TraceResult } from '@/types/trace';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = (payload as { message?: string }).message ?? 'サーバーエラーが発生しました';
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};

export const fetchTrace = async (input: TraceRequest): Promise<TraceResult> => {
  const response = await fetch(`${API_BASE_URL}/trace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return handleResponse<TraceResult>(response);
};

export const fetchHistory = async (): Promise<TraceResult[]> => {
  const response = await fetch(`${API_BASE_URL}/trace/history`);
  const payload = await handleResponse<{ items: TraceResult[] }>(response);
  return payload.items;
};
