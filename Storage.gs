/**
 * AI Product Extractor - Storage System
 * Version: 3.1.0
 * 
 * Handles data persistence, export, and backup functionality
 */

const Storage = {
  /**
   * Save extracted data to spreadsheet
   * @param {Object[]} data - Data to save
   * @returns {boolean} Success status
   */
  saveToSheet: function(data) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.DATA);
      
      if (!sheet) {
        throw new Error('Data sheet not found');
      }
      
      // Prepare data rows
      const rows = data.map(item => [
        item.url,
        item.name,
        item.description,
        item.price,
        item.currency,
        item.category,
        item.subcategory,
        item.brand,
        JSON.stringify(item.specifications),
        item.images.join(', '),
        new Date().toISOString(),
        'COMPLETED'
      ]);
      
      // Append data
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
          .setValues(rows);
      }
      
      Logger.info('STORAGE', `Saved ${rows.length} records to sheet`);
      return true;
      
    } catch (error) {
      Logger.error('STORAGE', 'Error saving to sheet', error);
      return false;
    }
  },
  
  /**
   * Export data to CSV
   * @param {string} type - Export type (all, completed, failed)
   * @returns {Object} Export result with file ID
   */
  exportToCsv: function(type = 'all') {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.DATA);
      
      if (!sheet) {
        throw new Error('Data sheet not found');
      }
      
      // Get all data
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      let rows = data.slice(1);
      
      // Filter based on type
      if (type === 'completed') {
        rows = rows.filter(row => row[11] === 'COMPLETED');
      } else if (type === 'failed') {
        rows = rows.filter(row => row[11] === 'ERROR');
      }
      
      // Create CSV content
      const csvContent = [headers].concat(rows)
        .map(row => row.map(cell => {
          // Handle special characters and quotes in CSV
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(','))
        .join('\n');
      
      // Create file in Drive
      const fileName = `AI_Extractor_Export_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      const file = DriveApp.createFile(fileName, csvContent, MimeType.CSV);
      
      Logger.info('EXPORT', `Exported ${rows.length} records to CSV`);
      
      return {
        success: true,
        fileId: file.getId(),
        fileName: fileName,
        url: file.getUrl()
      };
      
    } catch (error) {
      Logger.error('EXPORT', 'Error exporting to CSV', error);
      throw error;
    }
  },
  
  /**
   * Create backup of data
   * @returns {Object} Backup result with file ID
   */
  createBackup: function() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const now = new Date();
      const backupFileName = `AI_Extractor_Backup_${now.toISOString().split('T')[0]}.xlsx`;
      
      // Create backup folder if it doesn't exist
      let folder = DriveApp.getFoldersByName('AI_Extractor_Backups').next();
      if (!folder) {
        folder = DriveApp.createFolder('AI_Extractor_Backups');
      }
      
      // Create backup file
      const blob = ss.getBlob();
      const file = folder.createFile(blob.setName(backupFileName));
      
      // Clean up old backups (keep last 10)
      const backups = folder.getFiles();
      const allBackups = [];
      
      while (backups.hasNext()) {
        allBackups.push(backups.next());
      }
      
      // Sort by date and remove old backups
      allBackups.sort((a, b) => b.getDateCreated() - a.getDateCreated());
      
      if (allBackups.length > 10) {
        allBackups.slice(10).forEach(backup => backup.setTrashed(true));
      }
      
      Logger.info('BACKUP', `Created backup: ${backupFileName}`);
      
      return {
        success: true,
        fileId: file.getId(),
        fileName: backupFileName,
        url: file.getUrl()
      };
      
    } catch (error) {
      Logger.error('BACKUP', 'Error creating backup', error);
      throw error;
    }
  },
  
  /**
   * Restore from backup
   * @param {string} fileId - Backup file ID
   * @returns {boolean} Success status
   */
  restoreFromBackup: function(fileId) {
    try {
      // Get backup file
      const file = DriveApp.getFileById(fileId);
      if (!file) {
        throw new Error('Backup file not found');
      }
      
      // Create temporary spreadsheet from backup
      const blob = file.getBlob();
      const tempSs = SpreadsheetApp.open(blob);
      
      // Get current spreadsheet
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // Copy each sheet from backup
      tempSs.getSheets().forEach(sourceSheet => {
        // Delete existing sheet if it exists
        const existingSheet = ss.getSheetByName(sourceSheet.getName());
        if (existingSheet) {
          ss.deleteSheet(existingSheet);
        }
        
        // Copy sheet to current spreadsheet
        sourceSheet.copyTo(ss).setName(sourceSheet.getName());
      });
      
      // Delete temporary spreadsheet
      DriveApp.getFileById(tempSs.getId()).setTrashed(true);
      
      Logger.info('RESTORE', `Restored from backup: ${file.getName()}`);
      return true;
      
    } catch (error) {
      Logger.error('RESTORE', 'Error restoring from backup', error);
      throw error;
    }
  },
  
  /**
   * Get list of available backups
   * @returns {Object[]} List of backups
   */
  getBackupsList: function() {
    try {
      const backups = [];
      const folder = DriveApp.getFoldersByName('AI_Extractor_Backups');
      
      if (folder.hasNext()) {
        const files = folder.next().getFiles();
        
        while (files.hasNext()) {
          const file = files.next();
          backups.push({
            id: file.getId(),
            name: file.getName(),
            date: file.getDateCreated(),
            size: file.getSize(),
            url: file.getUrl()
          });
        }
      }
      
      return backups.sort((a, b) => b.date - a.date);
      
    } catch (error) {
      Logger.error('BACKUPS', 'Error getting backups list', error);
      throw error;
    }
  },
  
  /**
   * Initialize storage system
   * @returns {boolean} Success status
   */
  initialize: function() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // Create required sheets if they don't exist
      Object.values(CONFIG.SHEETS).forEach(sheetName => {
        if (!ss.getSheetByName(sheetName)) {
          const sheet = ss.insertSheet(sheetName);
          
          // Set up headers based on sheet type
          if (sheetName === CONFIG.SHEETS.DATA) {
            sheet.getRange(1, 1, 1, 12).setValues([[
              'URL',
              'Name',
              'Description',
              'Price',
              'Currency',
              'Category',
              'Subcategory',
              'Brand',
              'Specifications',
              'Images',
              'Timestamp',
              'Status'
            ]]);
          } else if (sheetName === CONFIG.SHEETS.LOGS) {
            sheet.getRange(1, 1, 1, 5).setValues([[
              'Timestamp',
              'Level',
              'Category',
              'Message',
              'Error'
            ]]);
          }
        }
      });
      
      Logger.info('STORAGE', 'Storage system initialized');
      return true;
      
    } catch (error) {
      Logger.error('STORAGE', 'Error initializing storage', error);
      return false;
    }
  }
};

// Export the Storage system
this.Storage = Storage;
