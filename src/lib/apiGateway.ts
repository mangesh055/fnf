// Microservices API Gateway Client
export const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000/api`;

export async function gatewayFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const token = localStorage.getItem('campusnest_jwt_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.warn(`[API Gateway] Call to ${endpoint} failed or offline, falling back:`, err?.message || err);
    return { success: false, error: err?.message || 'Gateway network error' };
  }
}
