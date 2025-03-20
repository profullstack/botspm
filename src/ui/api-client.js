// api-client.js - Client for the bots.pm API server

// Default API URL - hardcoded for now
const API_URL = 'http://localhost:3000';

// Store the auth token
let authToken = null;

/**
 * Set the authentication token
 * @param {string} token - The authentication token
 */
export function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('authToken', token);
}

/**
 * Get the stored authentication token
 * @returns {string|null} The authentication token
 */
export function getAuthToken() {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
}

/**
 * Clear the authentication token
 */
export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Parse JSON response
    const data = await response.json();
    
    // Check for error response
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    throw error;
  }
}

/**
 * User authentication API
 */
export const auth = {
  /**
   * Login with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} Login result
   */
  async login(username, password) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (result.success && result.token) {
      setAuthToken(result.token);
    }
    
    return result;
  },
  
  /**
   * Register a new user
   * @param {string} username - New user's username
   * @param {string} password - New user's password
   * @returns {Promise<Object>} Registration result
   */
  async register(username, password) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  
  /**
   * Logout the current user
   */
  logout() {
    clearAuthToken();
  }
};

/**
 * User settings API
 */
export const settings = {
  /**
   * Get user settings
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User settings
   */
  async get(userId) {
    return await apiRequest(`/users/${userId}/settings`);
  },
  
  /**
   * Save user settings
   * @param {number} userId - User ID
   * @param {Object} settings - Settings to save
   * @returns {Promise<Object>} Save result
   */
  async save(userId, settings) {
    return await apiRequest(`/users/${userId}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }
};

/**
 * Bot management API
 */
export const bots = {
  /**
   * Get all bots for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} List of bots
   */
  async getAll(userId) {
    return await apiRequest(`/users/${userId}/bots`);
  },
  
  /**
   * Get a specific bot
   * @param {number} botId - Bot ID
   * @returns {Promise<Object>} Bot details
   */
  async get(botId) {
    return await apiRequest(`/bots/${botId}`);
  },
  
  /**
   * Create a new bot
   * @param {number} userId - User ID
   * @param {Object} botData - Bot data
   * @returns {Promise<Object>} Creation result
   */
  async create(userId, botData) {
    return await apiRequest(`/users/${userId}/bots`, {
      method: 'POST',
      body: JSON.stringify(botData)
    });
  },
  
  /**
   * Update a bot's personality
   * @param {number} botId - Bot ID
   * @param {Object} personalityData - Personality data
   * @returns {Promise<Object>} Update result
   */
  async updatePersonality(botId, personalityData) {
    return await apiRequest(`/bots/${botId}/personality`, {
      method: 'PUT',
      body: JSON.stringify(personalityData)
    });
  }
};

/**
 * Director commands API
 */
export const director = {
  /**
   * Send a director command
   * @param {string} command - Command to send
   * @returns {Promise<Object>} Command result
   */
  async sendCommand(command) {
    return await apiRequest('/director/commands', {
      method: 'POST',
      body: JSON.stringify({ command })
    });
  }
};

// Export the API client
export default {
  auth,
  settings,
  bots,
  director,
  setAuthToken,
  getAuthToken,
  clearAuthToken
};