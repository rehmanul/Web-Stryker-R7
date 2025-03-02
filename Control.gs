/**
 * AI Product Extractor - Control System
 * Version: 3.1.0
 * 
 * Handles process orchestration and system control
 */

const Control = {
  // Process states
  ProcessState: {
    IDLE: 'IDLE',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    ERROR: 'ERROR'
  },
  
  // Current state
  currentState: 'IDLE',
  
  // Processing queue
  queue: [],
  
  // Processing statistics
  stats: {
    processed: 0,
    successful: 0,
    failed: 0,
    startTime: null,
    endTime: null
  },
  
  /**
   * Initialize the control system
   */
  initialize: function() {
    this.currentState = this.ProcessState.IDLE;
    this.queue = [];
    this.resetStats();
    
    Logger.info('CONTROL', 'Control system initialized');
  },
  
  /**
   * Reset processing statistics
   */
  resetStats: function() {
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: null,
      endTime: null
    };
  },
  
  /**
   * Add URLs to processing queue
   * @param {string[]} urls - URLs to process
   */
  addToQueue: function(urls) {
    // Filter out duplicates and invalid URLs
    const validUrls = urls.filter(url => {
      try {
        new URL(url);
        return !this.queue.includes(url);
      } catch {
        Logger.warn('QUEUE', `Invalid URL skipped: ${url}`);
        return false;
      }
    });
    
    this.queue.push(...validUrls);
    Logger.info('QUEUE', `Added ${validUrls.length} URLs to queue`);
  },
  
  /**
   * Start processing queue
   */
  startProcessing: async function() {
    if (this.currentState === this.ProcessState.RUNNING) {
      Logger.warn('CONTROL', 'Processing already running');
      return;
    }
    
    if (this.queue.length === 0) {
      Logger.warn('CONTROL', 'No URLs in queue');
      return;
    }
    
    try {
      this.currentState = this.ProcessState.RUNNING;
      this.stats.startTime = new Date();
      
      Logger.info('CONTROL', 'Starting processing');
      
      while (this.queue.length > 0 && this.currentState === this.ProcessState.RUNNING) {
        const batchSize = Math.min(CONFIG.PROCESSING.BATCH_SIZE, this.queue.length);
        const batch = this.queue.splice(0, batchSize);
        
        try {
          const results = await ExtractProcessor.processBatch(batch);
          
          // Update statistics
          this.stats.processed += results.length;
          this.stats.successful += results.filter(r => r && !r.error).length;
          this.stats.failed += results.filter(r => r && r.error).length;
          
          // Store results
          this.saveResults(results);
          
        } catch (error) {
          Logger.error('CONTROL', 'Batch processing error', error);
          this.stats.failed += batch.length;
        }
        
        // Check if paused
        if (this.currentState === this.ProcessState.PAUSED) {
          Logger.info('CONTROL', 'Processing paused');
          return;
        }
        
        // Rate limiting delay between batches
        await Utilities.sleep(CONFIG.RATE_LIMIT.DELAY_MS);
      }
      
      // Processing completed
      this.currentState = this.ProcessState.COMPLETED;
      this.stats.endTime = new Date();
      
      Logger.info('CONTROL', 'Processing completed', this.stats);
      
    } catch (error) {
      this.currentState = this.ProcessState.ERROR;
      Logger.error('CONTROL', 'Processing error', error);
      throw error;
    }
  },
  
  /**
   * Pause processing
   */
  pauseProcessing: function() {
    if (this.currentState === this.ProcessState.RUNNING) {
      this.currentState = this.ProcessState.PAUSED;
      Logger.info('CONTROL', 'Processing paused');
    }
  },
  
  /**
   * Resume processing
   */
  resumeProcessing: async function() {
    if (this.currentState === this.ProcessState.PAUSED) {
      Logger.info('CONTROL', 'Resuming processing');
      await this.startProcessing();
    }
  },
  
  /**
   * Stop processing
   */
  stopProcessing: function() {
    this.currentState = this.ProcessState.IDLE;
    this.queue = [];
    Logger.info('CONTROL', 'Processing stopped');
  },
  
  /**
   * Save processing results
   * @param {Object[]} results - Processing results to save
   */
  saveResults: function(results) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.DATA);
      if (!sheet) {
        throw new Error('Data sheet not found');
      }
      
      // Prepare data for sheet
      const data = results.map(result => {
        if (!result || result.error) {
          return [
            result?.url || 'Unknown',
            'ERROR',
            new Date().toISOString(),
            result?.error?.message || 'Unknown error',
            ''
          ];
        }
        
        return [
          result.url,
          'COMPLETED',
          new Date().toISOString(),
          '',
          JSON.stringify(result)
        ];
      });
      
      // Append to sheet
      if (data.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, data.length, data[0].length)
          .setValues(data);
      }
      
    } catch (error) {
      Logger.error('SAVE', 'Error saving results', error);
      throw error;
    }
  },
  
  /**
   * Get current processing status
   * @returns {Object} Current status
   */
  getStatus: function() {
    const duration = this.stats.startTime ? 
      (this.stats.endTime || new Date()) - this.stats.startTime : 
      0;
    
    const speed = duration > 0 ? 
      (this.stats.processed / (duration / 1000 / 60)).toFixed(2) : 
      0;
    
    return {
      state: this.currentState,
      queueLength: this.queue.length,
      processed: this.stats.processed,
      successful: this.stats.successful,
      failed: this.stats.failed,
      duration: duration,
      speed: `${speed} items/minute`,
      startTime: this.stats.startTime,
      endTime: this.stats.endTime
    };
  }
};

// Export the Control system
this.Control = Control;
