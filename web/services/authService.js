const BASE_URL = 'http://localhost:8000';

// Helper to handle response errors
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || 'Something went wrong');
  }
  return response.json();
}

export const authService = {
  // 1. Register
  async register(userData) {
    const response = await fetch(`${BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    // Registration usually doesn't return JSON if 201 Created, but we check ok
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed');
    }
    return true;
  },

  // 2. Login
  async login(email, password) {
    const response = await fetch(`${BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  // 3. Get Current User (Me)
  async getMe(accessToken) {
    const response = await fetch(`${BASE_URL}/api/auth/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  // 4. Refresh Token
  async refreshToken(refreshToken) {
    const response = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    return handleResponse(response);
  }
};