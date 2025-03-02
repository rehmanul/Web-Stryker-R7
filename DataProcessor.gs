/**
 * AI Product Extractor - Data Processing System
 * Version: 3.1.0
 * 
 * Handles data processing, validation, and transformation
 */

const DataProcessor = {
  /**
   * Process and validate extracted data
   * @param {Object} data - Raw extracted data
   * @returns {Object} Processed and validated data
   */
  processData: async function(data) {
    try {
      // Validate raw data
      this.validateRawData(data);
      
      // Clean and normalize data
      const cleanedData = this.cleanData(data);
      
      // Classify product
      const classifiedData = await this.classifyProduct(cleanedData);
      
      // Process images
      const processedData = await this.processImages(classifiedData);
      
      // Validate final data
      this.validateProcessedData(processedData);
      
      return processedData;
      
    } catch (error) {
      Logger.error('PROCESS', 'Data processing error', error);
      throw error;
    }
  },
  
  /**
   * Validate raw extracted data
   * @param {Object} data - Raw data to validate
   */
  validateRawData: function(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }
    
    const required = ['url', 'content'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  },
  
  /**
   * Clean and normalize data
   * @param {Object} data - Data to clean
   * @returns {Object} Cleaned data
   */
  cleanData: function(data) {
    const cleaned = { ...data };
    
    // Clean text fields
    const textFields = ['name', 'description', 'brand', 'category'];
    textFields.forEach(field => {
      if (cleaned[field]) {
        cleaned[field] = this.cleanText(cleaned[field]);
      }
    });
    
    // Normalize price
    if (cleaned.price) {
      cleaned.price = this.normalizePrice(cleaned.price);
    }
    
    // Normalize URLs
    if (cleaned.images && Array.isArray(cleaned.images)) {
      cleaned.images = cleaned.images.map(url => this.normalizeUrl(url, cleaned.url));
    }
    
    return cleaned;
  },
  
  /**
   * Clean text content
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanText: function(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\S\r\n]+/g, ' ') // Remove multiple spaces
      .replace(/[\r\n]+/g, '\n') // Normalize line breaks
      .replace(/&nbsp;/g, ' ') // Replace HTML spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/&#39;/g, "'");
  },
  
  /**
   * Normalize price value
   * @param {string|number} price - Price to normalize
   * @returns {number} Normalized price
   */
  normalizePrice: function(price) {
    if (typeof price === 'number') return price;
    
    // Remove currency symbols and normalize decimal separator
    const normalized = price
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    
    const value = parseFloat(normalized);
    if (isNaN(value)) {
      throw new Error(`Invalid price format: ${price}`);
    }
    
    return value;
  },
  
  /**
   * Normalize URL
   * @param {string} url - URL to normalize
   * @param {string} baseUrl - Base URL for relative paths
   * @returns {string} Normalized URL
   */
  normalizeUrl: function(url, baseUrl) {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  },
  
  /**
   * Classify product using AI
   * @param {Object} data - Product data to classify
   * @returns {Object} Classified product data
   */
  classifyProduct: async function(data) {
    try {
      const openaiEndpoint = getApiConfig('AZURE_OPENAI_ENDPOINT');
      const openaiKey = getApiConfig('AZURE_OPENAI_KEY');
      const deployment = getApiConfig('AZURE_OPENAI_DEPLOYMENT');
      
      if (!openaiEndpoint || !openaiKey || !deployment) {
        throw new Error('Azure OpenAI configuration missing');
      }
      
      // Prepare classification prompt
      const prompt = {
        messages: [
          {
            role: "system",
            content: "You are a product classification expert. Analyze the following product information and provide detailed classification including category, subcategory, and attributes."
          },
          {
            role: "user",
            content: JSON.stringify({
              name: data.name,
              description: data.description,
              brand: data.brand,
              specifications: data.specifications
            })
          }
        ],
        max_tokens: CONFIG.API.AZURE.OPENAI.MAX_TOKENS,
        temperature: CONFIG.API.AZURE.OPENAI.TEMPERATURE
      };
      
      // Call Azure OpenAI
      const url = `${openaiEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-05-15`;
      const response = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(prompt),
        headers: {
          "api-key": openaiKey
        },
        muteHttpExceptions: true
      });
      
      const result = JSON.parse(response.getContentText());
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Parse classification
      const classification = JSON.parse(result.choices[0].message.content);
      
      // Merge classification with original data
      return {
        ...data,
        category: classification.category,
        subcategory: classification.subcategory,
        attributes: classification.attributes
      };
      
    } catch (error) {
      Logger.error('CLASSIFY', 'Product classification error', error);
      return data; // Return original data if classification fails
    }
  },
  
  /**
   * Process product images
   * @param {Object} data - Product data with images
   * @returns {Object} Data with processed images
   */
  processImages: async function(data) {
    if (!data.images || !Array.isArray(data.images)) {
      return data;
    }
    
    try {
      const processedImages = [];
      
      for (const imageUrl of data.images) {
        try {
          // Validate image URL
          if (!this.isValidImageUrl(imageUrl)) {
            continue;
          }
          
          // Get image metadata
          const metadata = await this.getImageMetadata(imageUrl);
          
          processedImages.push({
            url: imageUrl,
            ...metadata
          });
          
        } catch (error) {
          Logger.warn('IMAGE', `Error processing image: ${imageUrl}`, error);
        }
      }
      
      return {
        ...data,
        images: processedImages
      };
      
    } catch (error) {
      Logger.error('IMAGES', 'Image processing error', error);
      return data;
    }
  },
  
  /**
   * Validate image URL
   * @param {string} url - Image URL to validate
   * @returns {boolean} Validation result
   */
  isValidImageUrl: function(url) {
    try {
      const parsed = new URL(url);
      const extension = parsed.pathname.split('.').pop().toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      return validExtensions.includes(extension);
    } catch {
      return false;
    }
  },
  
  /**
   * Get image metadata
   * @param {string} url - Image URL
   * @returns {Object} Image metadata
   */
  getImageMetadata: async function(url) {
    try {
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        validateHttpsCertificates: true
      });
      
      const blob = response.getBlob();
      
      return {
        contentType: blob.getContentType(),
        size: blob.getBytes().length,
        width: null, // Could be extracted with additional image processing
        height: null,
        lastModified: response.getHeaders()['Last-Modified']
      };
      
    } catch (error) {
      Logger.warn('IMAGE_META', `Error getting image metadata: ${url}`, error);
      return {
        contentType: null,
        size: null,
        width: null,
        height: null,
        lastModified: null
      };
    }
  },
  
  /**
   * Validate processed data
   * @param {Object} data - Processed data to validate
   */
  validateProcessedData: function(data) {
    // Required fields
    const required = ['url', 'name', 'category'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field in processed data: ${field}`);
      }
    }
    
    // Validate images
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((image, index) => {
        if (!image.url) {
          throw new Error(`Missing URL in image at index ${index}`);
        }
      });
    }
    
    // Validate price if present
    if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
      throw new Error('Invalid price value');
    }
  }
};

// Export the DataProcessor
this.DataProcessor = DataProcessor;
