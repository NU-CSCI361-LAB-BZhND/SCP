const BASE_URL = 'http://localhost:8000';

// Helper to get headers with Auth token
const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorData = await response.json();
      // Try to find the specific error message, including nested validation errors
      errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch (e) {
      errorMessage = response.statusText;
    }
    // Throw an Error object with the message
    throw new Error(errorMessage); 
  }
  
  // Some endpoints (like DELETE) might return 204 No Content
  if (response.status === 204) return null;
  return response.json();
};

export const dataService = {
  // --- PRODUCTS ---
  async getProducts() {
    const response = await fetch(`${BASE_URL}/api/products/`, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },

  async createProduct(data) {
    const response = await fetch(`${BASE_URL}/api/products/`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(response);
  },

  async updateProduct(id, data) {
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, { 
      method: 'PATCH', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(response);
  },

  async deleteProduct(id) {
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  },

  // --- ORDERS ---
  async getOrders() {
    const response = await fetch(`${BASE_URL}/api/orders/`, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },

  async updateOrderStatus(id, status) {
    const response = await fetch(`${BASE_URL}/api/orders/${id}/`, { 
      method: 'PATCH', 
      headers: getHeaders(), 
      body: JSON.stringify({ status }) 
    });
    return handleResponse(response);
  },

  // --- ACCOUNTS (STAFF) ---
  async getAccounts() {
    const response = await fetch(`${BASE_URL}/api/auth/staff/`, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },

  async createAccount(userData) {
    const response = await fetch(`${BASE_URL}/api/auth/staff/`, { 
      method: 'POST', 
      headers: getHeaders(),
      body: JSON.stringify(userData) 
    });
    return handleResponse(response);
  },

  async deleteAccount(id) {
    const response = await fetch(`${BASE_URL}/api/auth/staff/${id}/`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  },

  // --- UC4: COMPLAINTS ---
  async getComplaints() {
    const response = await fetch(`${BASE_URL}/api/support/complaints/`, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },

  async resolveComplaint(id, resolution) {
    const response = await fetch(`${BASE_URL}/api/support/complaints/${id}/resolve/`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ resolution, status: 'RESOLVED' }) 
    });
    return handleResponse(response);
  }
};