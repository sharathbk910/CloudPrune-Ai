import axios from 'axios';

const API_BASE = '/api';

// Create an Axios instance with automatic JWT Authorization header injection
const apiClient = axios.create({
  baseURL: API_BASE
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudprune_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    const enhancedError = new Error(customMessage);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);

export const api = {
  // ============================================
  // CLOUD INSTANCE CRUD OPERATIONS
  // ============================================

  // READ all instances (supports query params e.g. { status: 'running' })
  async getInstances(params = {}) {
    const res = await apiClient.get('/instances', { params });
    return res.data;
  },

  // READ single instance by ID
  async getInstance(id) {
    const res = await apiClient.get(`/instances/${id}`);
    return res.data;
  },

  // CREATE a new instance
  async createInstance(instanceData) {
    const res = await apiClient.post('/instances', instanceData);
    return res.data;
  },

  // UPDATE an instance by ID
  async updateInstance(id, updates) {
    const res = await apiClient.put(`/instances/${id}`, updates);
    return res.data;
  },

  // DELETE an instance by ID
  async deleteInstance(id) {
    const res = await apiClient.delete(`/instances/${id}`);
    return res.data;
  },

  // Human-in-the-loop termination (soft delete / status change)
  async terminateInstances(instanceIds, reason) {
    const res = await apiClient.post('/terminate', {
      instanceIds,
      reason
    });
    return res.data;
  },

  // ============================================
  // METRICS & AI AUDIT
  // ============================================

  // Fetch metrics overview
  async getMetrics() {
    const res = await apiClient.get('/metrics');
    return res.data;
  },

  // Execute Gemini FinOps Audit
  async runAudit() {
    const res = await apiClient.post('/audit');
    return res.data;
  },

  // ============================================
  // AUDIT LOGS CRUD
  // ============================================

  // READ historical audit logs
  async getAuditLogs() {
    const res = await apiClient.get('/audit-logs');
    return res.data;
  },

  // DELETE / CLEAR audit logs
  async clearAuditLogs() {
    const res = await apiClient.delete('/audit-logs');
    return res.data;
  },

  // Reset mock infrastructure to seeded state
  async resetDatabase() {
    const res = await apiClient.post('/instances/reset');
    return res.data;
  },

  // ============================================
  // AUTHENTICATION & JWT (IAM)
  // ============================================

  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('cloudprune_token', res.data.token);
    }
    return res.data;
  },

  async register(userData) {
    const res = await apiClient.post('/auth/register', userData);
    if (res.data.token) {
      localStorage.setItem('cloudprune_token', res.data.token);
    }
    return res.data;
  },

  async googleAuth(credential, code = null) {
    const res = await apiClient.post('/auth/google', { credential, code });
    if (res.data.token) {
      localStorage.setItem('cloudprune_token', res.data.token);
    }
    return res.data;
  },

  async getGoogleConfig() {
    const res = await apiClient.get('/auth/google-config');
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async sendOtp(contact, purpose = 'registration') {
    const res = await apiClient.post('/auth/send-otp', { contact, purpose });
    return res.data;
  },

  async verifyOtp(contact, otp) {
    const res = await apiClient.post('/auth/verify-otp', { contact, otp });
    return res.data;
  },

  // Server health
  async getHealth() {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // AI Chat (Gemini 3.8 Flash)
  async chat(messages, systemPrompt = '') {
    const res = await apiClient.post('/chat', { messages, systemPrompt });
    return res.data;
  }
};
