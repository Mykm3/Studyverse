import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Creates headers with authentication token if available
 */
const getHeaders = (customHeaders = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('[API] No authentication token found in localStorage');
  } else {
    console.log('[API] Token found in localStorage:', `${token.substring(0, 15)}...`);
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders
  };
  console.log('[API] Request headers:', {
    contentType: headers['Content-Type'],
    authorization: headers.Authorization ? 'Bearer token present' : 'No Authorization header',
    ...Object.keys(customHeaders).reduce((acc, key) => {
      acc[key] = headers[key] ? 'Present' : 'Missing';
      return acc;
    }, {})
  });
  return headers;
};

/**
 * Makes an authenticated API request
 */
const api = {
  get: async (endpoint) => {
    console.log(`[API] GET request to ${API_URL}${endpoint}`);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: getHeaders()
      });
      console.log(`[API] GET response status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(e => 'No response body');
        console.error(`[API] Error response:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500) // Truncate large error responses
        });
        
        // Try to parse the error as JSON if possible
        let errorObj = { message: response.statusText };
        try {
          if (errorText && errorText.trim().startsWith('{')) {
            errorObj = JSON.parse(errorText);
          }
        } catch (parseError) {
          console.warn('[API] Could not parse error response as JSON:', parseError);
        }
        
        throw new Error(`API Error: ${errorObj.message || response.statusText}`);
      }
      
      // Handle empty response
      if (response.status === 204) {
        console.log(`[API] GET response is empty (204 No Content)`);
        return null;
      }
      
      try {
        const data = await response.json();
        console.log(`[API] GET response data:`, data);
        return data;
      } catch (parseError) {
        console.error(`[API] Error parsing JSON response:`, parseError);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error(`[API] GET request failed:`, error);
      throw error;
    }
  },

  post: async (endpoint, data) => {
    console.log(`[API] POST request to ${API_URL}${endpoint}`, data);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      console.log(`[API] POST response status:`, response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[API] Error response:`, errorData);
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`[API] POST response data:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`[API] POST request failed:`, error);
      throw error;
    }
  },

  put: async (endpoint, data) => {
    console.log(`[API] PUT request to ${API_URL}${endpoint}`, data);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      console.log(`[API] PUT response status:`, response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[API] Error response:`, errorData);
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`[API] PUT response data:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`[API] PUT request failed:`, error);
      throw error;
    }
  },

  delete: async (endpoint) => {
    console.log(`[API] DELETE request to ${API_URL}${endpoint}`);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      console.log(`[API] DELETE response status:`, response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[API] Error response:`, errorData);
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`[API] DELETE response data:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`[API] DELETE request failed:`, error);
      throw error;
    }
  },

  // Special method for file uploads
  upload: async (endpoint, formData) => {
    console.log(`[API] UPLOAD request to ${API_URL}${endpoint}`);
    
    // Log formData contents (excluding the actual file binary data)
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`[API] FormData - ${key}:`, {
          name: value.name,
          type: value.type,
          size: value.size
        });
      } else {
        console.log(`[API] FormData - ${key}:`, value);
      }
    }
    
    const token = localStorage.getItem('token');
    console.log('[API] Using token:', token ? `${token.substring(0, 10)}...` : 'none');
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      console.log(`[API] UPLOAD response status:`, response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[API] Error response:`, errorData);
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`[API] UPLOAD response data:`, responseData);
      return responseData;
    } catch (error) {
      console.error(`[API] UPLOAD request failed:`, error);
      throw error;
    }
  }
};

export default api; 