/**
 * AI Product Extractor - Core Functions
 * Version: 3.1.0
 */

/**
 * Start the extraction process
 * @param {string} url - URL to extract from
 * @returns {Object} Extraction result
 */
function startExtraction(url) {
  try {
    // Initialize systems
    if (!CONFIG.initialize()) {
      throw new Error('Failed to initialize configuration');
    }
    
    // Validate URL
    if (!url || !url.trim()) {
      throw new Error('Please provide a valid URL');
    }
    
    // Extract data
    const data = ExtractProcessor.processUrl(url);
    
    // Get active sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    // Add data to sheet
    sheet.getRange(lastRow + 1, 1).setValue(url);                    // URL
    sheet.getRange(lastRow + 1, 2).setValue(data.name || '');       // Name
    sheet.getRange(lastRow + 1, 3).setValue(data.description || ''); // Description
    sheet.getRange(lastRow + 1, 4).setValue(data.price || '');      // Price
    sheet.getRange(lastRow + 1, 5).setValue(data.currency || '');   // Currency
    sheet.getRange(lastRow + 1, 6).setValue(data.category || '');   // Category
    sheet.getRange(lastRow + 1, 7).setValue(data.subcategory || '');// Subcategory
    sheet.getRange(lastRow + 1, 8).setValue(data.brand || '');      // Brand
    sheet.getRange(lastRow + 1, 9).setValue(JSON.stringify(data.specifications || {})); // Specifications
    sheet.getRange(lastRow + 1, 10).setValue(data.images ? data.images.join(', ') : ''); // Images
    sheet.getRange(lastRow + 1, 11).setValue(new Date().toISOString()); // Timestamp
    sheet.getRange(lastRow + 1, 12).setValue('COMPLETED');          // Status
    
    Logger.info('EXTRACT', `Data extracted successfully from ${url}`);
    
    return {
      success: true,
      message: 'Data extracted successfully',
      data: data
    };
    
  } catch (error) {
    Logger.error('EXTRACT', 'Extraction failed', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Preview extraction for a URL
 * @param {string} url - URL to preview
 * @returns {Object} Preview data
 */
function previewExtraction(url) {
  try {
    // Validate URL
    if (!url || !url.trim()) {
      throw new Error('Please provide a valid URL');
    }
    
    // Get preview data
    const data = ExtractProcessor.processUrl(url);
    
    Logger.info('PREVIEW', `Preview generated for ${url}`);
    
    return {
      success: true,
      data: data
    };
    
  } catch (error) {
    Logger.error('PREVIEW', 'Preview failed', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Process data with AI
 * @param {string} url - URL to process
 * @returns {Object} Processing result
 */
function processWithAI(url) {
  try {
    // Get data from sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find row with URL
    const rowIndex = data.findIndex(row => row[0] === url);
    if (rowIndex === -1) {
      throw new Error('URL not found in sheet');
    }
    
    // Get row data
    const row = data[rowIndex];
    
    // Process with AI
    const result = DataProcessor.processData({
      url: row[0],
      name: row[1],
      description: row[2],
      price: row[3],
      category: row[5]
    });
    
    // Update row with processed data
    const actualRow = rowIndex + 1;
    sheet.getRange(actualRow, 2, 1, 10).setValues([[
      result.name || row[1],
      result.description || row[2],
      result.price || row[3],
      result.currency || row[4],
      result.category || row[5],
      result.subcategory || row[6],
      result.brand || row[7],
      JSON.stringify(result.specifications || {}),
      result.images ? result.images.join(', ') : row[9],
      new Date().toISOString()
    ]]);
    
    Logger.info('PROCESS', `Data processed successfully for ${url}`);
    
    return {
      success: true,
      message: 'Data processed successfully',
      data: result
    };
    
  } catch (error) {
    Logger.error('PROCESS', 'Processing failed', error);
    return {
      success: false,
      message: error.message
    };
  }
}
