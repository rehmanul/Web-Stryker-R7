/***************************************************************
 * SUPER-SIZED FINAL SCRIPT
 * Combining multi-level recursion, advanced filtering,
 * Perplexity & Azure fallback, domain-specific logic, 
 * translation to English, code/CSS detection, banned phrases,
 * plus Google Sheets logs & error-handling.
 *
 * By default, it reads a “Supplier D.B” sheet:
 *   - Website URLs in Column D
 *   - Writes product titles in columns G onward (up to 50 or so).
 *   - Logs status in Column F, plus uses "Error Log" & "Processing Log".
 *
 * Use onOpen() -> custom menu to set up API keys, test connection, 
 * start the extraction, pause/resume, etc.
 ***************************************************************/
const CONFIG = {
  /***************************************************************
   * SHEET & COLUMN CONFIG
   ***************************************************************/
  sheetName: "Supplier D.B",
  errorSheetName: "Error Log",
  logSheetName: "Processing Log",
  columns: {
    vendor: 1,          // Column A
    website: 4,         // Column D
    status: 6,          // Column F
    productsStart: 7    // Column G onward
  },
  // We'll store up to 50 product titles in columns G..(G+49).
  maxProductsPerRow: 50,
  /***************************************************************
   * RECURSIVE CRAWL CONFIG
   ***************************************************************/
  // Maximum depth we allow for sub-page crawling
  maxDepth: 3,
  // Phrases indicating a product section or subcategory link
  productSectionPhrases: [
    "Our Products", "Product Range", "Menu & Products", "Food Products",
    "Culinary Creations", "Discover our products", "Fresh Selections",
    "Products and Solutions", "Innovations in Food", "What We Offer",
    "Our Portfolio", "Product Collection"
  ],
  /***************************************************************
   * EXTRACTION & FALLBACK SETTINGS
   ***************************************************************/
  translateToEnglish: true, // Attempt to translate each page's text before parsing
  maxProducts: 50,          // For single-page extraction fallback usage
  // Regex-based approach for simple “product” extraction:
  regexSelectors: [
    /<h1[^>]*>(.*?)<\/h1>/gi,
    /<h2[^>]*>(.*?)<\/h2>/gi,
    /<h3[^>]*>(.*?)<\/h3>/gi,
    /<h4[^>]*>(.*?)<\/h4>/gi,
    /<li[^>]*>(.*?)<\/li>/gi,
    /<td[^>]*>(.*?)<\/td>/gi,
    /<a[^>]+class="[^"]*(product|item|title|name)[^"]*"[^>]*>(.*?)<\/a>/gi,
    /data-product-name="([^"]+)"/gi,
    /class="[^"]*(title|name|product)[^"]*">([^<]+)<\/(?:div|span|p)>/gi,
    /<div[^>]+class="[^"]*(product|item-title)[^"]*"[^>]*>(.*?)<\/div>/gi,
    /<span[^>]+class="[^"]*(product|item-title)[^"]*"[^>]*>(.*?)<\/span>/gi,
    /<p[^>]+class="[^"]*(product|item-title)[^"]*"[^>]*>(.*?)<\/p>/gi
  ],
  // Additional domain-specific logic
  // Example: tasteful.me, foodysfoods.com
  domainSpecific: {
    "tasteful.me": extractTastefulProducts,
    "foodysfoods.com": extractFoodysFoods
  },
  // Fallback: Perplexity API extraction
  perplexity: {
    apiKey: PropertiesService.getScriptProperties().getProperty('PERPLEXITY_API_KEY'),
    endpoint: 'https://api.perplexity.ai/chat/completions',
    model: 'sonar',
    systemPrompt: `Extract product titles from the HTML content provided.
Return a JSON array containing only the cleaned product titles.
Example: ["Chocolate Hazelnut Spread 200g", "Frozen Pork Front Feet (B-grade)"]`
  },
  // Optional Azure Cognitive Services for key phrase extraction
  azure: {
    enabled: !!PropertiesService.getScriptProperties().getProperty('AZURE_API_KEY'),
    apiKey: PropertiesService.getScriptProperties().getProperty('AZURE_API_KEY'),
    endpoint: PropertiesService.getScriptProperties().getProperty('AZURE_ENDPOINT') ||
              "https://<your-region>.api.cognitive.microsoft.com/text/analytics/v3.1/keyPhrases",
    language: "en"
  },
  /***************************************************************
   * FILTERING / DETECTION
   ***************************************************************/
  bannedPhrases: [
    "MISSION", "NEWS 2025", "NEWS", "MAIN MENU", "MAIN MENU (CUSTOM)",
    "CHOOSE YOUR COUNTRY OR REGION", "CHOOSE YOUR COUNTRY", "FOOTER MAIN MENU (CUSTOM)",
    "FOOTER MENU", "OUR BRANDS", "REGISTRATI", "CONFERMA", "INIZIA", "MENU", "SEGUICI",
    "NEWSLETTER", "DECALOGO", "EVENTI", "ERROR 901", "ERROR", "MADE IN FRANCE", "MADE IN",
    "#ESHOP", "TITOLO", "CONTATTACI", "FAQ", "WWW.", "&NBSP;", "NAUTI",
    "NO PRESSURE, JUST PLEASURE", "HERKULLISTA", "YHTEYSTIEDOT", "MAKU", "HYVINVOINTI",
    "SEARCH", "INDIRIZZO", "MAIL", "TELEFONO", "SOCIAL", "ISCRIVITI", "FOLLOW", "CONTACT",
    "PERCHÉ SCEGLIERCI", "RESTA AGGIORNATO SULLE ULTIME NOVITÀ",
    "@MPBERGAMO", "MPBERGAMOSRL", "SEGUICI SU", "ISCRIVITI ALLA NEWSLETTER",
    "COUNTRY/REGION", "LANGUAGE", "NAVIGATE", "SIGN UP TO OUR NEWSLETTER",
    "MICHAEL, MANGO FARMER", "BOBBY, PAWPAW FARMER", "MALIK, PAWPAW FARMER", "MR. ATO, MANGO FARMER",
    "PRODUCT", "HOME", "ABOUT US", "PRIVATE LABEL", "ORGANA LABEL", "ZA KOGA SMO PRIMERNI",
    "PROCESS & PRIVATE LABEL DEVELOPMENT", "YOUR PRIVATELABEL PRODUCER", "DECIDE ON A RECIPE",
    "PACKAGING & DESIGN", "JOIN OUR BASHA", "REAL REVIEWS FOR REAL FLAVORS", "SHOPPING CART",
    "CHOOSE YOUR COUNTRY", "SUBSCRIBE", "CODE", "WINDOW.SHOPIFYPAYPALV4VISIBILITYTRACKING"
  ],
  // Lines must contain at least one "food word" to be considered a product
  foodWords: [
    "spice", "herb", "chocolate", "cocoa", "cacao", "flour", "bread", "cheese", "butter",
    "milk", "cream", "frozen", "vac", "kg", "g ", "pork", "beef", "fish", "tail", "heart",
    "liver", "snout", "chicken", "drumstick", "pack", "package", "pancreas", "nut", "jam",
    "honey", "oil", "olive", "rice", "corn", "grain", "coffee", "tea", "tomato", "pepper",
    "onion", "garlic", "egg", "pizza", "biscuit", "candy", "dessert", "cookie", "sauce",
    "syrup", "pastry", "bean", "pasta", "chips", "protein", "cereal", "seasoning",
    "sea salt", "crackers", "spread", "wine", "beer", "ethio", "ethiopian", "imported", "spices"
  ],
  /***************************************************************
   * INTERNAL STATE
   ***************************************************************/
  request: {
    timeout: 30000,
    retries: 3,
    delay: 2500
  },
  visited: new Set() // track visited URLs per site crawl
};
/***************************************************************
 * THE MAIN MULTI-LEVEL ENTRY POINT
 ***************************************************************/
function extractAllProducts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  const errorSheet = getErrorSheet(ss);
  const logSheet = getLogSheet(ss);
  try {
    validateEnvironment(sheet);
    validateApiKey();
    clearStatusColumn(sheet);
    const lastRow = sheet.getLastRow();
    // resume from property
    let currentRow = getResumePosition() || 2;
    logProcessingStart(logSheet, lastRow - 1);
    while (currentRow <= lastRow) {
      const url = sheet.getRange(currentRow, CONFIG.columns.website).getValue();
      const vendor = sheet.getRange(currentRow, CONFIG.columns.vendor).getValue();
      if (!url) {
        updateStatus(sheet, currentRow, '⚠️ No URL');
        currentRow++;
        continue;
      }
      updateStatus(sheet, currentRow, '🔄 Processing...');
      CONFIG.visited.clear();
      try {
        // Multi-level crawl
        let allProducts = crawlPageForProducts(url, 0);
        // write final results
        writeProductsToSheet(sheet, currentRow, allProducts);
        updateStatus(sheet, currentRow, `✅ ${allProducts.length} products found`);
        logSuccess(logSheet, currentRow, vendor, url, allProducts.length);
      } catch (e) {
        updateStatus(sheet, currentRow, `❌ ${e.message}`);
        logError(errorSheet, e, currentRow, vendor, url);
      }
      // flush & next
      currentRow++;
      saveResumePosition(currentRow);
      // progress
      let percent = Math.min(100, Math.round(((currentRow - 2) / (lastRow - 1)) * 100));
      updateProgress(sheet, percent);
      Utilities.sleep(CONFIG.request.delay);
    }
    finalizeProcessing(sheet, logSheet);
  } catch (err) {
    // log the top-level error
    logError(errorSheet, err);
    throw err;
  }
}
/***************************************************************
 * MULTI-LEVEL CRAWLING, TRANSLATION, DETECTING PRODUCT SECTIONS
 ***************************************************************/
/**
 * Recursive function to:
 * 1) fetch page,
 * 2) translate to English,
 * 3) detect “product section” links => follow them (depth-limited),
 * 4) also do normal “product extraction” on the same page.
 */
function crawlPageForProducts(url, depth) {
  if (depth > CONFIG.maxDepth) {
    Logger.log(`Max depth reached for: ${url}`);
    return [];
  }
  if (CONFIG.visited.has(url)) {
    Logger.log(`Already visited: ${url}`);
    return [];
  }
  CONFIG.visited.add(url);
  Logger.log(`Crawling [depth=${depth}] => ${url}`);
  // fetch & translate
  const html = fetchWebpage(url);
  const translated = tryTranslateHtml(html);
  // find subcategory links
  const categoryLinks = findProductSectionLinks(translated, url);
  // also extract product titles from the current page 
  let pageProducts = extractProductsAdaptive(url, html, translated);
  // go deeper
  let subProducts = [];
  for (let link of categoryLinks) {
    try {
      const deeper = crawlPageForProducts(link, depth + 1);
      subProducts = subProducts.concat(deeper);
    } catch (e) {
      Logger.log(`Error crawling sub-link: ${link}, ${e.message}`);
    }
  }
  // return combined
  return pageProducts.concat(subProducts);
}
/** 
 * findProductSectionLinks tries to see if there's a phrase from 
 * CONFIG.productSectionPhrases in the translated text. 
 * If found near <a href="...">, we assume it's a subcategory link.
 */
function findProductSectionLinks(translatedHtml, baseUrl) {
  let links = [];
  for (const phrase of CONFIG.productSectionPhrases) {
    const blockRegex = new RegExp(`.{0,200}${escapeRegex(phrase)}.{0,200}`, "gi");
    let match;
    while ((match = blockRegex.exec(translatedHtml)) !== null) {
      const snippet = match[0];
      const hrefRegex = /<a[^>]+href\s*=\s*["']([^"']+)["']/gi;
      let hrefM;
      while ((hrefM = hrefRegex.exec(snippet)) !== null) {
        let linkUrl = hrefM[1];
        linkUrl = absoluteUrl(linkUrl, baseUrl);
        if (linkUrl && isValidUrl(linkUrl)) {
          links.push(linkUrl);
        }
      }
    }
  }
  return [...new Set(links)];
}
/***************************************************************
 * ADAPTIVE PRODUCT EXTRACTION (regex, domain-specific, Azure, Perplexity)
 ***************************************************************/
function extractProductsAdaptive(url, originalHtml, translatedHtml) {
  // domain-specific
  let domainResults = [];
  for (let domain in CONFIG.domainSpecific) {
    if (url.includes(domain)) {
      domainResults = CONFIG.domainSpecific[domain](originalHtml);
      break;
    }
  }
  // generic regex
  let regexResults = extractProductsWithRegex(originalHtml);
  // combine, filter
  let combined = mergeUnique(domainResults, regexResults);
  // if minimal, try Azure (if enabled)
  if (combined.length < 3 && CONFIG.azure.enabled) {
    try {
      let azureProds = extractProductsWithAzure(originalHtml);
      combined = mergeUnique(combined, azureProds);
    } catch (e) {
      Logger.log(`Azure extraction error: ${e.message}`);
    }
  }
  // if still minimal, try Perplexity
  if (combined.length < 3 && CONFIG.perplexity.apiKey) {
    try {
      let perplexityProds = queryPerplexity(originalHtml);
      combined = mergeUnique(combined, perplexityProds);
    } catch (e) {
      Logger.log(`Perplexity extraction error: ${e.message}`);
    }
  }
  // also do a heuristic line-based approach on the translated text 
  // to catch product lines with “frozen,” “kg,” etc.
  if (combined.length < 3) {
    let heuristics = heuristicLineExtraction(translatedHtml);
    combined = mergeUnique(combined, heuristics);
  }
  // filter 
  let final = filterProducts(combined);
  if (CONFIG.translateToEnglish) {
    // each item -> translate (some might already be English, but we unify)
    final = final.map(p => safeTranslate(p));
  }
  return final;
}
/**
 * domain-specific extraction for tasteful.me
 */
function extractTastefulProducts(html) {
  let result = [];
  // Known pattern: "Visit something »"
  const pattern = /Visit\s+([^»]+)»/gi;
  let m;
  while ((m = pattern.exec(html)) !== null) {
    let product = cleanText(m[1]);
    if (product && product.length > 2) result.push(product);
  }
  // Additional headings
  const headingPattern = /<h2[^>]*>([^<]+)<\/h2>/gi;
  while ((m = headingPattern.exec(html)) !== null) {
    let candidate = cleanText(m[1]);
    if (candidate === candidate.toUpperCase() && candidate.length > 3) {
      result.push(candidate);
    }
  }
  return result;
}
/**
 * domain-specific extraction for foodysfoods.com 
 */
function extractFoodysFoods(html) {
  let result = [];
  const pattern = /<[^>]*class="[^"]*title-2[^"]*"[^>]*>(.*?)<\/[^>]+>/gi;
  let m;
  while ((m = pattern.exec(html)) !== null) {
    let product = cleanText(m[1]);
    if (product && product.length > 2) result.push(product);
  }
  return result;
}
/**
 * Generic regex approach (CONFIG.regexSelectors).
 */
function extractProductsWithRegex(html) {
  let resultSet = new Set();
  for (let selector of CONFIG.regexSelectors) {
    const matches = html.matchAll(selector);
    for (let match of matches) {
      let text = match[2] || match[1] || "";
      text = cleanText(text);
      if (text.length > 2) {
        resultSet.add(text);
      }
    }
  }
  return Array.from(resultSet);
}
/**
 * Heuristic approach scanning lines in the (already) translated text
 * looking for keywords like "frozen", "kg", etc.
 */
function heuristicLineExtraction(translatedText) {
  let textContent = translatedText.replace(/\r?\n+/g, "\n");
  let lines = textContent.split('\n').map(l => cleanText(l)).filter(Boolean);
  const productIndicators = [
    "frozen", "vac", "grade", "kg", "g ", "pork", "beef", "fish", "tail",
    "heart", "liver", "snout", "chicken", "drumstick", "pack", "package",
    "c12kg", "feet", "pancreas", "chocolate", "spice", "herb", "flour", "butter",
    "milk", "cream", "oil", "nut", "jam", "honey", "dip", "bread", "pastry"
  ];
  let results = [];
  for (let line of lines) {
    const lowerLine = line.toLowerCase();
    if (productIndicators.some(ind => lowerLine.includes(ind))) {
      if (line.length > 2 && line.length < 200) {
        results.push(line);
      }
    }
  }
  return [...new Set(results)];
}
/**
 * Azure fallback extraction
 */
function extractProductsWithAzure(html) {
  const plainText = html.replace(/<[^>]+>/g, ' ');
  const payload = {
    documents: [
      { language: CONFIG.azure.language, id: "1", text: plainText }
    ]
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: { 'Ocp-Apim-Subscription-Key': CONFIG.azure.apiKey }
  };
  let resp = UrlFetchApp.fetch(CONFIG.azure.endpoint, options);
  if (resp.getResponseCode() === 200) {
    const result = JSON.parse(resp.getContentText());
    let phrases = (result.documents && result.documents[0]) 
      ? result.documents[0].keyPhrases || []
      : [];
    return phrases.map(p => cleanText(p));
  }
  throw new Error(`Azure error: ${resp.getResponseCode()}`);
}
/**
 * Perplexity fallback extraction
 * expects a JSON array in the final response
 */
function queryPerplexity(html) {
  const payload = {
    model: CONFIG.perplexity.model,
    messages: [
      { role: "system", content: CONFIG.perplexity.systemPrompt },
      { role: "user", content: `Extract product titles from this HTML: ${html.substring(0, 8000)}` }
    ],
    temperature: 0.1,
    max_tokens: 2000
  };
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${CONFIG.perplexity.apiKey}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  for (let attempt = 0; attempt < CONFIG.request.retries; attempt++) {
    try {
      let resp = UrlFetchApp.fetch(CONFIG.perplexity.endpoint, options);
      let code = resp.getResponseCode();
      let text = resp.getContentText();
      if (code === 200) {
        let result = JSON.parse(text);
        if (result.choices && result.choices[0]) {
          let content = result.choices[0].message.content.trim();
          // attempt to find array
          if (!content.startsWith("[")) {
            let arrMatch = content.match(/(\[[\s\S]*\])/);
            if (arrMatch && arrMatch[1]) {
              content = arrMatch[1];
            }
          }
          let products = JSON.parse(content);
          if (Array.isArray(products)) {
            return products.filter(p => typeof p === 'string').map(cleanText);
          }
        }
        throw new Error(result.error?.message || 'Unknown Perplexity parse error');
      } else {
        throw new Error(`HTTP ${code}`);
      }
    } catch (err) {
      if (attempt === CONFIG.request.retries - 1) {
        throw err;
      }
      Utilities.sleep(CONFIG.request.delay * (attempt + 1));
    }
  }
  throw new Error('Perplexity fallback: All retries failed.');
}
/***************************************************************
 * BASIC UTILS
 ***************************************************************/
/** fetchWebpage with error handling */
function fetchWebpage(url) {
  const options = {
    muteHttpExceptions: true,
    followRedirects: true,
    timeout: CONFIG.request.timeout,
    headers: { "User-Agent": "Mozilla/5.0" }
  };
  const resp = UrlFetchApp.fetch(url, options);
  const code = resp.getResponseCode();
  if (code === 200) {
    return resp.getContentText();
  } else {
    if (code === 403) throw new Error("Access denied by website (403)");
    if (/DNS/.test(resp.getContentText())) throw new Error("Website not found (DNS error)");
    throw new Error(`Failed to fetch webpage: ${code}`);
  }
}
/** partial "translation" of HTML chunk to EN for subcategory detection, etc. */
function tryTranslateHtml(html) {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  cleaned = cleaned.substring(0, 4500);
  // do a single shot
  return LanguageApp.translate(cleaned, "auto", "en");
}
/** merges two arrays uniquely */
function mergeUnique(a1, a2) {
  const merged = new Set(a1);
  for (let item of a2) merged.add(item);
  return Array.from(merged);
}
/** remove HTML tags, extra space */
function cleanText(txt) {
  return txt
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
/** absolute URL for relative link */
function absoluteUrl(linkUrl, baseUrl) {
  if (/^https?:\/\//i.test(linkUrl)) {
    return linkUrl;
  }
  try {
    let base = new URL(baseUrl);
    return new URL(linkUrl, base).href;
  } catch (e) {
    return null;
  }
}
/** checks if url starts with http(s) */
function isValidUrl(u) {
  return /^https?:\/\//i.test(u);
}
/** escape string for usage in a dynamic regex */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
