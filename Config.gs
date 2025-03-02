/**
 * AI Product Extractor - Enhanced Configuration Module
 * Version: 3.1.0
 */

const CONFIG = {
  // App metadata
  VERSION: '3.1.0',
  ENV: 'production',
  LAST_UPDATED: '2025-03-01',
  
  // API Configuration
  API: {
    AZURE: {
      BING: {
        ENDPOINT: 'https://api.bing.microsoft.com/v7.0/search',
        KEY: '', // To be set via UI
        RATE_LIMIT: 10, // requests per second
        BATCH_SIZE: 5
      },
      OPENAI: {
        ENDPOINT: 'https://api.openai.com/',
        KEY: '', // To be set via UI
        DEPLOYMENT: 'gpt-4-turbo',
        MAX_TOKENS: 2000,
        TEMPERATURE: 0.7
      }
    },
    KNOWLEDGE_GRAPH: {
      KEY: '', // To be set via UI
      ENDPOINT: 'https://kgsearch.googleapis.com/v1/entities:search',
      LIMIT: 5,
      TYPES: ['Product', 'Organization', 'Brand']
    }
  },

  // Processing settings
  PROCESSING: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    BATCH_SIZE: 5,
    CONCURRENT_REQUESTS: 3,
    TIMEOUT: 30000,
    MAX_REDIRECTS: 5
  },

  // Cache settings
  CACHE: {
    ENABLED: true,
    DURATION: 3600,
    PREFIX: 'AI_EXTRACT_',
    MAX_SIZE: 100000 // bytes
  },

  // Monitoring
  MONITORING: {
    ENABLED: true,
    LOG_LEVEL: 'INFO',
    METRICS_INTERVAL: 60000,
    ALERT_THRESHOLD: 0.1 // 10% error rate
  },

  // Sheet configuration
  SHEETS: {
    DATA: "AI Crawler Data",
    LOGS: "System Logs",
    STATS: "Analytics",
    CONFIG: "Configuration"
  },

  // Status constants
  STATUS: {
    PENDING: 'Pending',
    PROCESSING: '🔄 Processing',
    COMPLETED: '✅ Completed',
    ERROR: '❌ Error',
    SKIPPED: '⏭️ Skipped'
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 60000,
    MAX_REQUESTS: 100,
    DELAY_MS: 1000
  },

  // Security
  SECURITY: {
    MIN_API_KEY_LENGTH: 20,
    KEY_ROTATION_DAYS: 90,
    MAX_FAILED_ATTEMPTS: 5
  },

  // Performance optimization
  PERFORMANCE: {
    CHUNK_SIZE: 1000,
    MAX_PARALLEL_OPERATIONS: 3,
    MEMORY_THRESHOLD: 0.9
  },

  /**
   * Gets current time in specified timezone
   */
  getLocalTime: function(timezone = 'Asia/Dhaka') {
    return Utilities.formatDate(
      new Date(), 
      timezone,
      'yyyy-MM-dd HH:mm:ss'
    );
  },

  /**
   * Validates API configuration
   */
  validateConfig: function() {
    // Load API keys from storage
    this.loadApiKeys();
    
    const required = ['AZURE.BING.KEY', 'AZURE.OPENAI.KEY', 'KNOWLEDGE_GRAPH.KEY'];
    const missing = [];

    required.forEach(key => {
      const value = this.getNestedValue(this.API, key);
      if (!value) missing.push(key);
    });

    if (missing.length > 0) {
      Logger.warn("CONFIG", `Missing required API keys: ${missing.join(', ')}`);
      return false;
    }

    return true;
  },

  /**
   * Gets nested object value using dot notation
   */
  getNestedValue: function(obj, path) {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : null, obj);
  },
  
  /**
   * Sets nested object value using dot notation
   */
  setNestedValue: function(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const parent = parts.reduce((current, key) => {
      if (current[key] === undefined) current[key] = {};
      return current[key];
    }, obj);
    
    parent[last] = value;
    return obj;
  },

  /**
   * Initialize configuration
   */
  initialize: function() {
    try {
      this.loadSettings();
      this.validateConfig();
      this.setupCaching();
      this.setupMonitoring();
      return true;
    } catch (error) {
      Logger.error('CONFIG_INIT', 'Failed to initialize configuration', error);
      return false;
    }
  },
  
  /**
   * Load API keys from storage
   */
  loadApiKeys: function() {
    try {
      const scriptProps = PropertiesService.getScriptProperties();
      const apiKeysJson = scriptProps.getProperty('API_KEYS');
      
      if (apiKeysJson) {
        const apiKeys = JSON.parse(apiKeysJson);
        
        // Update API key configurations
        if (apiKeys.AZURE_BING) this.API.AZURE.BING.KEY = apiKeys.AZURE_BING;
        if (apiKeys.AZURE_OPENAI) this.API.AZURE.OPENAI.KEY = apiKeys.AZURE_OPENAI;
        if (apiKeys.KNOWLEDGE_GRAPH) this.API.KNOWLEDGE_GRAPH.KEY = apiKeys.KNOWLEDGE_GRAPH;
      }
    } catch (error) {
      Logger.error('CONFIG_KEYS', 'Failed to load API keys', error);
    }
  },
  
  /**
   * Save API keys to storage
   */
  saveApiKeys: function() {
    try {
      const scriptProps = PropertiesService.getScriptProperties();
      
      const apiKeys = {
        AZURE_BING: this.API.AZURE.BING.KEY,
        AZURE_OPENAI: this.API.AZURE.OPENAI.KEY,
        KNOWLEDGE_GRAPH: this.API.KNOWLEDGE_GRAPH.KEY
      };
      
      scriptProps.setProperty('API_KEYS', JSON.stringify(apiKeys));
      return true;
    } catch (error) {
      Logger.error('CONFIG_KEYS', 'Failed to save API keys', error);
      return false;
    }
  },
  
  /**
   * Load settings from storage
   */
  loadSettings: function() {
    try {
      const scriptProps = PropertiesService.getScriptProperties();
      const settingsJson = scriptProps.getProperty('SETTINGS');
      
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        
        // Update processing settings
        if (settings.BATCH_SIZE) this.PROCESSING.BATCH_SIZE = settings.BATCH_SIZE;
        if (settings.MAX_RETRIES) this.PROCESSING.MAX_RETRIES = settings.MAX_RETRIES;
        if (settings.TIMEOUT) this.PROCESSING.TIMEOUT = settings.TIMEOUT;
        
        // Update cache settings
        if (settings.CACHE_ENABLED !== undefined) this.CACHE.ENABLED = settings.CACHE_ENABLED;
        if (settings.CACHE_DURATION) this.CACHE.DURATION = settings.CACHE_DURATION;
        
        // Update monitoring settings
        if (settings.LOG_LEVEL) this.MONITORING.LOG_LEVEL = settings.LOG_LEVEL;
        
        // Update sheet names
        if (settings.DATA_SHEET) this.SHEETS.DATA = settings.DATA_SHEET;
        if (settings.LOGS_SHEET) this.SHEETS.LOGS = settings.LOGS_SHEET;
      }
    } catch (error) {
      Logger.error('CONFIG_SETTINGS', 'Failed to load settings', error);
    }
  },
  
  /**
   * Save settings to storage
   */
  saveSettings: function() {
    try {
      const scriptProps = PropertiesService.getScriptProperties();
      
      const settings = {
        BATCH_SIZE: this.PROCESSING.BATCH_SIZE,
        MAX_RETRIES: this.PROCESSING.MAX_RETRIES,
        TIMEOUT: this.PROCESSING.TIMEOUT,
        CACHE_ENABLED: this.CACHE.ENABLED,
        CACHE_DURATION: this.CACHE.DURATION,
        LOG_LEVEL: this.MONITORING.LOG_LEVEL,
        DATA_SHEET: this.SHEETS.DATA,
        LOGS_SHEET: this.SHEETS.LOGS
      };
      
      scriptProps.setProperty('SETTINGS', JSON.stringify(settings));
      return true;
    } catch (error) {
      Logger.error('CONFIG_SETTINGS', 'Failed to save settings', error);
      return false;
    }
  },

  /**
   * Setup caching system
   */
  setupCaching: function() {
    if (!this.CACHE.ENABLED) return;
    
    const cache = CacheService.getScriptCache();
    const stats = {
      hits: 0,
      misses: 0,
      size: 0
    };

    this.CACHE.stats = stats;
    this.CACHE.service = cache;
  },

  /**
   * Setup monitoring system
   */
  setupMonitoring: function() {
    if (!this.MONITORING.ENABLED) return;

    this.MONITORING.metrics = {
      requests: 0,
      errors: 0,
      latency: [],
      startTime: Date.now()
    };
  }
};

/**
 * Enhanced cache management
 */
const CacheManager = {
  prefix: CONFIG.CACHE.PREFIX,
  cache: CacheService.getScriptCache(),

  /**
   * Get cached value with prefix
   */
  get: function(key) {
    const prefixedKey = this.prefix + key;
    try {
      const value = this.cache.get(prefixedKey);
      CONFIG.CACHE.stats.hits += value ? 1 : 0;
      CONFIG.CACHE.stats.misses += value ? 0 : 1;
      return value ? JSON.parse(value) : null;
    } catch (error) {
      Logger.warn('CACHE_GET', `Failed to get cached value for ${key}`, error);
      return null;
    }
  },

  /**
   * Set cache value with prefix
   */
  set: function(key, value, duration = CONFIG.CACHE.DURATION) {
    const prefixedKey = this.prefix + key;
    try {
      const stringValue = JSON.stringify(value);
      if (stringValue.length > CONFIG.CACHE.MAX_SIZE) {
        Logger.warn('CACHE_SET', `Value too large for key ${key}`);
        return false;
      }
      this.cache.put(prefixedKey, stringValue, duration);
      CONFIG.CACHE.stats.size += stringValue.length;
      return true;
    } catch (error) {
      Logger.warn('CACHE_SET', `Failed to cache value for ${key}`, error);
      return false;
    }
  },

  /**
   * Remove cached value
   */
  remove: function(key) {
    const prefixedKey = this.prefix + key;
    try {
      this.cache.remove(prefixedKey);
      return true;
    } catch (error) {
      Logger.warn('CACHE_REMOVE', `Failed to remove cached value for ${key}`, error);
      return false;
    }
  },

  /**
   * Clear all cached values with prefix
   */
  clear: function() {
    try {
      const keys = this.cache.getKeys();
      const prefixedKeys = keys.filter(k => k.startsWith(this.prefix));
      if (prefixedKeys.length > 0) {
        this.cache.removeAll(prefixedKeys);
      }
      CONFIG.CACHE.stats = { hits: 0, misses: 0, size: 0 };
      return true;
    } catch (error) {
      Logger.error('CACHE_CLEAR', 'Failed to clear cache', error);
      return false;
    }
  }
};

/**
 * Rate limiter implementation
 */
const RateLimiter = {
  requests: new Map(),
  
  /**
   * Check if request is allowed
   */
  checkLimit: function(key) {
    const now = Date.now();
    const windowStart = now - CONFIG.RATE_LIMIT.WINDOW_MS;
    
    // Clean old requests
    this.requests.forEach((timestamp, reqKey) => {
      if (timestamp < windowStart) this.requests.delete(reqKey);
    });
    
    // Get requests in current window
    const requestCount = Array.from(this.requests.values())
      .filter(timestamp => timestamp > windowStart)
      .length;
    
    if (requestCount >= CONFIG.RATE_LIMIT.MAX_REQUESTS) {
      return false;
    }
    
    this.requests.set(key, now);
    return true;
  },

  /**
   * Wait for next available slot
   */
  waitForSlot: function(key) {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!this.checkLimit(key) && attempts < maxAttempts) {
      Utilities.sleep(CONFIG.RATE_LIMIT.DELAY_MS);
      attempts++;
    }
    
    return attempts < maxAttempts;
  }
};

/**
 * Get API configuration for a specific key
 * @param {string} key - Configuration key
 * @param {any} defaultValue - Default value if key not found
 * @returns {any} Configuration value
 */
function getApiConfig(key, defaultValue) {
  // Handle nested paths
  if (key.includes('.')) {
    const value = CONFIG.getNestedValue(CONFIG.API, key);
    return value !== null ? value : defaultValue;
  }
  
  // Handle API key lookups first
  if (key === 'AZURE_BING_KEY') return CONFIG.API.AZURE.BING.KEY;
  if (key === 'AZURE_OPENAI_KEY') return CONFIG.API.AZURE.OPENAI.KEY;
  if (key === 'AZURE_OPENAI_ENDPOINT') return CONFIG.API.AZURE.OPENAI.ENDPOINT;
  if (key === 'AZURE_OPENAI_DEPLOYMENT') return CONFIG.API.AZURE.OPENAI.DEPLOYMENT;
  if (key === 'KNOWLEDGE_GRAPH_KEY') return CONFIG.API.KNOWLEDGE_GRAPH.KEY;
  
  // Handle processing configuration
  if (key === 'MAX_RETRIES') return CONFIG.PROCESSING.MAX_RETRIES;
  if (key === 'RETRY_DELAY') return CONFIG.PROCESSING.RETRY_DELAY;
  if (key === 'BATCH_SIZE') return CONFIG.PROCESSING.BATCH_SIZE;
  if (key === 'TIMEOUT') return CONFIG.PROCESSING.TIMEOUT;
  
  // Handle cache configuration
  if (key === 'CACHE_DURATION') return CONFIG.CACHE.DURATION;
  
  // If key not found, return default value
  return defaultValue;
}

/**
 * Set API configuration for a specific key
 * @param {string} key - Configuration key
 * @param {any} value - Configuration value
 * @returns {boolean} Success status
 */
function setApiConfig(key, value) {
  try {
    // Handle nested paths
    if (key.includes('.')) {
      CONFIG.setNestedValue(CONFIG.API, key, value);
      return true;
    }
    
    // Handle API key updates
    if (key === 'AZURE_BING_KEY') CONFIG.API.AZURE.BING.KEY = value;
    else if (key === 'AZURE_OPENAI_KEY') CONFIG.API.AZURE.OPENAI.KEY = value;
    else if (key === 'AZURE_OPENAI_ENDPOINT') CONFIG.API.AZURE.OPENAI.ENDPOINT = value;
    else if (key === 'AZURE_OPENAI_DEPLOYMENT') CONFIG.API.AZURE.OPENAI.DEPLOYMENT = value;
    else if (key === 'KNOWLEDGE_GRAPH_KEY') CONFIG.API.KNOWLEDGE_GRAPH.KEY = value;
    
    // Handle processing configuration
    else if (key === 'MAX_RETRIES') CONFIG.PROCESSING.MAX_RETRIES = value;
    else if (key === 'RETRY_DELAY') CONFIG.PROCESSING.RETRY_DELAY = value;
    else if (key === 'BATCH_SIZE') CONFIG.PROCESSING.BATCH_SIZE = value;
    else if (key === 'TIMEOUT') CONFIG.PROCESSING.TIMEOUT = value;
    
    // Handle cache configuration
    else if (key === 'CACHE_DURATION') CONFIG.CACHE.DURATION = value;
    
    // Save changes
    if (key.includes('KEY') || key === 'AZURE_OPENAI_ENDPOINT' || key === 'AZURE_OPENAI_DEPLOYMENT') {
      CONFIG.saveApiKeys();
    } else {
      CONFIG.saveSettings();
    }
    
    return true;
  } catch (error) {
    Logger.error('CONFIG_SET', `Failed to set configuration value for ${key}`, error);
    return false;
  }
}

// Export configurations and utilities
this.CONFIG = CONFIG;
this.CacheManager = CacheManager;
this.RateLimiter = RateLimiter;
this.getApiConfig = getApiConfig;
this.setApiConfig = setApiConfig;