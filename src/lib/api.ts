const API_URL = ''; // Same origin

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ocorreu um erro inesperado' }));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
}

export const authApi = {
  login: (credentials: any) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  me: () => apiRequest('/api/auth/me'),
  updateProfile: (data: any) => apiRequest('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const ordersApi = {
  list: () => apiRequest('/api/orders'),
  create: (order: any) => apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(order) }),
  update: (id: string, data: any) => apiRequest(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  reopen: (id: string, status: string) => apiRequest(`/api/orders/${id}/reopen`, { method: 'POST', body: JSON.stringify({ status }) }),
  getRevisions: (id: string) => apiRequest(`/api/orders/${id}/revisions`),
};

export const usersApi = {
  list: () => apiRequest('/api/users'),
};
