/**
 * API Client for connecting to the backend server
 */

// Default API URL - can be overridden by environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Handles API requests with proper error handling
 */
async function fetchApi(
  endpoint: string, 
  options: FetchOptions = {}
): Promise<any> {
  const { params, ...fetchOptions } = options;
  
  // Build URL with query parameters if provided
  let url = `${API_BASE_URL}${endpoint}`;
  console.log('API URL:', url); // Debugging line to check the URL
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    url += `?${searchParams.toString()}`;
  }

  // Default headers with proper type definition
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Get auth token from localStorage if available (client-side only)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Parse JSON response
    const data = await response.json();
    console.log('API Response:', data); // Debugging line to check the response
    // Handle API errors
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// API client with methods for different HTTP verbs
const apiClient = {
  get: (endpoint: string, options: FetchOptions = {}) => 
    fetchApi(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, data: any, options: FetchOptions = {}) =>
    fetchApi(endpoint, { 
      ...options, 
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: (endpoint: string, data: any, options: FetchOptions = {}) =>
    fetchApi(endpoint, { 
      ...options, 
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (endpoint: string, options: FetchOptions = {}) =>
    fetchApi(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;