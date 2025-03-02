/**
 * AI Product Extractor - API Keys Management
 * Version: 3.1.0
 * 
 * Manages API keys and credentials for external services in a secure way
 */

/**
 * API key management object
 */
const ApiKeys = {
  /**
   * Get an API key by service name
   * 
   * @param {string} service - Service identifier
   * @return {string} API key for the service
   */
  get: function(service) {
    try {
      // Get API keys from document properties
      const scriptProperties = PropertiesService.getScriptProperties();
      const key = scriptProperties.getProperty(`KEY_${service}`);
      
      return key || '';
    } catch (error) {
      Logger.error('API_KEY_GET', `Failed to get API key for ${service}`, error);
      return '';
    }
  },
  
  /**
   * Save or update an API key
   * 
   * @param {string} service - Service identifier
   * @param {string} apiKey - API key to save
   * @return {boolean} Success indicator
   */
  save: function(service, apiKey) {
    try {
      // Validate the API key
      const validationResult = this.validateKeyFormat(service, apiKey);
      if (!validationResult.valid) {
        Logger.warn('API_KEY_SAVE', `Invalid API key format for ${service}: ${validationResult.message}`);
        return {
          success: false,
          message: validationResult.message
        };
      }
      
      // Save to properties
      const scriptProperties = PropertiesService.getScriptProperties();
      scriptProperties.setProperty(`KEY_${service}`, apiKey);
      
      // Update last updated timestamp
      scriptProperties.setProperty(`KEY_${service}_UPDATED`, new Date().toISOString());
      
      Logger.info('API_KEY_SAVE', `Saved API key for ${service}`);
      
      return {
        success: true,
        message: `API key for ${service} saved successfully`
      };
    } catch (error) {
      Logger.error('API_KEY_SAVE', `Failed to save API key for ${service}`, error);
      
      return {
        success: false,
        message: `Failed to save API key: ${error.message}`
      };
    }
  },
  
  /**
   * Validate API key format
   * 
   * @param {string} service - Service identifier
   * @param {string} apiKey - API key to validate
   * @return {Object} Validation result with status and message
   */
  validateKeyFormat: function(service, apiKey) {
    // Skip validation if key is empty (allows clearing keys)
    if (!apiKey) {
      return {
        valid: true,
        message: 'Empty key accepted'
      };
    }
    
    // Ensure minimum length
    if (apiKey.length < CONFIG.SECURITY.MIN_API_KEY_LENGTH) {
      return {
        valid: false,
        message: `API key should be at least ${CONFIG.SECURITY.MIN_API_KEY_LENGTH} characters`
      };
    }
    
    // Service-specific format validation
    switch(service) {
      case 'AZURE_OPENAI_KEY':
        // Azure OpenAI keys are 64 characters
        if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey)) {
          return {
            valid: false,
            message: 'Invalid Azure OpenAI API key format'
          };
        }
        break;
        
      case 'AZURE_BING_KEY':
        // Bing Search API keys are 32 characters
        if (!/^[a-zA-Z0-9]{32}$/.test(apiKey)) {
          return {
            valid: true, // Still accept, just warn
            message: 'Warning: Key format doesn\'t match typical Bing Search API key'
          };
        }
        break;
        
      default:
        // Generic validation - just check for suspicious characters
        if (/[<>"'\\]/.test(apiKey)) {
          return {
            valid: false,
            message: 'API key contains invalid characters'
          };
        }
    }
    
    return {
      valid: true,
      message: 'Valid API key format'
    };
  },
  
  /**
   * Test an API key by making a simple request to the service
   * 
   * @param {string} service - Service identifier
   * @param {string} apiKey - API key to test
   * @return {Object} Test result with status and message
   */
  testKey: function(service, apiKey) {
    try {
      switch(service) {
        case 'AZURE_OPENAI_KEY':
          return this.testAzureOpenAIKey(apiKey);
          
        case 'AZURE_BING_KEY':
          return this.testAzureBingKey(apiKey);
          
        default:
          return {
            success: false,
            message: `Testing not implemented for ${service}`
          };
      }
    } catch (error) {
      Logger.error('API_KEY_TEST', `Error testing API key for ${service}`, error);
      return {
        success: false,
        message: `Test failed: ${error.message}`
      };
    }
  },
  
  /**
   * Test Azure OpenAI API key
   * 
   * @param {string} apiKey - API key to test
   * @return {Object} Test result
   */
  testAzureOpenAIKey: function(apiKey) {
    try {
      const endpoint = getApiConfig('AZURE_OPENAI_ENDPOINT');
      const deployment = getApiConfig('AZURE_OPENAI_DEPLOYMENT');
      
      if (!endpoint || !deployment) {
        return {
          success: false,
          message: 'Missing Azure OpenAI endpoint or deployment'
        };
      }
      
      // Simple completion request to test the key
      const prompt = "Hello, this is a test.";
      
      const payload = {
        "messages": [
          { "role": "user", "content": prompt }
        ],
        "max_tokens": 5
      };
      
      const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-05-15`;
      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
        headers: { "api-key": apiKey }
      };
      
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      
      if (statusCode === 200) {
        return {
          success: true,
          message: 'API key is valid'
        };
      } else {
        const errorContent = JSON.parse(response.getContentText());
        return {
          success: false,
          message: `API returned ${statusCode}: ${errorContent.error?.message || 'Unknown error'}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`
      };
    }
  },
  
  /**
   * Test Azure Bing Search API key
   * 
   * @param {string} apiKey - API key to test
   * @return {Object} Test result
   */
  testAzureBingKey: function(apiKey) {
    try {
      const endpoint = getApiConfig('AZURE_BING_ENDPOINT');
      
      if (!endpoint) {
        return {
          success: false,
          message: 'Missing Azure Bing Search endpoint'
        };
      }
      
      // Simple search request to test the key
      const query = 'test';
      const url = `${endpoint}?q=${encodeURIComponent(query)}&count=1`;
      
      const options = {
        method: "get",
        muteHttpExceptions: true,
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey
        }
      };
      
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      
      if (statusCode === 200) {
        return {
          success: true,
          message: 'API key is valid'
        };
      } else {
        return {
          success: false,
          message: `API returned ${statusCode}: ${response.getContentText()}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`
      };
    }
  },
  
  /**
   * Get status of all API keys
   * 
   * @return {Object} Status of all API keys
   */
  getKeyStatus: function() {
    const requiredKeys = [
      { id: 'AZURE_OPENAI_KEY', name: 'Azure OpenAI API Key' },
      { id: 'AZURE_BING_KEY', name: 'Azure Bing Search API Key' }
    ];
    
    const result = {};
    
    for (const keyInfo of requiredKeys) {
      const key = this.get(keyInfo.id);
      const lastUpdated = PropertiesService.getScriptProperties().getProperty(`KEY_${keyInfo.id}_UPDATED`);
      
      result[keyInfo.id] = {
        name: keyInfo.name,
        exists: !!key,
        lastUpdated: lastUpdated || 'Never',
        masked: key ? this.maskKey(key) : ''
      };
    }
    
    return result;
  },
  
  /**
   * Mask an API key for display
   * 
   * @param {string} key - API key to mask
   * @return {string} Masked key
   */
  maskKey: function(key) {
    if (!key) return '';
    
    // Show first 4 and last 4 characters, mask the rest
    if (key.length <= 8) {
      return '****' + key.substring(key.length - 4);
    } else {
      return key.substring(0, 4) + '****' + key.substring(key.length - 4);
    }
  }
};

// Export the ApiKeys object
this.ApiKeys = ApiKeys;