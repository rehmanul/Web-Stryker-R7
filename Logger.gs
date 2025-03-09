/**
 * AI Product Extractor - Logging System
 * Version: 3.1.0
 */

const Logger = {
  // Log levels
  LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4
  },
  
  // Current log level
  currentLevel: 1, // Default to INFO
  
  // Log buffer for batch writing
  logBuffer: [],
  
  // Maximum buffer size before auto-flush
  maxBufferSize: 20,
  
  /**
   * Initialize the logger
   * 
   * @param {string} level - Initial log level
   */
  init: function(level) {
    this.setLogLevel(level);
  },
  
  /**
   * Set the current log level
   * 
   * @param {string} level - Log level to set
   */
  setLogLevel: function(level) {
    if (this.LEVELS[level] !== undefined) {
      this.currentLevel = this.LEVELS[level];
    } else {
      console.warn(`Invalid log level: ${level}, defaulting to INFO`);
      this.currentLevel = this.LEVELS.INFO;
    }
  },
  
  /**
   * Log a message at DEBUG level
   * 
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Optional data to include
   */
  debug: function(category, message, data) {
    this.log('DEBUG', category, message, data);
  },
  
  /**
   * Log a message at INFO level
   * 
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Optional data to include
   */
  info: function(category, message, data) {
    this.log('INFO', category, message, data);
  },
  
  /**
   * Log a message at WARN level
   * 
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Optional data to include
   */
  warn: function(category, message, data) {
    this.log('WARN', category, message, data);
  },
  
  /**
   * Log a message at ERROR level
   * 
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Error|String} error - Error object or message
   */
  error: function(category, message, error) {
    const errorDetails = {
      message: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      category: category
    };

    this.log('ERROR', category, message, null, errorDetails);
    
    // Trigger alerts if error rate exceeds threshold
    if (CONFIG.MONITORING.ENABLED) {
      this.checkErrorThreshold();
    }
  },

  // Monitor error rates
  checkErrorThreshold: function() {
    const recentErrors = this.logBuffer.filter(
      log => log.level === 'ERROR' && 
      (new Date() - new Date(log.timestamp)) < 300000 // Last 5 minutes
    ).length;

    if (recentErrors >= 5) {
      this.log('CRITICAL', 'MONITORING', 'High error rate detected', {
        errorCount: recentErrors,
        timeWindow: '5 minutes'
      });
    }
  },
  
  /**
   * Log a message at CRITICAL level
   * 
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Error|String} error - Error object or message
   */
  critical: function(category, message, error) {
    this.log('CRITICAL', category, message, null, error);
  },
  
  /**
   * Internal method to handle logging
   * 
   * @param {string} level - Log level
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {Object} data - Optional data to include
   * @param {Error} error - Optional error object
   */
  log: function(level, category, message, data, error) {
    if (this.LEVELS[level] < this.currentLevel) {
      return; // Skip logging if below current level
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp: timestamp,
      level: level,
      category: category,
      message: message,
      data: data || {},
      error: error ? (error instanceof Error ? error.message : error) : null
    };
    
    // Always log to console
    console.log(`[${timestamp}] [${level}] [${category}] ${message}`, error || data || '');
    
    // Add to buffer for batch processing
    this.logBuffer.push(logEntry);
    
    // Auto-flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  },
  
  /**
   * Flush log buffer to persistent storage
   */
  flushLogs: function() {
    if (this.logBuffer.length === 0) {
      return; // Nothing to flush
    }
    
    try {
      // Get spreadsheet
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const logsSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
      
      if (!logsSheet) {
        console.error('Logs sheet not found');
        return;
      }
      
      // Prepare data for batch insert
      const rows = this.logBuffer.map(entry => [
        entry.timestamp,
        entry.level,
        entry.category,
        entry.message,
        entry.error ? entry.error.toString() : ''
      ]);
      
      // Append rows
      if (rows.length > 0) {
        logsSheet.getRange(logsSheet.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
      }
      
      // Clear buffer after successful write
      this.logBuffer = [];
    } catch (error) {
      console.error('Error flushing logs:', error);
    }
  },
  
  /**
   * Get recent logs
   * 
   * @param {number} maxCount - Maximum number of logs to retrieve
   * @param {string} level - Minimum log level to retrieve
   * @returns {Array} Array of log entries
   */
  getRecentLogs: function(maxCount = 100, level = 'INFO') {
    try {
      const minLevel = this.LEVELS[level] || this.LEVELS.INFO;
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const logsSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
      
      if (!logsSheet) {
        return [];
      }
      
      const lastRow = logsSheet.getLastRow();
      if (lastRow <= 1) {
        return []; // Only header row
      }
      
      // Calculate how many rows to get (limit by maxCount)
      const rowsToGet = Math.min(lastRow - 1, maxCount);
      const startRow = lastRow - rowsToGet + 1;
      
      // Get log data
      const logData = logsSheet.getRange(startRow, 1, rowsToGet, 5).getValues();
      
      // Convert to objects and filter by level
      return logData
        .map(row => ({
          timestamp: row[0],
          level: row[1],
          category: row[2],
          message: row[3],
          error: row[4]
        }))
        .filter(entry => this.LEVELS[entry.level] >= minLevel)
        .reverse(); // Newest first
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  },
  
  /**
   * Clear all logs
   * 
   * @returns {boolean} Success indicator
   */
  clearLogs: function() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const logsSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
      
      if (!logsSheet) {
        return false;
      }
      
      // Clear all data except header
      const lastRow = logsSheet.getLastRow();
      if (lastRow > 1) {
        logsSheet.deleteRows(2, lastRow - 1);
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing logs:', error);
      return false;
    }
  }
};

// Set initial log level from config
if (CONFIG && CONFIG.MONITORING && CONFIG.MONITORING.LOG_LEVEL) {
  Logger.setLogLevel(CONFIG.MONITORING.LOG_LEVEL);
}