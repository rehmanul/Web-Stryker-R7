/**
 * AI Product Extractor - Extraction Processor
 * Version: 3.1.0
 * 
 * Handles website content extraction and processing
 */

const ExtractProcessor = {
  // Processing states
  ProcessState: {
    IDLE: 'IDLE',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    ERROR: 'ERROR'
  },

  // Current state
  currentState: 'IDLE',
  
  /**
   * Process a single URL
   * @param {string} url - URL to process
   * @returns {Object} Extraction results
   */
  processUrl: async function(url) {
    try {
      Logger.info('EXTRACT', `Starting extraction for ${url}`);
      
      // Check cache first
      const cached = CacheManager.get(url);
      if (cached) {
        Logger.info('EXTRACT', `Cache hit for ${url}`);
        return JSON.parse(cached);
      }
      
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }
      
      // Get webpage content
      const content = await this.fetchWebpage(url);
      
      // Extract basic metadata
      const metadata = this.extractMetadata(content);
      
      // Extract product information
      const productInfo = await this.extractProductInfo(content, url);
      
      // Enhance with AI analysis
      const enhancedData = await this.enhanceWithAI(productInfo);
      
      // Validate extracted data
      this.validateData(enhancedData);
      
      // Cache results
      CacheManager.set(url, JSON.stringify(enhancedData));
      
      Logger.info('EXTRACT', `Extraction completed for ${url}`);
      return enhancedData;
      
    } catch (error) {
      Logger.error('EXTRACT', `Extraction failed for ${url}`, error);
      throw error;
    }
  },
  
  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Validation result
   */
  isValidUrl: function(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Fetch webpage content with retry logic
   * @param {string} url - URL to fetch
   * @returns {string} Webpage content
   */
  fetchWebpage: async function(url) {
    const maxRetries = CONFIG.PROCESSING.MAX_RETRIES;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Check rate limiting
        if (!RateLimiter.checkLimit(url)) {
          await Utilities.sleep(CONFIG.RATE_LIMIT.DELAY_MS);
          continue;
        }
        
        // Fetch content
        const response = UrlFetchApp.fetch(url, {
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true
        });
        
        const code = response.getResponseCode();
        if (code === 200) {
          return response.getContentText();
        }
        
        // Handle specific status codes
        if (code === 429) { // Too Many Requests
          await Utilities.sleep(CONFIG.PROCESSING.RETRY_DELAY * (retries + 1));
          retries++;
          continue;
        }
        
        throw new Error(`HTTP ${code}`);
        
      } catch (error) {
        Logger.warn('FETCH', `Attempt ${retries + 1} failed for ${url}`, error);
        
        if (retries >= maxRetries - 1) {
          throw new Error(`Failed to fetch after ${maxRetries} attempts: ${error.message}`);
        }
        
        await Utilities.sleep(CONFIG.PROCESSING.RETRY_DELAY * (retries + 1));
        retries++;
      }
    }
  },
  
  /**
   * Extract basic metadata from webpage
   * @param {string} content - Webpage content
   * @returns {Object} Extracted metadata
   */
  extractMetadata: function(content) {
    const metadata = {
      title: '',
      description: '',
      keywords: [],
      language: '',
      lastModified: ''
    };
    
    try {
      // Extract title
      const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }
      
      // Extract meta description
      const descMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
      if (descMatch) {
        metadata.description = descMatch[1].trim();
      }
      
      // Extract keywords
      const keywordsMatch = content.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"[^>]*>/i);
      if (keywordsMatch) {
        metadata.keywords = keywordsMatch[1].split(',').map(k => k.trim());
      }
      
      // Extract language
      const langMatch = content.match(/<html[^>]*lang="([^"]*)"[^>]*>/i);
      if (langMatch) {
        metadata.language = langMatch[1];
      }
      
      // Extract last modified
      const modifiedMatch = content.match(/<meta[^>]*name="last-modified"[^>]*content="([^"]*)"[^>]*>/i);
      if (modifiedMatch) {
        metadata.lastModified = modifiedMatch[1];
      }
      
    } catch (error) {
      Logger.warn('METADATA', 'Error extracting metadata', error);
    }
    
    return metadata;
  },
  
  /**
   * Extract product information from webpage
   * @param {string} content - Webpage content
   * @param {string} url - Source URL
   * @returns {Object} Extracted product information
   */
  extractProductInfo: async function(content, url) {
    const productInfo = {
      url: url,
      name: '',
      description: '',
      price: '',
      currency: '',
      images: [],
      category: '',
      brand: '',
      specifications: {},
      variants: []
    };
    
    try {
      // Extract structured data (JSON-LD)
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
      if (jsonLdMatch) {
        for (const match of jsonLdMatch) {
          try {
            const data = JSON.parse(match.replace(/<script type="application\/ld\+json">|<\/script>/g, ''));
            if (data['@type'] === 'Product') {
              productInfo.name = data.name || productInfo.name;
              productInfo.description = data.description || productInfo.description;
              productInfo.brand = (data.brand && data.brand.name) || productInfo.brand;
              
              if (data.offers) {
                productInfo.price = data.offers.price || productInfo.price;
                productInfo.currency = data.offers.priceCurrency || productInfo.currency;
              }
              
              if (data.image) {
                productInfo.images = Array.isArray(data.image) ? data.image : [data.image];
              }
            }
          } catch (error) {
            Logger.warn('JSON-LD', 'Error parsing JSON-LD data', error);
          }
        }
      }
      
      // Extract OpenGraph data
      const ogTitle = content.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
      if (ogTitle) {
        productInfo.name = productInfo.name || ogTitle[1];
      }
      
      const ogDescription = content.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
      if (ogDescription) {
        productInfo.description = productInfo.description || ogDescription[1];
      }
      
      const ogImage = content.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
      if (ogImage && !productInfo.images.includes(ogImage[1])) {
        productInfo.images.push(ogImage[1]);
      }
      
    } catch (error) {
      Logger.warn('PRODUCT', 'Error extracting product information', error);
    }
    
    return productInfo;
  },
  
  /**
   * Enhance extracted data with AI analysis
   * @param {Object} data - Extracted data to enhance
   * @returns {Object} Enhanced data
   */
  enhanceWithAI: async function(data) {
    try {
      const openaiEndpoint = getApiConfig('AZURE_OPENAI_ENDPOINT');
      const openaiKey = getApiConfig('AZURE_OPENAI_KEY');
      const deployment = getApiConfig('AZURE_OPENAI_DEPLOYMENT');
      
      if (!openaiEndpoint || !openaiKey || !deployment) {
        throw new Error('Azure OpenAI configuration missing');
      }
      
      // Prepare prompt
      const prompt = {
        messages: [
          {
            role: "system",
            content: "You are a product data analyst. Analyze the following product information and enhance it with additional insights, categorization, and structured data."
          },
          {
            role: "user",
            content: JSON.stringify(data, null, 2)
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
      
      // Parse and merge AI insights
      const aiAnalysis = JSON.parse(result.choices[0].message.content);
      return { ...data, ...aiAnalysis };
      
    } catch (error) {
      Logger.error('AI_ENHANCE', 'Error enhancing data with AI', error);
      return data; // Return original data if enhancement fails
    }
  },
  
  /**
   * Validate extracted data
   * @param {Object} data - Data to validate
   * @throws {Error} Validation error
   */
  validateData: function(data) {
    // Required fields
    const required = ['url', 'name'];
    
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // URL format
    if (!this.isValidUrl(data.url)) {
      throw new Error('Invalid URL format');
    }
    
    // Price format (if present)
    if (data.price && isNaN(parseFloat(data.price))) {
      throw new Error('Invalid price format');
    }
    
    // Image URLs
    if (data.images) {
      if (!Array.isArray(data.images)) {
        throw new Error('Images must be an array');
      }
      
      for (const imageUrl of data.images) {
        if (!this.isValidUrl(imageUrl)) {
          throw new Error(`Invalid image URL: ${imageUrl}`);
        }
      }
    }
  },
  
  /**
   * Process multiple URLs in batches
   * @param {string[]} urls - URLs to process
   * @returns {Object[]} Processing results
   */
  processBatch: async function(urls) {
    const batchSize = CONFIG.PROCESSING.BATCH_SIZE;
    const results = [];
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.processUrl(url));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        Logger.error('BATCH', `Error processing batch ${i / batchSize + 1}`, error);
      }
      
      // Delay between batches
      if (i + batchSize < urls.length) {
        await Utilities.sleep(CONFIG.RATE_LIMIT.DELAY_MS);
      }
    }
    
    return results;
  }
};

// Export the ExtractProcessor
this.ExtractProcessor = ExtractProcessor;
