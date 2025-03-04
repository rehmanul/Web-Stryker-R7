function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('AI Extractor Pro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getPage(page) {
  return HtmlService.createTemplateFromFile(page)
    .evaluate()
    .getContent();
}
function getStrykeStats() {
  try {
    var stats = calculateStats();
    Logger.log(stats);
    return stats;
  } catch (e) {
    Logger.log("Error calculating stats: " + e.message);
    throw new Error("Failed to calculate statistics: " + e.message);
  }
}

function getStrykeData() {
  try {
    var data = retrieveData();
    Logger.log(data);
    return data;
  } catch (e) {
    Logger.log("Error retrieving data: " + e.message);
    throw new Error("Failed to retrieve data: " + e.message);
  }
}

function filterData(data, criteria) {
  try {
    var filteredData = data.filter(function(item) {
      return item.someProperty === criteria;
    });
    Logger.log(filteredData);
    return filteredData;
  } catch (e) {
    Logger.log("Error filtering data: " + e.message);
    throw new Error("Failed to filter data: " + e.message);
  }
}
function getStrykeStats() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
    if (!sheet) throw new Error('Data sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    // Calculate statistics
    const stats = {
      totalCompanies: rows.length,
      successfulCompanies: rows.filter(row => row[getColumnIndex(headers, 'Status')] === 'COMPLETED').length,
      failedCompanies: rows.filter(row => row[getColumnIndex(headers, 'Status')] === 'ERROR').length,
      singleProductCompanies: rows.filter(row => row[getColumnIndex(headers, 'ProductQuantity')] === 'Single').length,
      multiProductCompanies: rows.filter(row => row[getColumnIndex(headers, 'ProductQuantity')] === 'Many').length
    };

    Logger.info('Stats calculated successfully', stats);
    return stats;
  } catch (error) {
    Logger.error('Error calculating stats', error);
    throw new Error('Failed to calculate statistics: ' + error.message);
  }
}

function getStrykeData(options) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
    if (!sheet) throw new Error('Data sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    let rows = data.slice(1);

    // Apply filters
    rows = filterData(rows, headers, options);

    // Calculate total pages
    const totalPages = Math.ceil(rows.length / options.pageSize);

    // Apply pagination
    const startIndex = (options.page - 1) * options.pageSize;
    const endIndex = startIndex + options.pageSize;
    rows = rows.slice(startIndex, endIndex);

    Logger.info('Data retrieved successfully', { page: options.page, totalPages });
    return {
      data: rows,
      totalPages: totalPages
    };
  } catch (error) {
    Logger.error('Error retrieving data', error);
    throw new Error('Failed to retrieve data: ' + error.message);
  }
}

function filterData(rows, headers, options) {
  return rows.filter(row => {
    // Status filter
    if (options.status && row[getColumnIndex(headers, 'Status')] !== options.status) {
      return false;
    }

    // Search term filter
    if (options.searchTerm) {
      const searchTerm = options.searchTerm.toLowerCase();
      const searchableColumns = ['URL', 'CompanyName', 'MainCategory', 'SubCategory'];
      const hasMatch = searchableColumns.some(column => {
        const value = String(row[getColumnIndex(headers, column)]).toLowerCase();
        return value.includes(searchTerm);
      });
      if (!hasMatch) return false;
    }

    // Company type filter
    if (options.companyType) {
      const productQuantity = row[getColumnIndex(headers, 'ProductQuantity')];
      if (options.companyType === 'single' && productQuantity !== 'Single') return false;
      if (options.companyType === 'multi' && productQuantity !== 'Many') return false;
    }

    // Main category filter
    if (options.mainCategory && row[getColumnIndex(headers, 'MainCategory')] !== options.mainCategory) {
      return false;
    }

    // Error type filter
    if (options.errorType) {
      const errorMessage = String(row[getColumnIndex(headers, 'ErrorMessage')]).toLowerCase();
      if (!errorMessage.includes(options.errorType.toLowerCase())) return false;
    }

    return true;
  });
}

function getCompanyDetails(url) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
    if (!sheet) throw new Error('Data sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const row = rows.find(r => r[getColumnIndex(headers, 'URL')] === url);
    if (!row) throw new Error('Company not found');

    const details = {
      url: row[getColumnIndex(headers, 'URL')],
      companyName: row[getColumnIndex(headers, 'CompanyName')],
      companyLogoURL: row[getColumnIndex(headers, 'LogoURL')],
      mainCategory: row[getColumnIndex(headers, 'MainCategory')],
      subCategory: row[getColumnIndex(headers, 'SubCategory')],
      productFamily: row[getColumnIndex(headers, 'ProductFamily')],
      productName: row[getColumnIndex(headers, 'ProductName')],
      productType: row[getColumnIndex(headers, 'ProductType')],
      productQuantity: row[getColumnIndex(headers, 'ProductQuantity')],
      description: row[getColumnIndex(headers, 'Description')],
      detailedDescription: row[getColumnIndex(headers, 'DetailedDescription')],
      productImages: row[getColumnIndex(headers, 'ProductImages')].split(',').map(url => url.trim()),
      emails: row[getColumnIndex(headers, 'Emails')].split(',').map(email => email.trim()),
      phones: row[getColumnIndex(headers, 'Phones')].split(',').map(phone => phone.trim()),
      addresses: row[getColumnIndex(headers, 'Addresses')].split(',').map(addr => addr.trim())
    };

    Logger.info('Company details retrieved successfully', { url });
    return details;
  } catch (error) {
    Logger.error('Error retrieving company details', error);
    throw new Error('Failed to retrieve company details: ' + error.message);
  }
}

function getMainCategories() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
    if (!sheet) throw new Error('Data sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const categories = new Set();
    rows.forEach(row => {
      const category = row[getColumnIndex(headers, 'MainCategory')];
      if (category) categories.add(category);
    });

    Logger.info('Categories retrieved successfully');
    return Array.from(categories).sort();
  } catch (error) {
    Logger.error('Error retrieving categories', error);
    throw new Error('Failed to retrieve categories: ' + error.message);
  }
}

function getCategoryAnalysis() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
    if (!sheet) throw new Error('Data sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    // Calculate category distribution
    const categoryCount = {};
    rows.forEach(row => {
      const category = row[getColumnIndex(headers, 'MainCategory')];
      if (category) categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const totalCompanies = rows.length;
    const categoryDistribution = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: ((count / totalCompanies) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate hierarchy analysis
    const hierarchyAnalysis = Object.entries(categoryCount).map(([mainCategory, count]) => {
      const categoryRows = rows.filter(row => row[getColumnIndex(headers, 'MainCategory')] === mainCategory);
      const subCategories = new Set(categoryRows.map(row => row[getColumnIndex(headers, 'SubCategory')]));
      const productFamilies = new Set(categoryRows.map(row => row[getColumnIndex(headers, 'ProductFamily')]));
      
      return {
        mainCategory,
        subCategories: Array.from(subCategories).filter(Boolean),
        productFamilies: Array.from(productFamilies).filter(Boolean),
        productCount: categoryRows.length
      };
    });

    Logger.info('Category analysis completed successfully');
    return {
      categoryDistribution,
      hierarchyAnalysis
    };
  } catch (error) {
    Logger.error('Error performing category analysis', error);
    throw new Error('Failed to perform category analysis: ' + error.message);
  }
}

function retryExtraction(url) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
    if (!sheet) throw new Error('Data sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const rowIndex = rows.findIndex(row => row[getColumnIndex(headers, 'URL')] === url);
    if (rowIndex === -1) throw new Error('URL not found');

    // Reset status and error message
    sheet.getRange(rowIndex + 2, getColumnIndex(headers, 'Status') + 1).setValue('PENDING');
    sheet.getRange(rowIndex + 2, getColumnIndex(headers, 'ErrorMessage') + 1).setValue('');

    // Trigger extraction process
    ExtractProcessor.processUrl(url);

    Logger.info('Extraction retry initiated successfully', { url });
    return { success: true };
  } catch (error) {
    Logger.error('Error retrying extraction', error);
    throw new Error('Failed to retry extraction: ' + error.message);
  }
}

function retryAllFailedExtractions() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
    if (!sheet) throw new Error('Data sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const failedRows = rows.filter(row => row[getColumnIndex(headers, 'Status')] === 'ERROR');
    failedRows.forEach(row => {
      const url = row[getColumnIndex(headers, 'URL')];
      retryExtraction(url);
    });

    Logger.info('Batch retry initiated successfully', { count: failedRows.length });
    return { success: true, count: failedRows.length };
  } catch (error) {
    Logger.error('Error retrying all failed extractions', error);
    throw new Error('Failed to retry all extractions: ' + error.message);
  }
}

function exportToCSV(type) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
    if (!sheet) throw new Error('Data sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    // Filter rows based on type
    const filteredRows = type === 'success' 
      ? rows.filter(row => row[getColumnIndex(headers, 'Status')] === 'COMPLETED')
      : rows.filter(row => row[getColumnIndex(headers, 'Status')] === 'ERROR');

    // Create CSV content
    const csvContent = [headers].concat(filteredRows)
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Save to Drive
    const fileName = `AI_Extractor_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    const file = DriveApp.createFile(fileName, csvContent, MimeType.CSV);

    Logger.info('CSV export completed successfully', { type, fileName });
    return { success: true, fileId: file.getId() };
  } catch (error) {
    Logger.error('Error exporting to CSV', error);
    throw new Error('Failed to export data: ' + error.message);
  }
}

function getColumnIndex(headers, columnName) {
  const index = headers.indexOf(columnName);
  if (index === -1) throw new Error(`Column not found: ${columnName}`);
  return index;
}
