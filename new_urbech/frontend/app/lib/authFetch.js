export function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
}

export function withAuth(init = {}) {
  const headers = new Headers(init.headers || {});
  const token = getAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return {
    ...init,
    headers,
  };
}
