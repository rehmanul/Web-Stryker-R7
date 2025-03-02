/**
 * AI Product Extractor - Test Suite
 * Version: 3.1.0
 * 
 * Tests the functionality of the extraction system
 */

function testExtraction() {
  // Test URLs
  const testUrls = [
    'https://www.moilas.com/',
    'https://www.linkosuo.fi/',
    'https://www.goldandgreenfoods.com/',
    'https://www.atriafromfinland.com/',
    'https://www.evoke.fi/'
  ];
  
  try {
    // Initialize systems
    Logger.info('TEST', 'Starting system initialization');
    
    CONFIG.initialize();
    Storage.initialize();
    Control.initialize();
    
    // Add URLs to processing queue
    Control.addToQueue(testUrls);
    
    // Start processing
    Control.startProcessing();
    
    // Monitor progress
    let status;
    do {
      status = Control.getStatus();
      Logger.info('TEST', `Processing status: ${JSON.stringify(status)}`);
      Utilities.sleep(5000); // Check every 5 seconds
    } while (status.state === Control.ProcessState.RUNNING);
    
    // Export results
    const exportResult = Storage.exportToCsv('completed');
    Logger.info('TEST', `Export completed: ${exportResult.fileName}`);
    
    // Create backup
    const backupResult = Storage.createBackup();
    Logger.info('TEST', `Backup created: ${backupResult.fileName}`);
    
    return {
      success: true,
      processed: status.processed,
      successful: status.successful,
      failed: status.failed,
      exportUrl: exportResult.url,
      backupUrl: backupResult.url
    };
    
  } catch (error) {
    Logger.error('TEST', 'Test execution failed', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test individual components
 */
function testComponents() {
  const results = {
    config: false,
    storage: false,
    processor: false,
    control: false
  };
  
  try {
    // Test CONFIG
    results.config = CONFIG.initialize();
    Logger.info('TEST', 'CONFIG initialization: ' + (results.config ? 'SUCCESS' : 'FAILED'));
    
    // Test Storage
    results.storage = Storage.initialize();
    Logger.info('TEST', 'Storage initialization: ' + (results.storage ? 'SUCCESS' : 'FAILED'));
    
    // Test ExtractProcessor with a single URL
    const testUrl = 'https://www.moilas.com/';
    const extractResult = ExtractProcessor.processUrl(testUrl);
    results.processor = !!extractResult;
    Logger.info('TEST', 'ExtractProcessor test: ' + (results.processor ? 'SUCCESS' : 'FAILED'));
    
    // Test Control system
    Control.initialize();
    Control.addToQueue([testUrl]);
    results.control = Control.getStatus().queueLength === 1;
    Logger.info('TEST', 'Control system test: ' + (results.control ? 'SUCCESS' : 'FAILED'));
    
    return {
      success: Object.values(results).every(r => r),
      componentResults: results
    };
    
  } catch (error) {
    Logger.error('TEST', 'Component testing failed', error);
    return {
      success: false,
      error: error.message,
      componentResults: results
    };
  }
}

/**
 * Test API configurations
 */
function testApiConfigurations() {
  try {
    const apis = {
      'AZURE_OPENAI_KEY': getApiConfig('AZURE_OPENAI_KEY'),
      'AZURE_BING_KEY': getApiConfig('AZURE_BING_KEY'),
      'AZURE_OPENAI_ENDPOINT': getApiConfig('AZURE_OPENAI_ENDPOINT')
    };
    
    const results = {};
    
    for (const [name, key] of Object.entries(apis)) {
      if (!key) {
        results[name] = {
          configured: false,
          message: 'API key not configured'
        };
        continue;
      }
      
      // Test API key
      const testResult = ApiKeys.testKey(name, key);
      results[name] = {
        configured: true,
        valid: testResult.success,
        message: testResult.message
      };
    }
    
    return {
      success: Object.values(results).every(r => r.configured && r.valid),
      apiResults: results
    };
    
  } catch (error) {
    Logger.error('TEST', 'API configuration testing failed', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  const results = {
    components: testComponents(),
    apis: testApiConfigurations(),
    extraction: testExtraction()
  };
  
  Logger.info('TEST', 'All tests completed', results);
  return results;
}
