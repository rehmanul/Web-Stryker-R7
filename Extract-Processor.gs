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
  /**
   * Validate URL format and accessibility
   * @param {string} url - URL to validate
   * @param {boolean} checkAccess - Whether to check URL accessibility
   * @returns {Promise<Object>} Validation result with status and details
   */
  isValidUrl: async function(url, checkAccess = false) {
    const result = {
      isValid: false,
      details: {
        format: false,
        protocol: false,
        accessible: null
      }
    };

    try {
      // Parse URL
      const parsedUrl = new URL(url);
      result.details.format = true;
      
      // Check protocol
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        result.details.protocol = true;
      } else {
        throw new Error(`Invalid protocol: ${parsedUrl.protocol}`);
      }

      // Check accessibility if requested
      if (checkAccess) {
        try {
          const response = await UrlFetchApp.fetch(url, {
            muteHttpExceptions: true,
            followRedirects: true,
            validateHttpsCertificates: true
          });
          
          const code = response.getResponseCode();
          result.details.accessible = code >= 200 && code < 400;
          result.details.statusCode = code;
        } catch (error) {
          result.details.accessible = false;
          result.details.error = error.message;
        }
      }

      // URL is valid if format and protocol are correct
      result.isValid = result.details.format && result.details.protocol;
      
      if (!result.isValid) {
        Logger.warn('URL_VALIDATION', `Invalid URL format: ${url}`, result.details);
      }

      return result;

    } catch (error) {
      Logger.error('URL_VALIDATION', `URL validation error: ${url}`, {
        error: error.message,
        details: result.details
      });
      
      return {
        isValid: false,
        details: {
          ...result.details,
          error: error.message
        }
      };
    }
  },

  /**
   * Clean and normalize URL
   * @param {string} url - URL to clean
   * @returns {string} Cleaned URL
   */
  cleanUrl: function(url) {
    try {
      const parsed = new URL(url);
      
      // Remove tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
      trackingParams.forEach(param => parsed.searchParams.delete(param));
      
      // Ensure protocol is https where possible
      if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) {
        parsed.protocol = 'https:';
      }
      
      // Remove default ports
      if ((parsed.protocol === 'http:' && parsed.port === '80') ||
          (parsed.protocol === 'https:' && parsed.port === '443')) {
        parsed.port = '';
      }
      
      // Remove trailing slashes
      return parsed.toString().replace(/\/$/, '');
      
    } catch (error) {
      Logger.warn('URL_CLEAN', `Failed to clean URL: ${url}`, error);
      return url;
    }
  },
  
  /**
   * Fetch webpage content with exponential backoff retry logic
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} Webpage content
   * @throws {Error} If fetch fails after max retries
   */
  fetchWebpage: async function(url) {
    const maxRetries = CONFIG.PROCESSING.MAX_RETRIES;
    let retries = 0;
    
    const fetchWithTimeout = (url, options) => {
      const timeout = CONFIG.PROCESSING.TIMEOUT;
      return Promise.race([
        UrlFetchApp.fetch(url, options),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
    };

    while (retries < maxRetries) {
      try {
        // Check rate limiting
        if (!RateLimiter.checkLimit(url)) {
          const delay = CONFIG.RATE_LIMIT.DELAY_MS * Math.pow(2, retries);
          Logger.info('FETCH', `Rate limit hit, waiting ${delay}ms before retry`);
          await Utilities.sleep(delay);
          continue;
        }
        
        // Fetch content with timeout
        const response = await fetchWithTimeout(url, {
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AIExtractor/1.0;)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        
        const code = response.getResponseCode();
        
        // Log response metadata
        Logger.info('FETCH', `Response received for ${url}`, {
          statusCode: code,
          contentType: response.getHeaders()['Content-Type'],
          attempt: retries + 1
        });

        if (code === 200) {
          const content = response.getContentText();
          if (!content || content.trim().length === 0) {
            throw new Error('Empty response received');
          }
          return content;
        }
        
        // Handle specific status codes
        switch (code) {
          case 429: // Too Many Requests
            const delay = CONFIG.PROCESSING.RETRY_DELAY * Math.pow(2, retries);
            Logger.warn('FETCH', `Rate limited (429) for ${url}, waiting ${delay}ms`);
            await Utilities.sleep(delay);
            retries++;
            break;
            
          case 403: // Forbidden
            throw new Error('Access forbidden - check authentication');
            
          case 404: // Not Found
            throw new Error('Page not found');
            
          case 500: // Server Error
          case 502: // Bad Gateway
          case 503: // Service Unavailable
          case 504: // Gateway Timeout
            const backoffDelay = CONFIG.PROCESSING.RETRY_DELAY * Math.pow(2, retries);
            Logger.warn('FETCH', `Server error ${code} for ${url}, retrying in ${backoffDelay}ms`);
            await Utilities.sleep(backoffDelay);
            retries++;
            break;
            
          default:
            throw new Error(`Unexpected HTTP status: ${code}`);
        }
        
      } catch (error) {
        const isLastAttempt = retries >= maxRetries - 1;
        const logLevel = isLastAttempt ? 'error' : 'warn';
        
        Logger[logLevel]('FETCH', `Attempt ${retries + 1} failed for ${url}`, {
          error: error.message,
          stack: error.stack,
          attempt: retries + 1,
          maxRetries: maxRetries
        });
        
        if (isLastAttempt) {
          throw new Error(`Failed to fetch after ${maxRetries} attempts: ${error.message}`);
        }
        
        const backoffDelay = CONFIG.PROCESSING.RETRY_DELAY * Math.pow(2, retries);
        await Utilities.sleep(backoffDelay);
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
  /**
   * Extract product information from webpage content
   * @param {string} content - Webpage content
   * @param {string} url - Source URL
   * @returns {Promise<Object>} Extracted product information
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
      variants: [],
      extractionTimestamp: new Date().toISOString(),
      metadata: {
        source: 'webpage',
        confidence: 0,
        extractionMethods: []
      }
    };
    
    try {
      // Extract structured data (JSON-LD)
      const jsonLdData = await this.extractJsonLd(content);
      if (jsonLdData) {
        Object.assign(productInfo, jsonLdData);
        productInfo.metadata.extractionMethods.push('json-ld');
        productInfo.metadata.confidence = Math.max(productInfo.metadata.confidence, 0.9);
      }
      
      // Extract OpenGraph data
      const ogData = this.extractOpenGraph(content);
      if (ogData) {
        // Only use OG data if JSON-LD didn't provide the information
        productInfo.name = productInfo.name || ogData.name;
        productInfo.description = productInfo.description || ogData.description;
        if (ogData.image && !productInfo.images.includes(ogData.image)) {
          productInfo.images.push(ogData.image);
        }
        productInfo.metadata.extractionMethods.push('open-graph');
        productInfo.metadata.confidence = Math.max(productInfo.metadata.confidence, 0.7);
      }
      
      // Extract Schema.org microdata
      const microdata = this.extractMicrodata(content);
      if (microdata) {
        Object.assign(productInfo, microdata);
        productInfo.metadata.extractionMethods.push('microdata');
        productInfo.metadata.confidence = Math.max(productInfo.metadata.confidence, 0.8);
      }
      
      // Validate and clean extracted data
      this.validateProductInfo(productInfo);
      
      // Normalize URLs
      productInfo.images = productInfo.images.map(img => this.normalizeUrl(img, url));
      
      Logger.info('PRODUCT', 'Successfully extracted product information', {
        url: url,
        methods: productInfo.metadata.extractionMethods,
        confidence: productInfo.metadata.confidence
      });
      
    } catch (error) {
      Logger.error('PRODUCT', 'Error extracting product information', {
        url: url,
        error: error.message,
        stack: error.stack
      });
      
      productInfo.metadata.error = error.message;
      productInfo.metadata.confidence = 0;
    }
    
    return productInfo;
  },

  /**
   * Extract JSON-LD data from webpage content
   * @param {string} content - Webpage content
   * @returns {Promise<Object>} Extracted JSON-LD data
   */
  extractJsonLd: async function(content) {
    try {
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
      if (!jsonLdMatch) return null;

      const productData = {};
      
      for (const match of jsonLdMatch) {
        try {
          const data = JSON.parse(match.replace(/<script type="application\/ld\+json">|<\/script>/g, ''));
          
          if (data['@type'] === 'Product') {
            productData.name = data.name || productData.name;
            productData.description = data.description || productData.description;
            productData.brand = (data.brand && data.brand.name) || productData.brand;
            
            if (data.offers) {
              if (Array.isArray(data.offers)) {
                const mainOffer = data.offers[0];
                productData.price = mainOffer.price || productData.price;
                productData.currency = mainOffer.priceCurrency || productData.currency;
                productData.variants = data.offers.map(offer => ({
                  price: offer.price,
                  currency: offer.priceCurrency,
                  availability: offer.availability
                }));
              } else {
                productData.price = data.offers.price || productData.price;
                productData.currency = data.offers.priceCurrency || productData.currency;
              }
            }
            
            if (data.image) {
              productData.images = Array.isArray(data.image) ? data.image : [data.image];
            }
            
            if (data.category) {
              productData.category = data.category;
            }
            
            if (data.additionalProperty) {
              productData.specifications = data.additionalProperty.reduce((specs, prop) => {
                specs[prop.name] = prop.value;
                return specs;
              }, {});
            }
          }
        } catch (error) {
          Logger.warn('JSON-LD', 'Error parsing JSON-LD data block', {
            error: error.message,
            data: match.substring(0, 200) + '...' // Log first 200 chars of problematic data
          });
        }
      }
      
      return Object.keys(productData).length > 0 ? productData : null;
      
    } catch (error) {
      Logger.error('JSON-LD', 'Error extracting JSON-LD data', error);
      return null;
    }
  },

  /**
   * Extract OpenGraph data from webpage content
   * @param {string} content - Webpage content
   * @returns {Object} Extracted OpenGraph data
   */
  extractOpenGraph: function(content) {
    const ogData = {};
    
    try {
      const ogTags = {
        title: /<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i,
        description: /<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i,
        image: /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i,
        price: /<meta[^>]*property="product:price:amount"[^>]*content="([^"]*)"[^>]*>/i,
        currency: /<meta[^>]*property="product:price:currency"[^>]*content="([^"]*)"[^>]*>/i
      };
      
      for (const [key, regex] of Object.entries(ogTags)) {
        const match = content.match(regex);
        if (match) {
          ogData[key] = match[1].trim();
        }
      }
      
      return Object.keys(ogData).length > 0 ? ogData : null;
      
    } catch (error) {
      Logger.warn('OPENGRAPH', 'Error extracting OpenGraph data', error);
      return null;
    }
  },

  /**
   * Extract Schema.org microdata from webpage content
   * @param {string} content - Webpage content
   * @returns {Object} Extracted microdata
   */
  extractMicrodata: function(content) {
    // Implementation for microdata extraction
    // This is a placeholder - implement based on your needs
    return null;
  },

  /**
   * Validate extracted product information
   * @param {Object} productInfo - Product information to validate
   * @throws {Error} If validation fails
   */
  validateProductInfo: function(productInfo) {
    // Required fields
    const required = ['name', 'url'];
    const missing = required.filter(field => !productInfo[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Price format
    if (productInfo.price && isNaN(parseFloat(productInfo.price))) {
      throw new Error('Invalid price format');
    }
    
    // URLs
    if (productInfo.images) {
      if (!Array.isArray(productInfo.images)) {
        throw new Error('Images must be an array');
      }
      
      productInfo.images = productInfo.images.filter(url => {
        try {
          new URL(url);
          return true;
        } catch {
          Logger.warn('VALIDATE', `Invalid image URL removed: ${url}`);
          return false;
        }
      });
    }
    
    // Clean text fields
    ['name', 'description', 'brand', 'category'].forEach(field => {
      if (productInfo[field]) {
        productInfo[field] = this.cleanText(productInfo[field]);
      }
    });
  },

  /**
   * Clean and normalize text content
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanText: function(text) {
    return text
      .replace(/[\s\n\r]+/g, ' ') // Normalize whitespace
      .replace(/[^\S\r\n]+/g, ' ') // Convert multiple spaces to single space
      .trim();
  },

  /**
   * Normalize URL relative to base URL
   * @param {string} url - URL to normalize
   * @param {string} baseUrl - Base URL for relative URLs
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
   * Enhance extracted data with AI analysis
   * @param {Object} data - Extracted data to enhance
   * @returns {Object} Enhanced data
   */
  /**
   * Enhance extracted data with AI analysis
   * @param {Object} data - Extracted product data to enhance
   * @returns {Promise<Object>} Enhanced data with AI insights
   */
  enhanceWithAI: async function(data) {
    const maxRetries = CONFIG.PROCESSING.MAX_RETRIES;
    let retries = 0;

    const systemPrompt = `You are a product data analyst specializing in e-commerce data enhancement. 
Your task is to analyze product information and enhance it with:
1. Detailed categorization and taxonomy
2. Feature extraction and standardization
3. Market positioning insights
4. SEO-optimized descriptions
5. Competitive analysis indicators
6. Quality and completeness metrics

Format your response as a JSON object that can be merged with the existing data.`;

    while (retries < maxRetries) {
      try {
        const openaiEndpoint = getApiConfig('AZURE_OPENAI_ENDPOINT');
        const openaiKey = getApiConfig('AZURE_OPENAI_KEY');
        const deployment = getApiConfig('AZURE_OPENAI_DEPLOYMENT');
        
        if (!openaiEndpoint || !openaiKey || !deployment) {
          throw new Error('Azure OpenAI configuration missing');
        }

        // Prepare data for AI analysis
        const cleanedData = this.prepareDataForAI(data);
        
        // Construct prompt with specific focus areas
        const prompt = {
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: JSON.stringify({
                product_data: cleanedData,
                required_enhancements: [
                  "category_hierarchy",
                  "feature_analysis",
                  "market_position",
                  "seo_optimization",
                  "quality_metrics"
                ]
              }, null, 2)
            }
          ],
          max_tokens: CONFIG.API.AZURE.OPENAI.MAX_TOKENS,
          temperature: CONFIG.API.AZURE.OPENAI.TEMPERATURE,
          top_p: 0.9,
          frequency_penalty: 0.2,
          presence_penalty: 0.2
        };
        
        // Call Azure OpenAI with timeout
        const url = `${openaiEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-05-15`;
        const response = await Promise.race([
          UrlFetchApp.fetch(url, {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(prompt),
            headers: {
              "api-key": openaiKey,
              "Content-Type": "application/json"
            },
            muteHttpExceptions: true
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI request timeout')), CONFIG.PROCESSING.TIMEOUT)
          )
        ]);

        const result = JSON.parse(response.getContentText());
        
        if (result.error) {
          throw new Error(`AI API Error: ${result.error.message}`);
        }

        // Validate and parse AI response
        const aiAnalysis = this.validateAIResponse(result.choices[0].message.content);
        
        // Merge AI insights with original data
        const enhancedData = this.mergeAIInsights(data, aiAnalysis);
        
        Logger.info('AI_ENHANCE', 'Successfully enhanced product data', {
          url: data.url,
          enhancements: Object.keys(aiAnalysis),
          confidence: enhancedData.metadata.ai_confidence
        });

        return enhancedData;

      } catch (error) {
        const isLastAttempt = retries >= maxRetries - 1;
        const logLevel = isLastAttempt ? 'error' : 'warn';
        
        Logger[logLevel]('AI_ENHANCE', `Attempt ${retries + 1} failed`, {
          error: error.message,
          stack: error.stack,
          attempt: retries + 1,
          maxRetries: maxRetries
        });

        if (isLastAttempt) {
          // On final failure, return original data with error metadata
          return {
            ...data,
            metadata: {
              ...data.metadata,
              ai_enhancement_error: error.message,
              ai_enhancement_attempted: true,
              ai_enhancement_success: false
            }
          };
        }

        // Exponential backoff
        const backoffDelay = CONFIG.PROCESSING.RETRY_DELAY * Math.pow(2, retries);
        await Utilities.sleep(backoffDelay);
        retries++;
      }
    }
  },

  /**
   * Prepare data for AI analysis by cleaning and structuring
   * @param {Object} data - Raw product data
   * @returns {Object} Cleaned and structured data
   */
  prepareDataForAI: function(data) {
    // Deep clone to avoid modifying original
    const cleaned = JSON.parse(JSON.stringify(data));
    
    // Remove sensitive or unnecessary fields
    delete cleaned.metadata;
    delete cleaned.extractionTimestamp;
    
    // Ensure text fields are clean
    ['name', 'description', 'brand', 'category'].forEach(field => {
      if (cleaned[field]) {
        cleaned[field] = this.cleanText(cleaned[field]);
      }
    });
    
    return cleaned;
  },

  /**
   * Validate and parse AI response
   * @param {string} response - AI response content
   * @returns {Object} Validated and parsed AI analysis
   * @throws {Error} If response is invalid
   */
  validateAIResponse: function(response) {
    try {
      const parsed = JSON.parse(response);
      
      // Required fields in AI analysis
      const required = ['category_hierarchy', 'feature_analysis', 'quality_metrics'];
      const missing = required.filter(field => !parsed[field]);
      
      if (missing.length > 0) {
        throw new Error(`AI response missing required fields: ${missing.join(', ')}`);
      }
      
      return parsed;
    } catch (error) {
      throw new Error(`Invalid AI response format: ${error.message}`);
    }
  },

  /**
   * Merge AI insights with original data
   * @param {Object} originalData - Original product data
   * @param {Object} aiInsights - AI analysis results
   * @returns {Object} Merged data
   */
  mergeAIInsights: function(originalData, aiInsights) {
    return {
      ...originalData,
      ai_enhanced: {
        category_hierarchy: aiInsights.category_hierarchy,
        feature_analysis: aiInsights.feature_analysis,
        market_position: aiInsights.market_position,
        seo_optimization: aiInsights.seo_optimization,
        quality_metrics: aiInsights.quality_metrics
      },
      metadata: {
        ...originalData.metadata,
        ai_enhancement_timestamp: new Date().toISOString(),
        ai_enhancement_success: true,
        ai_confidence: aiInsights.quality_metrics.confidence_score
      }
    };
  },
  
  /**
   * Validate extracted data
   * @param {Object} data - Data to validate
   * @throws {Error} Validation error
   */
  /**
   * Validate extracted data with enhanced error reporting
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result with status and details
   * @throws {Error} If validation fails with critical errors
   */
  validateData: function(data) {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      qualityScore: 1.0
    };

    try {
      // Required fields validation
      const required = ['url', 'name'];
      const missing = required.filter(field => !data[field]);
      
      if (missing.length > 0) {
        validationResult.errors.push({
          type: 'MISSING_REQUIRED_FIELDS',
          fields: missing,
          message: `Missing required fields: ${missing.join(', ')}`
        });
        validationResult.isValid = false;
      }

      // URL validation
      if (data.url) {
        try {
          new URL(data.url);
        } catch (error) {
          validationResult.errors.push({
            type: 'INVALID_URL',
            field: 'url',
            value: data.url,
            message: 'Invalid URL format'
          });
          validationResult.isValid = false;
        }
      }

      // Price validation
      if (data.price !== undefined && data.price !== '') {
        const price = parseFloat(data.price);
        if (isNaN(price)) {
          validationResult.errors.push({
            type: 'INVALID_PRICE',
            field: 'price',
            value: data.price,
            message: 'Invalid price format'
          });
          validationResult.isValid = false;
        } else if (price < 0) {
          validationResult.errors.push({
            type: 'NEGATIVE_PRICE',
            field: 'price',
            value: price,
            message: 'Price cannot be negative'
          });
          validationResult.isValid = false;
        }
      }

      // Currency validation
      if (data.price && !data.currency) {
        validationResult.warnings.push({
          type: 'MISSING_CURRENCY',
          message: 'Price specified without currency'
        });
      }

      // Image URLs validation
      if (data.images) {
        if (!Array.isArray(data.images)) {
          validationResult.errors.push({
            type: 'INVALID_IMAGES_FORMAT',
            message: 'Images must be an array'
          });
          validationResult.isValid = false;
        } else {
          const invalidImages = data.images.filter(url => {
            try {
              new URL(url);
              return false;
            } catch {
              return true;
            }
          });

          if (invalidImages.length > 0) {
            validationResult.errors.push({
              type: 'INVALID_IMAGE_URLS',
              urls: invalidImages,
              message: `Invalid image URLs found: ${invalidImages.join(', ')}`
            });
            validationResult.isValid = false;
          }
        }
      }

      // Content quality checks
      if (data.name && data.name.length < 3) {
        validationResult.warnings.push({
          type: 'SHORT_NAME',
          message: 'Product name is very short'
        });
      }

      if (data.description && data.description.length < 50) {
        validationResult.warnings.push({
          type: 'SHORT_DESCRIPTION',
          message: 'Product description is very short'
        });
      }

      // Calculate quality score
      validationResult.qualityScore = this.calculateQualityScore(data, validationResult);

      // Log validation results
      if (!validationResult.isValid) {
        Logger.error('VALIDATION', 'Data validation failed', {
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          qualityScore: validationResult.qualityScore
        });
        throw new Error('Data validation failed: ' + 
          validationResult.errors.map(e => e.message).join('; '));
      } else if (validationResult.warnings.length > 0) {
        Logger.warn('VALIDATION', 'Data validation warnings', {
          warnings: validationResult.warnings,
          qualityScore: validationResult.qualityScore
        });
      } else {
        Logger.info('VALIDATION', 'Data validation successful', {
          qualityScore: validationResult.qualityScore
        });
      }

      return validationResult;

    } catch (error) {
      Logger.error('VALIDATION', 'Validation process error', error);
      throw error;
    }
  },

  /**
   * Calculate quality score for extracted data
   * @param {Object} data - The data to evaluate
   * @param {Object} validationResult - Current validation results
   * @returns {number} Quality score between 0 and 1
   */
  calculateQualityScore: function(data, validationResult) {
    let score = 1.0;

    // Deduct for errors
    score -= validationResult.errors.length * 0.2;

    // Deduct for warnings
    score -= validationResult.warnings.length * 0.1;

    // Bonus for rich content
    if (data.description && data.description.length > 200) score += 0.1;
    if (data.images && data.images.length > 2) score += 0.1;
    if (data.specifications && Object.keys(data.specifications).length > 5) score += 0.1;
    if (data.brand) score += 0.1;
    if (data.category) score += 0.1;

    // Ensure score stays between 0 and 1
    return Math.max(0, Math.min(1, score));
  },
  
  /**
   * Process multiple URLs in batches
   * @param {string[]} urls - URLs to process
   * @returns {Object[]} Processing results
   */
  processBatch: async function(urls, options = {}) {
    const {
      batchSize = CONFIG.PROCESSING.BATCH_SIZE,
      maxConcurrent = CONFIG.PROCESSING.CONCURRENT_REQUESTS,
      retryFailed = true,
      progressCallback = null
    } = options;

    const results = {
      successful: [],
      failed: [],
      stats: {
        total: urls.length,
        completed: 0,
        successful: 0,
        failed: 0,
        startTime: Date.now(),
        endTime: null,
        averageProcessingTime: 0
      }
    };

    try {
      // Validate and clean URLs before processing
      const validUrls = await this.prepareUrls(urls);
      
      // Process in batches
      for (let i = 0; i < validUrls.length; i += batchSize) {
        const batch = validUrls.slice(i, i + batchSize);
        const batchStartTime = Date.now();
        
        Logger.info('BATCH_PROCESS', `Processing batch ${Math.floor(i/batchSize) + 1}`, {
          batchSize: batch.length,
          totalProcessed: i,
          remaining: validUrls.length - i
        });

        // Process batch with concurrency limit
        const batchResults = await this.processWithConcurrency(batch, maxConcurrent);
        
        // Handle batch results
        batchResults.forEach(result => {
          if (result.success) {
            results.successful.push(result.data);
            results.stats.successful++;
          } else {
            results.failed.push({
              url: result.url,
              error: result.error,
              attempts: result.attempts
            });
            results.stats.failed++;
          }
        });

        results.stats.completed += batch.length;
        
        // Calculate and update statistics
        const batchTime = Date.now() - batchStartTime;
        results.stats.averageProcessingTime = 
          (results.stats.averageProcessingTime * i + batchTime) / (i + batch.length);

        // Report progress if callback provided
        if (progressCallback) {
          progressCallback({
            processed: results.stats.completed,
            total: results.stats.total,
            successful: results.stats.successful,
            failed: results.stats.failed,
            currentBatch: Math.floor(i/batchSize) + 1,
            totalBatches: Math.ceil(validUrls.length/batchSize),
            averageProcessingTime: results.stats.averageProcessingTime
          });
        }
      }

      // Retry failed URLs if enabled
      if (retryFailed && results.failed.length > 0) {
        Logger.info('BATCH_PROCESS', 'Retrying failed URLs', {
          failedCount: results.failed.length
        });

        const retryUrls = results.failed.map(f => f.url);
        const retryResults = await this.processBatch(retryUrls, {
          ...options,
          retryFailed: false // Prevent infinite retry loops
        });

        // Merge retry results
        results.successful.push(...retryResults.successful);
        results.failed = retryResults.failed; // Replace with final failures
        results.stats.successful += retryResults.stats.successful;
        results.stats.failed = retryResults.stats.failed;
      }

    } catch (error) {
      Logger.error('BATCH_PROCESS', 'Batch processing error', error);
      throw error;
    } finally {
      // Finalize statistics
      results.stats.endTime = Date.now();
      results.stats.totalTime = results.stats.endTime - results.stats.startTime;
      
      Logger.info('BATCH_PROCESS', 'Batch processing completed', {
        stats: results.stats,
        failureRate: results.stats.failed / results.stats.total
      });
    }

    return results;
  },

  /**
   * Process URLs with concurrency limit
   * @param {string[]} urls - URLs to process
   * @param {number} maxConcurrent - Maximum concurrent requests
   * @returns {Promise<Array>} Processing results
   */
  processWithConcurrency: async function(urls, maxConcurrent) {
    const results = [];
    const inProgress = new Set();
    
    // Process URLs in chunks respecting concurrency limit
    while (urls.length > 0 || inProgress.size > 0) {
      // Fill up to max concurrent requests
      while (inProgress.size < maxConcurrent && urls.length > 0) {
        const url = urls.shift();
        const promise = this.processUrl(url)
          .then(result => ({
            success: true,
            url: url,
            data: result,
            attempts: 1
          }))
          .catch(error => ({
            success: false,
            url: url,
            error: error.message,
            attempts: 1
          }))
          .finally(() => inProgress.delete(promise));
          
        inProgress.add(promise);
      }
      
      // Wait for at least one promise to complete
      if (inProgress.size > 0) {
        const completed = await Promise.race(inProgress);
        results.push(completed);
      }
    }
    
    return results;
  },

  /**
   * Prepare URLs for processing
   * @param {string[]} urls - URLs to prepare
   * @returns {Promise<string[]>} Validated and cleaned URLs
   */
  prepareUrls: async function(urls) {
    const validUrls = [];
    
    for (const url of urls) {
      const cleaned = this.cleanUrl(url);
      const validation = await this.isValidUrl(cleaned);
      
      if (validation.isValid) {
        validUrls.push(cleaned);
      } else {
        Logger.warn('URL_PREPARE', `Skipping invalid URL: ${url}`, validation.details);
      }
    }
    
    return validUrls;
  }
};

// Export the ExtractProcessor
this.ExtractProcessor = ExtractProcessor;
