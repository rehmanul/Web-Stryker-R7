/**
 * AI Product Extractor - Menu System
 * Version: 3.1.0
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // Create the main menu
  ui.createMenu('🤖 AI Extractor')
    .addItem('Open Dashboard', 'showDashboard')
    .addSeparator()
    .addSubMenu(ui.createMenu('Data Management')
      .addItem('Data Center', 'showDataCenter')
      .addItem('Stryke Center', 'showStrykeCenter')
      .addItem('View Logs', 'showLogs'))
    .addSeparator()
    .addItem('Settings', 'showSettings')
    .addItem('Configure API Keys', 'showApiKeyConfig')
    .addSeparator()
    .addSubMenu(ui.createMenu('Tests')
      .addItem('Run All Tests', 'runAllTests')
      .addItem('Test Components', 'testComponents')
      .addItem('Test API Configuration', 'testApiConfigurations')
      .addItem('Test Extraction', 'testExtraction'))
    .addToUi();
}

function showDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('AI Extractor Dashboard')
    .setWidth(900)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'AI Extractor Dashboard');
}

function showDataCenter() {
  const html = HtmlService.createHtmlOutputFromFile('DataCenter')
    .setTitle('Data Center')
    .setWidth(900)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Data Center');
}

function showStrykeCenter() {
  const html = HtmlService.createHtmlOutputFromFile('StrykeCenter')
    .setTitle('Stryke Center')
    .setWidth(900)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Stryke Center');
}

function showSettings() {
  const html = HtmlService.createHtmlOutputFromFile('Settings')
    .setTitle('Settings')
    .setWidth(600)
    .setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
}

function showApiKeyConfig() {
  const html = HtmlService.createHtmlOutputFromFile('ApiKeyConfig')
    .setTitle('API Key Configuration')
    .setWidth(600)
    .setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'API Key Configuration');
}

function showLogs() {
  const html = HtmlService.createHtmlOutputFromFile('Logs')
    .setTitle('System Logs')
    .setWidth(800)
    .setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'System Logs');
}

// Initialize the application
function initialize() {
  // Initialize properties with default values
  initializeDefaultProperties();
  
  // Initialize storage system
  Storage.initialize();
  
  // Initialize logger
  Logger.init(CONFIG.MONITORING.LOG_LEVEL);
  
  Logger.info('INIT', 'Application initialized successfully');
  return true;
}
