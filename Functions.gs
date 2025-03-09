/**
 * AI Product Extractor - Core Functions
 * Version: 3.1.0
 */

/**
 * Start the extraction process
 * @returns {Object} Result with success status
 */
function startExtraction(testUrls = null) {
  try {
    // Initialize systems if needed
    const configResult = CONFIG.initialize();
    if (!configResult.success) {
      throw new Error('Failed to initialize configuration: ' + configResult.error);
    }
    
    let urls = testUrls;
    
    // If no test URLs provided, get from sheet
    if (!urls) {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.DATA);
      if (!sheet) {
        throw new Error('Data sheet not found');
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        throw new Error('No URLs found in sheet');
      }
      
      urls = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
        .map(row => row[0])
        .filter(url => url && url.trim());
    }

    // Validate URLs with proper protocol
    urls = urls.map(url => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
      }
      return url;
    }).filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        Logger.warn('EXTRACT', `Invalid URL format: ${url}`);
        return false;
      }
    });

    if (!urls || urls.length === 0) {
      throw new Error('No valid URLs found for processing');
    }

    // Log URLs to be processed
    Logger.info('EXTRACT', 'Processing URLs:', urls);

    // Initialize Control system
    Control.initialize();
    Control.addToQueue(urls);
    
    // Start processing in background
    startBackgroundProcess('processQueue');
    
    return {
      success: true,
      urlCount: urls.length,
      urls: urls,
      message: `Started extraction for ${urls.length} URLs`
    };
    
  } catch (error) {
    Logger.error('EXTRACT', 'Failed to start extraction', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Start the AI processing
 * @returns {Object} Result with success status
 */
function startProcessing() {
  try {
    // Check if there's data to process
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      throw new Error('No data to process');
    }
    
    // Get data for processing
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    const validRows = data.filter(row => row[1] && row[1].trim()); // Filter rows with URLs
    
    if (validRows.length === 1) {
      throw new Error('No valid data found for processing');
    }
    
    // Start AI processing in background
    startBackgroundProcess('processDataWithAI', [validRows]);
    
    Logger.info('PROCESS', `Started AI processing for ${validRows.length} rows`);
    
    return {
      success: true,
      message: `Started AI processing for ${validRows.length} rows`
    };
    
  } catch (error) {
    Logger.error('PROCESS', 'Failed to start processing', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Process the queue in background
 */
function processQueue() {
  try {
    Logger.info('QUEUE', 'Starting queue processing');
    const status = Control.startProcessing();
    Logger.info('QUEUE', 'Queue processing status:', status);
  } catch (error) {
    Logger.error('QUEUE', 'Queue processing error', error);
    throw error;
  }
}

/**
 * Process data with AI in background
 * @param {Array} data - Data to process
 */
function processDataWithAI(data) {
  try {
    for (const row of data) {
      try {
        // Process each row with AI
        const result = DataProcessor.processData({
          url: row[1],
          content: row[3] || '', // Description column
          name: row[2] || '',    // Name column
          price: row[4] || '',   // Price column
          category: row[6] || '' // Category column
        });
        
        // Update row with processed data
        updateRowWithProcessedData(row[1], result);
        
      } catch (error) {
        Logger.error('AI_PROCESS', `Failed to process row: ${row[1]}`, error);
      }
    }
    
  } catch (error) {
    Logger.error('AI_PROCESS', 'AI processing error', error);
    throw error;
  }
}

/**
 * Update row with processed data
 * @param {string} url - URL to identify the row
 * @param {Object} data - Processed data
 */
function updateRowWithProcessedData(url, data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    // Find row with URL
    const urls = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const rowIndex = urls.findIndex(row => row[1] === url);
    
    if (rowIndex === -1) {
      throw new Error(`Row not found for URL: ${url}`);
    }
    
    // Update row with processed data
    const actualRow = rowIndex + 2; // Add 2 for header row and 0-based index
    
    sheet.getRange(actualRow, 2).setValue(data.name || '');           // Name
    sheet.getRange(actualRow, 3).setValue(data.description || '');    // Description
    sheet.getRange(actualRow, 4).setValue(data.price || '');         // Price
    sheet.getRange(actualRow, 5).setValue(data.currency || '');      // Currency
    sheet.getRange(actualRow, 6).setValue(data.category || '');      // Category
    sheet.getRange(actualRow, 7).setValue(data.subcategory || '');   // Subcategory
    sheet.getRange(actualRow, 8).setValue(data.brand || '');         // Brand
    sheet.getRange(actualRow, 9).setValue(JSON.stringify(data.specifications || {})); // Specifications
    sheet.getRange(actualRow, 10).setValue(data.images ? data.images.join(', ') : ''); // Images
    sheet.getRange(actualRow, 11).setValue(new Date().toISOString()); // Timestamp
    sheet.getRange(actualRow, 12).setValue('COMPLETED');             // Status
    
  } catch (error) {
    Logger.error('UPDATE', `Failed to update row for ${url}`, error);
    throw error;
  }
}

/**
 * Start a background process
 * @param {string} functionName - Function to run
 * @param {Array} args - Function arguments
 */
function startBackgroundProcess(functionName, args = []) {
  try {
    // Create trigger to run function in background
    const trigger = ScriptApp.newTrigger(functionName)
      .timeBased()
      .after(1000) // Run after 1 second
      .create();
    
    // Store trigger ID and arguments
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(`TRIGGER_${trigger.getUniqueId()}`, JSON.stringify({
      function: functionName,
      args: args,
      created: new Date().toISOString()
    }));
    
    Logger.info('BACKGROUND', `Started background process: ${functionName}`);
    
  } catch (error) {
    Logger.error('BACKGROUND', `Failed to start background process: ${functionName}`, error);
    throw error;
  }
}
