/**
 * Extract Processor class for handling data processing and analysis
 */
class ExtractProcessor {
  /**
   * Calculate statistics from the data sheet
   */
  static calculateStats() {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
      if (!sheet) throw new Error('Data sheet not found');

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      const stats = {
        totalCompanies: rows.length,
        successfulCompanies: rows.filter(row => row[this.getColumnIndex(headers, 'Status')] === 'COMPLETED').length,
        failedCompanies: rows.filter(row => row[this.getColumnIndex(headers, 'Status')] === 'ERROR').length,
        singleProductCompanies: rows.filter(row => row[this.getColumnIndex(headers, 'ProductQuantity')] === 'Single').length,
        multiProductCompanies: rows.filter(row => row[this.getColumnIndex(headers, 'ProductQuantity')] === 'Many').length
      };

      Logger.info('Stats calculated successfully', stats);
      return stats;
    } catch (error) {
      Logger.error('Error calculating stats', error);
      throw new Error('Failed to calculate statistics: ' + error.message);
    }
  }

  /**
   * Get data with filtering and pagination
   */
  static getData(options) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
      if (!sheet) throw new Error('Data sheet not found');

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      let rows = data.slice(1);

      // Apply filters
      rows = this.filterData(rows, headers, options);

      // Calculate total pages
      const totalPages = Math.ceil(rows.length / options.pageSize);

      // Apply pagination
      const startIndex = (options.page - 1) * options.pageSize;
      const endIndex = startIndex + options.pageSize;
      rows = rows.slice(startIndex, endIndex);

      Logger.info('Data retrieved successfully', { page: options.page, totalPages });
      return { data: rows, totalPages };
    } catch (error) {
      Logger.error('Error retrieving data', error);
      throw new Error('Failed to retrieve data: ' + error.message);
    }
  }

  /**
   * Filter data based on options
   */
  static filterData(rows, headers, options) {
    return rows.filter(row => {
      // Status filter
      if (options.status && row[this.getColumnIndex(headers, 'Status')] !== options.status) {
        return false;
      }

      // Search term filter
      if (options.searchTerm) {
        const searchTerm = options.searchTerm.toLowerCase();
        const searchableColumns = ['URL', 'CompanyName', 'MainCategory', 'SubCategory'];
        const hasMatch = searchableColumns.some(column => {
          const value = String(row[this.getColumnIndex(headers, column)]).toLowerCase();
          return value.includes(searchTerm);
        });
        if (!hasMatch) return false;
      }

      // Company type filter
      if (options.companyType) {
        const productQuantity = row[this.getColumnIndex(headers, 'ProductQuantity')];
        if (options.companyType === 'single' && productQuantity !== 'Single') return false;
        if (options.companyType === 'multi' && productQuantity !== 'Many') return false;
      }

      // Main category filter
      if (options.mainCategory && row[this.getColumnIndex(headers, 'MainCategory')] !== options.mainCategory) {
        return false;
      }

      // Error type filter
      if (options.errorType) {
        const errorMessage = String(row[this.getColumnIndex(headers, 'ErrorMessage')]).toLowerCase();
        if (!errorMessage.includes(options.errorType.toLowerCase())) return false;
      }

      return true;
    });
  }

  /**
   * Get company details
   */
  static getCompanyDetails(url) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
      if (!sheet) throw new Error('Data sheet not found');

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      const row = rows.find(r => r[this.getColumnIndex(headers, 'URL')] === url);
      if (!row) throw new Error('Company not found');

      const details = {
        url: row[this.getColumnIndex(headers, 'URL')],
        companyName: row[this.getColumnIndex(headers, 'CompanyName')],
        companyLogoURL: row[this.getColumnIndex(headers, 'LogoURL')],
        mainCategory: row[this.getColumnIndex(headers, 'MainCategory')],
        subCategory: row[this.getColumnIndex(headers, 'SubCategory')],
        productFamily: row[this.getColumnIndex(headers, 'ProductFamily')],
        productName: row[this.getColumnIndex(headers, 'ProductName')],
        productType: row[this.getColumnIndex(headers, 'ProductType')],
        productQuantity: row[this.getColumnIndex(headers, 'ProductQuantity')],
        description: row[this.getColumnIndex(headers, 'Description')],
        detailedDescription: row[this.getColumnIndex(headers, 'DetailedDescription')],
        productImages: row[this.getColumnIndex(headers, 'ProductImages')].split(',').map(url => url.trim()),
        emails: row[this.getColumnIndex(headers, 'Emails')].split(',').map(email => email.trim()),
        phones: row[this.getColumnIndex(headers, 'Phones')].split(',').map(phone => phone.trim()),
        addresses: row[this.getColumnIndex(headers, 'Addresses')].split(',').map(addr => addr.trim())
      };

      Logger.info('Company details retrieved successfully', { url });
      return details;
    } catch (error) {
      Logger.error('Error retrieving company details', error);
      throw new Error('Failed to retrieve company details: ' + error.message);
    }
  }

  /**
   * Get categories for dropdown
   */
  static getCategories() {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
      if (!sheet) throw new Error('Data sheet not found');

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      const categories = new Set();
      rows.forEach(row => {
        const category = row[this.getColumnIndex(headers, 'MainCategory')];
        if (category) categories.add(category);
      });

      Logger.info('Categories retrieved successfully');
      return Array.from(categories).sort();
    } catch (error) {
      Logger.error('Error retrieving categories', error);
      throw new Error('Failed to retrieve categories: ' + error.message);
    }
  }

  /**
   * Analyze category data
   */
  static analyzeCategoryData() {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
      if (!sheet) throw new Error('Data sheet not found');

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      // Calculate category distribution
      const categoryCount = {};
      rows.forEach(row => {
        const category = row[this.getColumnIndex(headers, 'MainCategory')];
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
        const categoryRows = rows.filter(row => row[this.getColumnIndex(headers, 'MainCategory')] === mainCategory);
        const subCategories = new Set(categoryRows.map(row => row[this.getColumnIndex(headers, 'SubCategory')]));
        const productFamilies = new Set(categoryRows.map(row => row[this.getColumnIndex(headers, 'ProductFamily')]));
        
        return {
          mainCategory,
          subCategories: Array.from(subCategories).filter(Boolean),
          productFamilies: Array.from(productFamilies).filter(Boolean),
          productCount: categoryRows.length
        };
      });

      Logger.info('Category analysis completed successfully');
      return { categoryDistribution, hierarchyAnalysis };
    } catch (error) {
      Logger.error('Error performing category analysis', error);
      throw new Error('Failed to perform category analysis: ' + error.message);
    }
  }

  /**
   * Retry extraction for a URL
   */
  static retryExtraction(url) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
      if (!sheet) throw new Error('Data sheet not found');

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      const rowIndex = rows.findIndex(row => row[this.getColumnIndex(headers, 'URL')] === url);
      if (rowIndex === -1) throw new Error('URL not found');

      // Reset status and error message
      sheet.getRange(rowIndex + 2, this.getColumnIndex(headers, 'Status') + 1).setValue('PENDING');
      sheet.getRange(rowIndex + 2, this.getColumnIndex(headers, 'ErrorMessage') + 1).setValue('');

      // Trigger extraction process
      this.processUrl(url);

      Logger.info('Extraction retry initiated successfully', { url });
      return { success: true };
    } catch (error) {
      Logger.error('Error retrying extraction', error);
      throw new Error('Failed to retry extraction: ' + error.message);
    }
  }

  /**
   * Retry all failed extractions
   */
  static retryAllFailed() {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
      if (!sheet) throw new Error('Data sheet not found');

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      const failedRows = rows.filter(row => row[this.getColumnIndex(headers, 'Status')] === 'ERROR');
      failedRows.forEach(row => {
        const url = row[this.getColumnIndex(headers, 'URL')];
        this.retryExtraction(url);
      });

      Logger.info('Batch retry initiated successfully', { count: failedRows.length });
      return { success: true, count: failedRows.length };
    } catch (error) {
      Logger.error('Error retrying all failed extractions', error);
      throw new Error('Failed to retry all extractions: ' + error.message);
    }
  }

  /**
   * Export data to CSV
   */
  static exportToCSV(type) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEETS.DATA);
      if (!sheet) throw new Error('Data sheet not found');

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);

      // Filter rows based on type
      const filteredRows = type === 'success' 
        ? rows.filter(row => row[this.getColumnIndex(headers, 'Status')] === 'COMPLETED')
        : rows.filter(row => row[this.getColumnIndex(headers, 'Status')] === 'ERROR');

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

  /**
   * Get column index by name
   */
  static getColumnIndex(headers, columnName) {
    const index = headers.indexOf(columnName);
    if (index === -1) throw new Error(`Column not found: ${columnName}`);
    return index;
  }
}
