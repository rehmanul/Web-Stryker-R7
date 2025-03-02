/**
 * AI Product Extractor - Properties Management
 * Version: 3.1.0
 */

/**
 * Get all script properties
 * @returns {Object} Script properties
 */
function getScriptProperties() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const properties = scriptProperties.getProperties();
    
    // Mask sensitive data
    if (properties.AZURE_OPENAI_KEY) {
      properties.AZURE_OPENAI_KEY = maskKey(properties.AZURE_OPENAI_KEY);
    }
    if (properties.AZURE_BING_KEY) {
      properties.AZURE_BING_KEY = maskKey(properties.AZURE_BING_KEY);
    }
    
    return properties;
  } catch (error) {
    Logger.error('PROPERTIES', 'Error getting script properties', error);
    throw error;
  }
}

/**
 * Save script properties
 * @param {Object} properties - Properties to save
 * @returns {Object} Result with success status
 */
function saveScriptProperties(properties) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    
    // Validate required properties
    if (!properties) {
      throw new Error('No properties provided');
    }
    
    // Get current properties to check for masked values
    const currentProps = scriptProperties.getProperties();
    
    // Don't update masked API keys
    if (properties.AZURE_OPENAI_KEY && properties.AZURE_OPENAI_KEY.includes('*')) {
      properties.AZURE_OPENAI_KEY = currentProps.AZURE_OPENAI_KEY;
    }
    if (properties.AZURE_BING_KEY && properties.AZURE_BING_KEY.includes('*')) {
      properties.AZURE_BING_KEY = currentProps.AZURE_BING_KEY;
    }
    
    // Save all properties
    Object.entries(properties).forEach(([key, value]) => {
      if (value) {
        scriptProperties.setProperty(key, value.toString());
      }
    });
    
    // Update last modified timestamp
    scriptProperties.setProperty('LAST_UPDATED', new Date().toISOString());
    
    Logger.info('PROPERTIES', 'Script properties saved successfully');
    
    return {
      success: true,
      message: 'Properties saved successfully'
    };
    
  } catch (error) {
    Logger.error('PROPERTIES', 'Error saving script properties', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Delete script properties
 * @param {string[]} keys - Keys to delete
 * @returns {Object} Result with success status
 */
function deleteScriptProperties(keys) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    
    if (Array.isArray(keys)) {
      keys.forEach(key => scriptProperties.deleteProperty(key));
    }
    
    Logger.info('PROPERTIES', `Deleted properties: ${keys.join(', ')}`);
    
    return {
      success: true,
      message: 'Properties deleted successfully'
    };
    
  } catch (error) {
    Logger.error('PROPERTIES', 'Error deleting script properties', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Mask sensitive key for display
 * @param {string} key - Key to mask
 * @returns {string} Masked key
 */
function maskKey(key) {
  if (!key) return '';
  
  // Show first 4 and last 4 characters, mask the rest
  if (key.length <= 8) {
    return '****' + key.substring(key.length - 4);
  }
  
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
}

/**
 * Initialize default properties if not set
 */
function initializeDefaultProperties() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const currentProps = scriptProperties.getProperties();
    
    // Default values
    const defaults = {
      MAX_RETRIES: '3',
      RETRY_DELAY: '2000',
      CACHE_DURATION: '3600',
      REQUEST_TIMEOUT: '30000',
      BATCH_SIZE: '5',
      AZURE_BING_ENDPOINT: 'https://api.bing.microsoft.com/v7.0/search'
    };
    
    // Set defaults for missing properties
    Object.entries(defaults).forEach(([key, value]) => {
      if (!currentProps[key]) {
        scriptProperties.setProperty(key, value);
      }
    });
    
    Logger.info('PROPERTIES', 'Default properties initialized');
    
    return true;
  } catch (error) {
    Logger.error('PROPERTIES', 'Error initializing default properties', error);
    return false;
  }
}
