const BASE_URL = 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Something went wrong');
  }
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
  // UC3: Update Product
  async updateProduct(id, data) {
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, { 
      method: 'PUT', // or PATCH depending on backend
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

  // --- ACCOUNTS ---
  async getAccounts() {
    const response = await fetch(`${BASE_URL}/api/users/`, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },
  async createAccount(data) {
    const response = await fetch(`${BASE_URL}/api/users/`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(response);
  },
  // UC6: Delete Account
  async deleteAccount(id) {
    const response = await fetch(`${BASE_URL}/api/users/${id}/`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  },

  // --- UC4: COMPLAINTS ---
  async getComplaints() {
    const response = await fetch(`${BASE_URL}/api/complaints/`, { method: 'GET', headers: getHeaders() });
    return handleResponse(response);
  },
  async resolveComplaint(id, resolution) {
    const response = await fetch(`${BASE_URL}/api/complaints/${id}/resolve/`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ resolution, status: 'RESOLVED' }) 
    });
    return handleResponse(response);
  }
};