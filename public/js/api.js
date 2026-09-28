// API Client for Los Santos Enterprise Ranking System

const API = {
  baseUrl: '/api',

  getStoredUser() {
    try {
      const u = localStorage.getItem('ls_ranking_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user) {
    if (user) {
      localStorage.setItem('ls_ranking_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ls_ranking_user');
    }
  },

  async request(endpoint, options = {}) {
    const user = this.getStoredUser();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (user && user.id) {
      headers['x-user-id'] = user.id;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Une erreur est survenue sur le serveur');
    }
    return data;
  },

  // Auth
  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setStoredUser(res.user);
    return res.user;
  },

  async getMe() {
    try {
      const res = await this.request('/auth/me');
      this.setStoredUser(res.user);
      return res.user;
    } catch {
      this.setStoredUser(null);
      return null;
    }
  },

  logout() {
    this.setStoredUser(null);
  },

  // Categories & Enterprises
  async getCategories() {
    return this.request('/categories');
  },

  async getEnterprises() {
    return this.request('/enterprises');
  },

  async addEnterprise(data) {
    return this.request('/enterprises', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Weeks
  async getWeeks() {
    return this.request('/weeks');
  },

  async createWeek(title, startDate, endDate, setActive = true) {
    return this.request('/weeks', {
      method: 'POST',
      body: JSON.stringify({ title, startDate, endDate, setActive })
    });
  },

  async setActiveWeek(weekId) {
    return this.request('/weeks/set-active', {
      method: 'POST',
      body: JSON.stringify({ weekId })
    });
  },

  // Reports
  async getReports(weekId) {
    const query = weekId ? `?weekId=${encodeURIComponent(weekId)}` : '';
    return this.request(`/reports${query}`);
  },

  async saveReport(reportData) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  async awardReport(reportId, badge, comment) {
    return this.request(`/reports/${encodeURIComponent(reportId)}/award`, {
      method: 'POST',
      body: JSON.stringify({ badge, comment })
    });
  },

  // Founder Users Management
  async getUsers() {
    return this.request('/users');
  },

  async saveUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async deleteUser(userId) {
    return this.request(`/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
  },

  // Discord OAuth & Role Mapping
  async getDiscordAuthUrl() {
    return this.request('/auth/discord/url');
  },

  async simulateDiscordLogin(options, username) {
    let payload = {};
    if (typeof options === 'string') {
      payload = { roleName: options, username };
    } else if (Array.isArray(options)) {
      payload = { roles: options, username };
    } else if (typeof options === 'object') {
      payload = { ...options, username: username || options?.username };
    }
    const res = await this.request('/auth/discord/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setStoredUser(res.user);
    return res;
  },

  async selectDiscordEnterprise(statusRole, enterpriseId) {
    const res = await this.request('/auth/discord/select-enterprise', {
      method: 'POST',
      body: JSON.stringify({ statusRole, enterpriseId })
    });
    this.setStoredUser(res.user);
    return res.user;
  },

  async getDiscordConfig() {
    return this.request('/discord/config');
  },

  async saveDiscordConfig(config) {
    return this.request('/discord/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  async getDiscordRoleMappings() {
    return this.request('/discord/mappings');
  },

  async saveDiscordRoleMapping(mapping) {
    return this.request('/discord/mappings', {
      method: 'POST',
      body: JSON.stringify(mapping)
    });
  },

  async deleteDiscordRoleMapping(mappingId) {
    return this.request(`/discord/mappings/${encodeURIComponent(mappingId)}`, {
      method: 'DELETE'
    });
  },

  // Stats
  async getStats(weekId) {
    const query = weekId ? `?weekId=${encodeURIComponent(weekId)}` : '';
    return this.request(`/stats${query}`);
  },

  // Discord Export
  async getDiscordExport(weekId) {
    const query = weekId ? `?weekId=${encodeURIComponent(weekId)}` : '';
    return this.request(`/export/discord${query}`);
  }
};
