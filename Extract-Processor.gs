/**
 * AI Product Extractor - Enhanced Extraction Processor
 * Version: 3.2.0
 * 
 * Handles website content extraction and processing with improved error handling,
 * performance optimizations, and modern features
 */

const ExtractProcessor = {
  // Processing states with descriptive emojis
  ProcessState: {
    IDLE: '⏸️ IDLE',
    RUNNING: '▶️ RUNNING',
    PAUSED: '⏸️ PAUSED',
    COMPLETED: '✅ COMPLETED',
    ERROR: '❌ ERROR',
    RATE_LIMITED: '⏳ RATE_LIMITED'
  },

  // Current state
  currentState: 'IDLE',
  
  // Performance metrics
  metrics: {
    totalProcessed: 0,
    successfulExtractions: 0,
    failedExtractions: 0,
    averageProcessingTime: 0,
    startTime: null,
    lastProcessedTime: null
  },

  /**
   * Initialize the processor with enhanced monitoring
   */
  initialize: function() {
    this.metrics.startTime = Date.now();
    this.currentState = this.ProcessState.IDLE;
    
    // Setup performance monitoring
    if (CONFIG.MONITORING.ENABLED) {
      this.setupMonitoring();
    }
    
    Logger.info('INIT', 'Extract Processor initialized', {
      version: '3.2.0',
      monitoring: CONFIG.MONITORING.ENABLED
    });
  },

  /**
   * Setup performance monitoring
   */
  setupMonitoring: function() {
    this.metrics = {
      ...this.metrics,
      memoryUsage: [],
      processingTimes: [],
      errorRates: [],
      lastMonitoringUpdate: Date.now()
    };
  },

  /**
   * Update processing metrics
   * @param {Object} result - Processing result
   */
  updateMetrics: function(result) {
    const now = Date.now();
    this.metrics.totalProcessed++;
    
    if (result.success) {
      this.metrics.successfulExtractions++;
    } else {
      this.metrics.failedExtractions++;
    }

    // Calculate processing time
    const processingTime = now - this.metrics.lastProcessedTime;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalProcessed - 1) + processingTime) / 
      this.metrics.totalProcessed;

    // Update monitoring metrics if enabled
    if (CONFIG.MONITORING.ENABLED) {
      this.metrics.processingTimes.push(processingTime);
      this.metrics.errorRates.push(this.metrics.failedExtractions / this.metrics.totalProcessed);
      
      // Keep only last hour of detailed metrics
      const oneHourAgo = now - 3600000;
      this.metrics.processingTimes = this.metrics.processingTimes.filter(t => t > oneHourAgo);
      this.metrics.errorRates = this.metrics.errorRates.slice(-60); // Keep last 60 data points
    }

    this.metrics.lastProcessedTime = now;
  },

  [Previous code for processUrl, isValidUrl, cleanUrl, etc. remains unchanged...]

  /**
   * Enhanced error handling wrapper
   * @param {Function} fn - Function to wrap
   * @param {Object} context - Error context
   * @returns {Function} Wrapped function
   */
  withErrorHandling: function(fn, context) {
    return async (...args) => {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        const enhancedError = {
          message: error.message,
          stack: error.stack,
          context: context,
          timestamp: new Date().toISOString(),
          args: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg).substring(0, 100) : String(arg)
          )
        };

        Logger.error(
          context.operation || 'UNKNOWN_OPERATION',
          'Operation failed',
          enhancedError
        );

        throw enhancedError;
      }
    };
  },

  /**
   * Get current processing status
   * @returns {Object} Current status and metrics
   */
  getStatus: function() {
    const now = Date.now();
    return {
      state: this.currentState,
      metrics: {
        ...this.metrics,
        uptime: now - this.metrics.startTime,
        successRate: this.metrics.totalProcessed ? 
          (this.metrics.successfulExtractions / this.metrics.totalProcessed) * 100 : 0,
        averageProcessingTime: this.metrics.averageProcessingTime,
        recentErrorRate: this.getRecentErrorRate()
      }
    };
  },

  /**
   * Calculate recent error rate
   * @returns {number} Error rate as percentage
   */
  getRecentErrorRate: function() {
    if (!this.metrics.errorRates || this.metrics.errorRates.length === 0) {
      return 0;
    }
    
    const recentErrors = this.metrics.errorRates.slice(-10);
    return (recentErrors.reduce((a, b) => a + b, 0) / recentErrors.length) * 100;
  },

  /**
   * Enhanced batch processing with progress reporting
   * @param {string[]} urls - URLs to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  processBatch: async function(urls, options = {}) {
    const startTime = Date.now();
    this.currentState = this.ProcessState.RUNNING;

    const enhancedOptions = {
      ...options,
      onProgress: (progress) => {
        // Calculate ETA
        const elapsed = Date.now() - startTime;
        const rate = progress.processed / (elapsed / 1000); // items per second
        const remaining = (progress.total - progress.processed) / rate;

        const enhancedProgress = {
          ...progress,
          rate: rate.toFixed(2),
          eta: this.formatTime(remaining),
          elapsed: this.formatTime(elapsed / 1000)
        };

        if (options.onProgress) {
          options.onProgress(enhancedProgress);
        }

        Logger.info('BATCH_PROGRESS', 'Processing progress', enhancedProgress);
      }
    };

    try {
      const results = await super.processBatch(urls, enhancedOptions);
      this.currentState = this.ProcessState.COMPLETED;
      return results;
    } catch (error) {
      this.currentState = this.ProcessState.ERROR;
      throw error;
    }
  },

  /**
   * Format time in human readable format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTime: function(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }
};

// Export the enhanced processor
this.ExtractProcessor = ExtractProcessor;
