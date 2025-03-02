/**
 * AI Product Extractor - UI Management
 * Version: 3.1.0
 * 
 * Handles UI rendering and interaction for the product extractor
 */

/**
 * Create HTML template with standard layout
 * 
 * @param {string} title - Page title
 * @param {string} content - Page content
 * @param {boolean} includeNavbar - Whether to include navigation
 * @return {HtmlOutput} HTML output
 */
function createHtmlTemplate(title, content, includeNavbar = true) {
  // Common CSS styles
  const css = `
    /* Common styles */
    :root {
      --color-primary: #2196F3;
      --color-primary-dark: #1976D2;
      --color-primary-light: #BBDEFB;
      --color-accent: #FF4081;
      --color-text: #333;
      --color-text-light: #666;
      --color-background: #F5F5F5;
      --color-card: #FFF;
      --color-success: #4CAF50;
      --color-warning: #FFC107;
      --color-error: #F44336;
      --spacing-unit: 8px;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', 'Roboto', 'Helvetica Neue', sans-serif;
      background-color: var(--color-background);
      color: var(--color-text);
      line-height: 1.6;
      padding: 0;
      margin: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: calc(var(--spacing-unit) * 3);
    }
    
    .navbar {
      background-color: var(--color-primary);
      color: white;
      padding: calc(var(--spacing-unit) * 2);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .navbar-brand {
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
      text-decoration: none;
      display: flex;
      align-items: center;
    }
    
    .navbar-brand i {
      margin-right: calc(var(--spacing-unit));
    }
    
    .navbar-nav {
      display: flex;
      gap: calc(var(--spacing-unit) * 2);
    }
    
    .nav-link {
      color: white;
      text-decoration: none;
      transition: opacity 0.3s;
      padding: calc(var(--spacing-unit));
    }
    
    .nav-link:hover {
      opacity: 0.8;
    }
    
    .card {
      background-color: var(--color-card);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: calc(var(--spacing-unit) * 3);
      margin-bottom: calc(var(--spacing-unit) * 3);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: calc(var(--spacing-unit) * 2);
      border-bottom: 1px solid #eee;
      padding-bottom: calc(var(--spacing-unit) * 2);
    }
    
    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .btn {
      display: inline-block;
      background-color: var(--color-primary);
      color: white;
      padding: calc(var(--spacing-unit)) calc(var(--spacing-unit) * 2);
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.3s, transform 0.2s;
    }
    
    .btn:hover {
      background-color: var(--color-primary-dark);
      transform: translateY(-2px);
    }
    
    .btn:active {
      transform: translateY(0);
    }
    
    .btn-secondary {
      background-color: #757575;
    }
    
    .btn-secondary:hover {
      background-color: #616161;
    }
    
    .btn-success {
      background-color: var(--color-success);
    }
    
    .btn-success:hover {
      background-color: #388E3C;
    }
    
    .btn-warning {
      background-color: var(--color-warning);
      color: #333;
    }
    
    .btn-warning:hover {
      background-color: #FFA000;
    }
    
    .btn-danger {
      background-color: var(--color-error);
    }
    
    .btn-danger:hover {
      background-color: #D32F2F;
    }
    
    .form-group {
      margin-bottom: calc(var(--spacing-unit) * 2);
    }
    
    .form-label {
      display: block;
      margin-bottom: calc(var(--spacing-unit));
      font-weight: 500;
    }
    
    .form-control {
      width: 100%;
      padding: calc(var(--spacing-unit));
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-control:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }
    
    .alert {
      padding: calc(var(--spacing-unit) * 2);
      border-radius: 4px;
      margin-bottom: calc(var(--spacing-unit) * 2);
    }
    
    .alert-success {
      background-color: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.2);
      color: #388E3C;
    }
    
    .alert-warning {
      background-color: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.2);
      color: #FFA000;
    }
    
    .alert-danger {
      background-color: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.2);
      color: #D32F2F;
    }
    
    .text-center {
      text-align: center;
    }
    
    .mb-1 {
      margin-bottom: calc(var(--spacing-unit));
    }
    
    .mb-2 {
      margin-bottom: calc(var(--spacing-unit) * 2);
    }
    
    .mb-3 {
      margin-bottom: calc(var(--spacing-unit) * 3);
    }
    
    .mt-1 {
      margin-top: calc(var(--spacing-unit));
    }
    
    .mt-2 {
      margin-top: calc(var(--spacing-unit) * 2);
    }
    
    .mt-3 {
      margin-top: calc(var(--spacing-unit) * 3);
    }
    
    /* Table styles */
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table th, .table td {
      padding: calc(var(--spacing-unit) * 1.5);
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    .table th {
      font-weight: 600;
      background-color: #f9f9f9;
    }
    
    .table tr:hover {
      background-color: #f5f5f5;
    }
    
    /* Loader */
    .loader {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(33, 150, 243, 0.3);
      border-radius: 50%;
      border-top-color: var(--color-primary);
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  
  // Navigation bar HTML
  let navbar = '';
  if (includeNavbar) {
    navbar = `
      <div class="navbar">
        <div class="navbar-container">
          <a href="#" class="navbar-brand" onclick="google.script.run.openDashboard(); return false;">
            <i class="fas fa-robot"></i> AI Extractor Pro
          </a>
          <div class="navbar-nav">
            <a href="#" class="nav-link" onclick="google.script.run.openDashboard(); return false;">Dashboard</a>
            <a href="#" class="nav-link" onclick="google.script.run.openDataCenter(); return false;">Data Center</a>
            <a href="#" class="nav-link" onclick="google.script.run.openStrykeCenter(); return false;">Stryke Center</a>
            <a href="#" class="nav-link" onclick="google.script.run.showSettings(); return false;">Settings</a>
          </div>
        </div>
      </div>
    `;
  }
  
  // Create full HTML
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - AI Extractor Pro</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
      <style>${css}</style>
    </head>
    <body>
      ${navbar}
      <div class="container">
        ${content}
      </div>
      
      <script>
        // Common UI functionality
        function showAlert(message, type = 'success') {
          const alertElement = document.createElement('div');
          alertElement.className = "alert alert-" + type;
          alertElement.textContent = message;
          
          // Get container
          const container = document.querySelector('.container');
          container.insertBefore(alertElement, container.firstChild);
          
          // Auto remove after 5 seconds
          setTimeout(() => {
            alertElement.remove();
          }, 5000);
        }
        
        // Show loading indicator on buttons when clicked
        document.addEventListener('click', function(e) {
          if (e.target.matches('.btn[data-loading]')) {
            const button = e.target;
            const originalText = button.textContent;
            button.disabled = true;
            
            // Show loader
            const loader = document.createElement('span');
            loader.className = 'loader';
            button.textContent = '';
            button.appendChild(loader);
            button.appendChild(document.createTextNode(' ' + button.getAttribute('data-loading')));
            
            // Reset after timeout (fallback if operation fails)
            setTimeout(() => {
              if (button.disabled) {
                button.textContent = originalText;
                button.disabled = false;
              }
            }, 30000);
          }
        });
      </script>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * Generate the status dashboard UI
 * 
 * @return {string} HTML for status dashboard
 */
function generateStatusDashboard() {
  // Get current process status
  const status = getDetailedStatus();
  const apiKeys = ApiKeys.getKeyStatus();
  
  // Status card
  let statusCard = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Extraction Status</h2>
        <div>
          <button id="refreshStatus" class="btn btn-secondary">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>
      
      <div class="status-info mb-3">
        <div class="status-item">
          <strong>Current Status:</strong> <span id="currentStatus">${status.status}</span>
        </div>
        <div class="status-item">
          <strong>Progress:</strong> <span id="progressPercentage">${status.progress}%</span>
        </div>
        <div class="status-item">
          <strong>Processed:</strong> <span id="processedCount">${status.currentRow - 2} / ${status.totalRows}</span>
        </div>
        <div class="status-item">
          <strong>Processing Speed:</strong> <span id="processingSpeed">${status.processingSpeed} items/minute</span>
        </div>
        <div class="status-item">
          <strong>Estimated Time Remaining:</strong> <span id="timeRemaining">${status.estimatedTimeRemaining}</span>
        </div>
      </div>
      
      <div class="status-progress mb-3">
        <div class="progress">
          <div id="progressBar" class="progress-bar" style="width: ${status.progress}%"></div>
        </div>
      </div>
      
      <div class="status-actions">
  `;
  
  // Add different buttons based on current status
  if (status.status === ProcessState.RUNNING) {
    statusCard += `
      <button id="pauseBtn" class="btn btn-warning" data-loading="Pausing...">
        <i class="fas fa-pause"></i> Pause Extraction
      </button>
      <button id="stopBtn" class="btn btn-danger" data-loading="Stopping...">
        <i class="fas fa-stop"></i> Stop Extraction
      </button>
    `;
  } else if (status.status === ProcessState.PAUSED) {
    statusCard += `
      <button id="resumeBtn" class="btn btn-primary" data-loading="Resuming...">
        <i class="fas fa-play"></i> Resume Extraction
      </button>
      <button id="stopBtn" class="btn btn-danger" data-loading="Stopping...">
        <i class="fas fa-stop"></i> Stop Extraction
      </button>
    `;
  } else {
    statusCard += `
      <button id="startBtn" class="btn btn-success" data-loading="Starting...">
        <i class="fas fa-play"></i> Start Extraction
      </button>
      <button id="resetBtn" class="btn btn-danger" data-loading="Resetting...">
        <i class="fas fa-redo"></i> Reset Progress
      </button>
    `;
  }
  
  statusCard += `
      </div>
    </div>
  `;
  
  // Recent errors card
  let errorsCard = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Recent Errors</h2>
      </div>
  `;
  
  if (status.recentErrors && status.recentErrors.length > 0) {
    errorsCard += `
      <table class="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Category</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    status.recentErrors.forEach(error => {
      errorsCard += `
        <tr>
          <td>${new Date(error.timestamp).toLocaleTimeString()}</td>
          <td>${error.category}</td>
          <td>${error.message}</td>
        </tr>
      `;
    });
    
    errorsCard += `
        </tbody>
      </table>
    `;
  } else {
    errorsCard += `
      <div class="text-center mb-3 mt-3">
        <p>No recent errors.</p>
      </div>
    `;
  }
  
  errorsCard += `</div>`;
  
  // API Keys status card
  let apiKeysCard = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">API Keys</h2>
        <div>
          <button id="configureApiKeys" class="btn">
            <i class="fas fa-key"></i> Configure
          </button>
        </div>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  for (const [key, info] of Object.entries(apiKeys)) {
    apiKeysCard += `
      <tr>
        <td>${info.name}</td>
        <td>${info.exists ? '<span class="text-success"><i class="fas fa-check"></i> Configured</span>' : '<span class="text-danger"><i class="fas fa-times"></i> Not Configured</span>'}</td>
        <td>${info.lastUpdated}</td>
      </tr>
    `;
  }
  
  apiKeysCard += `
        </tbody>
      </table>
    </div>
  `;
  
  // Quick actions card
  const quickActionsCard = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Quick Actions</h2>
      </div>
      
      <div class="quick-actions">
        <button id="openDataCenterBtn" class="btn">
          <i class="fas fa-database"></i> Data Center
        </button>
        <button id="openStrykeCenterBtn" class="btn">
          <i class="fas fa-bolt"></i> Stryke Center
        </button>
        <button id="showLogsBtn" class="btn">
          <i class="fas fa-list"></i> View Logs
        </button>
        <button id="showSettingsBtn" class="btn">
          <i class="fas fa-cog"></i> Settings
        </button>
      </div>
    </div>
  `;
  
  // CSS styles specific to this page
  const styles = `
    <style>
      .status-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }
      
      .status-item {
        background-color: rgba(33, 150, 243, 0.05);
        padding: 12px;
        border-radius: 6px;
      }
      
      .progress {
        height: 24px;
        background-color: #e0e0e0;
        border-radius: 12px;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        background-color: var(--color-primary);
        border-radius: 12px;
        transition: width 0.3s ease;
      }
      
      .status-actions, .quick-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .text-success {
        color: var(--color-success);
      }
      
      .text-danger {
        color: var(--color-error);
      }
      
      @media (max-width: 768px) {
        .status-info {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;
  
  // JavaScript for the dashboard
  const script = `
    <script>
      // Initialize dashboard
      document.addEventListener('DOMContentLoaded', function() {
        // Setup refresh button
        document.getElementById('refreshStatus').addEventListener('click', function() {
          updateDashboard();
        });
        
        // Setup action buttons
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
          startBtn.addEventListener('click', function() {
            google.script.run
              .withSuccessHandler(handleStartSuccess)
              .withFailureHandler(handleActionError)
              .startExtraction();
          });
        }
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
          pauseBtn.addEventListener('click', function() {
            google.script.run
              .withSuccessHandler(handlePauseSuccess)
              .withFailureHandler(handleActionError)
              .pauseProcessing();
          });
        }
        
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
          resumeBtn.addEventListener('click', function() {
            google.script.run
              .withSuccessHandler(handleResumeSuccess)
              .withFailureHandler(handleActionError)
              .resumeProcessing();
          });
        }
        
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
          stopBtn.addEventListener('click', function() {
            google.script.run
              .withSuccessHandler(handleStopSuccess)
              .withFailureHandler(handleActionError)
              .stopProcessing();
          });
        }
        
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
          resetBtn.addEventListener('click', function() {
            google.script.run
              .withSuccessHandler(handleResetSuccess)
              .withFailureHandler(handleActionError)
              .resetProgress();
          });
        }
        
        // Setup quick action buttons
        document.getElementById('openDataCenterBtn').addEventListener('click', function() {
          google.script.run.openDataCenter();
        });
        
        document.getElementById('openStrykeCenterBtn').addEventListener('click', function() {
          google.script.run.openStrykeCenter();
        });
        
        document.getElementById('showLogsBtn').addEventListener('click', function() {
          google.script.run.showLogs();
        });
        
        document.getElementById('showSettingsBtn').addEventListener('click', function() {
          google.script.run.showSettings();
        });
        
        document.getElementById('configureApiKeys').addEventListener('click', function() {
          google.script.run.showApiKeyConfig();
        });
        
        // Auto-refresh status every 30 seconds
        setInterval(updateDashboard, 30000);
      });
      
      // Update dashboard with latest status
      function updateDashboard() {
        google.script.run
          .withSuccessHandler(updateStatusInfo)
          .withFailureHandler(handleUpdateError)
          .getDetailedStatus();
      }
      
      // Update status display with new data
      function updateStatusInfo(status) {
        document.getElementById('currentStatus').textContent = status.status;
        document.getElementById('progressPercentage').textContent = status.progress + '%';
        document.getElementById('processedCount').textContent = (status.currentRow - 2) + ' / ' + status.totalRows;
        document.getElementById('processingSpeed').textContent = status.processingSpeed + ' items/minute';
        document.getElementById('timeRemaining').textContent = status.estimatedTimeRemaining;
        document.getElementById('progressBar').style.width = status.progress + '%';
      }
      
      // Handle success responses from actions
      function handleStartSuccess(result) {
        showAlert('Extraction process started successfully', 'success');
        setTimeout(function() {
          window.location.reload();
        }, 2000);
      }
      
      function handlePauseSuccess() {
        showAlert('Extraction paused successfully', 'success');
        setTimeout(function() {
          window.location.reload();
        }, 2000);
      }
      
      function handleResumeSuccess() {
        showAlert('Extraction resumed successfully', 'success');
        setTimeout(function() {
          window.location.reload();
        }, 2000);
      }
      
      function handleStopSuccess() {
        showAlert('Extraction stopped successfully', 'success');
        setTimeout(function() {
          window.location.reload();
        }, 2000);
      }
      
      function handleResetSuccess() {
        showAlert('Progress reset successfully', 'success');
        setTimeout(function() {
          window.location.reload();
        }, 2000);
      }
      
      // Handle errors
      function handleActionError(error) {
        showAlert('Error: ' + error.message, 'danger');
        
        // Reset buttons
        document.querySelectorAll('.btn[disabled]').forEach(function(btn) {
          btn.disabled = false;
          btn.innerHTML = btn.innerHTML.split(' ')[0]; // Remove "Loading..." text
        });
      }
      
      function handleUpdateError(error) {
        console.error('Error updating status:', error);
      }
    </script>
  `;
  
  // Combine all components
  return statusCard + errorsCard + apiKeysCard + quickActionsCard + styles + script;
}

/**
 * Get HTML for API Key Configuration page
 * @returns {string} HTML for API Key Configuration
 */
function generateApiKeyConfigHtml() {
  // Get current API key status
  const apiKeys = ApiKeys.getKeyStatus();
  
  const html = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">API Key Configuration</h2>
      </div>
      
      <div class="mb-3">
        <p>Configure API keys for external services used by AI Extractor Pro.</p>
      </div>
      
      <form id="apiKeyForm">
        <div class="form-group">
          <label for="azureOpenaiKey" class="form-label">Azure OpenAI API Key</label>
          <div class="input-group">
            <input type="password" id="azureOpenaiKey" class="form-control" placeholder="Enter Azure OpenAI API Key" value="${apiKeys.AZURE_OPENAI_KEY.masked}">
            <button type="button" class="btn btn-secondary" data-toggle="password" data-target="#azureOpenaiKey">
              <i class="fas fa-eye"></i>
            </button>
            <button type="button" class="btn" data-test="AZURE_OPENAI_KEY">Test</button>
          </div>
          <div class="input-help">This key is used for AI-powered extraction and analysis.</div>
        </div>
        
        <div class="form-group">
          <label for="azureBingKey" class="form-label">Azure Bing Search API Key</label>
          <div class="input-group">
            <input type="password" id="azureBingKey" class="form-control" placeholder="Enter Azure Bing Search API Key" value="${apiKeys.AZURE_BING_KEY.masked}">
            <button type="button" class="btn btn-secondary" data-toggle="password" data-target="#azureBingKey">
              <i class="fas fa-eye"></i>
            </button>
            <button type="button" class="btn" data-test="AZURE_BING_KEY">Test</button>
          </div>
          <div class="input-help">This key is used for enhanced search capabilities.</div>
        </div>
        
        <div class="form-group">
          <label for="azureOpenaiEndpoint" class="form-label">Azure OpenAI Endpoint</label>
          <input type="text" id="azureOpenaiEndpoint" class="form-control" placeholder="https://your-resource.openai.azure.com/">
        </div>
        
        <div class="form-group">
          <label for="azureOpenaiDeployment" class="form-label">Azure OpenAI Deployment Name</label>
          <input type="text" id="azureOpenaiDeployment" class="form-control" placeholder="gpt-4-turbo">
        </div>
        
        <div id="apiKeyFeedback" class="mb-3"></div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" data-loading="Saving...">Save API Keys</button>
          <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
        </div>
      </form>
    </div>
    
    <style>
      .input-group {
        display: flex;
        gap: 8px;
      }
      
      .input-help {
        font-size: 12px;
        color: var(--color-text-light);
        margin-top: 4px;
      }
      
      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
    </style>
    
    <script>
      // Initialize page
      document.addEventListener('DOMContentLoaded', function() {
        // Password toggle buttons
        document.querySelectorAll('[data-toggle="password"]').forEach(button => {
          button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const inputField = document.querySelector(targetId);
            
            if (inputField.type === 'password') {
              inputField.type = 'text';
              this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
              inputField.type = 'password';
              this.innerHTML = '<i class="fas fa-eye"></i>';
            }
          });
        });
        
        // API key test buttons
        document.querySelectorAll('[data-test]').forEach(button => {
          button.addEventListener('click', function() {
            const service = this.getAttribute('data-test');
            let keyValue;
            
            if (service === 'AZURE_OPENAI_KEY') {
              keyValue = document.getElementById('azureOpenaiKey').value;
            } else if (service === 'AZURE_BING_KEY') {
              keyValue = document.getElementById('azureBingKey').value;
            }
            
            if (!keyValue) {
              showFeedback('Please enter an API key to test.', 'warning');
              return;
            }
            
            // Disable button and show loading
            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="loader"></span> Testing...';
            
            // Test the API key
            google.script.run
              .withSuccessHandler(result => {
                this.disabled = false;
                this.innerHTML = originalText;
                
                if (result.success) {
                  showFeedback(result.message, 'success');
                } else {
                  showFeedback(result.message, 'danger');
                }
              })
              .withFailureHandler(error => {
                this.disabled = false;
                this.innerHTML = originalText;
                showFeedback('Error testing API key: ' + error.message, 'danger');
              })
              .testApiKey(service, keyValue);
          });
        });
        
        // Load endpoint and deployment info
        google.script.run
          .withSuccessHandler(values => {
            if (values.endpoint) {
              document.getElementById('azureOpenaiEndpoint').value = values.endpoint;
            }
            if (values.deployment) {
              document.getElementById('azureOpenaiDeployment').value = values.deployment;
            }
          })
          .getApiConfigValues();
        
        // Form submission
        document.getElementById('apiKeyForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const openaiKey = document.getElementById('azureOpenaiKey').value;
          const bingKey = document.getElementById('azureBingKey').value;
          const openaiEndpoint = document.getElementById('azureOpenaiEndpoint').value;
          const openaiDeployment = document.getElementById('azureOpenaiDeployment').value;
          
          // Disable submit button and show loading
          const submitBtn = this.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          
          // Save API keys
          const savePromises = [];
          
          if (openaiKey && !openaiKey.includes('****')) {
            savePromises.push(
              new Promise((resolve, reject) => {
                google.script.run
                  .withSuccessHandler(resolve)
                  .withFailureHandler(reject)
                  .saveApiKey('AZURE_OPENAI_KEY', openaiKey);
              })
            );
          }
          
          if (bingKey && !bingKey.includes('****')) {
            savePromises.push(
              new Promise((resolve, reject) => {
                google.script.run
                  .withSuccessHandler(resolve)
                  .withFailureHandler(reject)
                  .saveApiKey('AZURE_BING_KEY', bingKey);
              })
            );
          }
          
          // Save endpoint and deployment
          if (openaiEndpoint) {
            savePromises.push(
              new Promise((resolve, reject) => {
                google.script.run
                  .withSuccessHandler(resolve)
                  .withFailureHandler(reject)
                  .saveApiConfig('AZURE_OPENAI_ENDPOINT', openaiEndpoint);
              })
            );
          }
          
          if (openaiDeployment) {
            savePromises.push(
              new Promise((resolve, reject) => {
                google.script.run
                  .withSuccessHandler(resolve)
                  .withFailureHandler(reject)
                  .saveApiConfig('AZURE_OPENAI_DEPLOYMENT', openaiDeployment);
              })
            );
          }
          
          // Handle all save operations
          Promise.all(savePromises)
            .then(results => {
              submitBtn.disabled = false;
              showFeedback('API Keys saved successfully!', 'success');
            })
            .catch(error => {
              submitBtn.disabled = false;
              showFeedback('Error saving API keys: ' + error.message, 'danger');
            });
        });
        
        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', function() {
          google.script.host.close();
        });
      });
      
      // Show feedback message
      function showFeedback(message, type) {
        const feedbackElement = document.getElementById('apiKeyFeedback');
        feedbackElement.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
        
        // Scroll to feedback
        feedbackElement.scrollIntoView({ behavior: 'smooth' });
      }
    </script>
  `;
  
  return html;
}

/**
 * Generate HTML for Settings page
 * @returns {string} HTML for Settings page
 */
function generateSettingsHtml() {
  // Get current settings
  const settings = {
    batchSize: CONFIG.PROCESSING.BATCH_SIZE,
    maxRetries: CONFIG.PROCESSING.MAX_RETRIES,
    cacheEnabled: CONFIG.CACHE.ENABLED,
    cacheDuration: CONFIG.CACHE.DURATION
  };
  
  const html = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Settings</h2>
      </div>
      
      <form id="settingsForm">
        <div class="settings-section mb-3">
          <h3 class="section-title">Processing Settings</h3>
          
          <div class="form-group">
            <label for="batchSize" class="form-label">Batch Size</label>
            <input type="number" id="batchSize" class="form-control" min="1" max="20" value="${settings.batchSize}">
            <div class="input-help">Number of URLs to process in each batch (1-20)</div>
          </div>
          
          <div class="form-group">
            <label for="maxRetries" class="form-label">Max Retries</label>
            <input type="number" id="maxRetries" class="form-control" min="1" max="10" value="${settings.maxRetries}">
            <div class="input-help">Maximum number of retry attempts for failed requests</div>
          </div>
        </div>
        
        <div class="settings-section mb-3">
          <h3 class="section-title">Cache Settings</h3>
          
          <div class="form-group">
            <label class="form-label">Cache Enabled</label>
            <div class="checkbox-wrapper">
              <input type="checkbox" id="cacheEnabled" ${settings.cacheEnabled ? 'checked' : ''}>
              <label for="cacheEnabled">Enable caching of extraction results</label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="cacheDuration" class="form-label">Cache Duration (seconds)</label>
            <input type="number" id="cacheDuration" class="form-control" min="60" max="86400" value="${settings.cacheDuration}">
            <div class="input-help">How long to keep cached results (60-86400 seconds)</div>
          </div>
          
          <div class="form-group">
            <button type="button" id="clearCacheBtn" class="btn btn-warning">
              <i class="fas fa-trash"></i> Clear Cache
            </button>
          </div>
        </div>
        
        <div class="settings-section mb-3">
          <h3 class="section-title">System</h3>
          
          <div class="form-group">
            <button type="button" id="clearLogsBtn" class="btn btn-warning">
              <i class="fas fa-trash"></i> Clear Logs
            </button>
          </div>
        </div>
        
        <div id="settingsFeedback" class="mb-3"></div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" data-loading="Saving...">Save Settings</button>
          <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
        </div>
      </form>
    </div>
    
    <style>
      .settings-section {
        border-bottom: 1px solid #eee;
        padding-bottom: 20px;
        margin-bottom: 20px;
      }
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--color-primary);
      }
      
      .checkbox-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      .input-help {
        font-size: 12px;
        color: var(--color-text-light);
        margin-top: 4px;
      }
    </style>
    
    <script>
      // Initialize page
      document.addEventListener('DOMContentLoaded', function() {
        // Form submission
        document.getElementById('settingsForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Get form values
          const settings = {
            batchSize: parseInt(document.getElementById('batchSize').value),
            maxRetries: parseInt(document.getElementById('maxRetries').value),
            cacheEnabled: document.getElementById('cacheEnabled').checked,
            cacheDuration: parseInt(document.getElementById('cacheDuration').value)
          };
          
          // Validate settings
          if (settings.batchSize < 1 || settings.batchSize > 20) {
            showFeedback('Batch size must be between 1 and 20', 'danger');
            return;
          }
          
          if (settings.maxRetries < 1 || settings.maxRetries > 10) {
            showFeedback('Max retries must be between 1 and 10', 'danger');
            return;
          }
          
          if (settings.cacheDuration < 60 || settings.cacheDuration > 86400) {
            showFeedback('Cache duration must be between 60 and 86400 seconds', 'danger');
            return;
          }
          
          // Disable submit button and show loading
          const submitBtn = this.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          
          // Save settings
          google.script.run
            .withSuccessHandler(result => {
              submitBtn.disabled = false;
              
              if (result.success) {
                showFeedback('Settings saved successfully!', 'success');
              } else {
                showFeedback('Error saving settings: ' + result.message, 'danger');
              }
            })
            .withFailureHandler(error => {
              submitBtn.disabled = false;
              showFeedback('Error saving settings: ' + error.message, 'danger');
            })
            .saveSettings(settings);
        });
        
        // Clear cache button
        document.getElementById('clearCacheBtn').addEventListener('click', function() {
          const button = this;
          button.disabled = true;
          button.innerHTML = '<span class="loader"></span> Clearing...';
          
          google.script.run
            .withSuccessHandler(result => {
              button.disabled = false;
              button.innerHTML = '<i class="fas fa-trash"></i> Clear Cache';
              
              if (result.success) {
                showFeedback('Cache cleared successfully!', 'success');
              } else {
                showFeedback('Error clearing cache: ' + result.message, 'danger');
              }
            })
            .withFailureHandler(error => {
              button.disabled = false;
              button.innerHTML = '<i class="fas fa-trash"></i> Clear Cache';
              showFeedback('Error clearing cache: ' + error.message, 'danger');
            })
            .clearCache();
        });
        
        // Clear logs button
        document.getElementById('clearLogsBtn').addEventListener('click', function() {
          const button = this;
          button.disabled = true;
          button.innerHTML = '<span class="loader"></span> Clearing...';
          
          google.script.run
            .withSuccessHandler(result => {
              button.disabled = false;
              button.innerHTML = '<i class="fas fa-trash"></i> Clear Logs';
              
              if (result) {
                showFeedback('Logs cleared successfully!', 'success');
              } else {
                showFeedback('Error clearing logs', 'danger');
              }
            })
            .withFailureHandler(error => {
              button.disabled = false;
              button.innerHTML = '<i class="fas fa-trash"></i> Clear Logs';
              showFeedback('Error clearing logs: ' + error.message, 'danger');
            })
            .clearLogs();
        });
        
        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', function() {
          google.script.host.close();
        });
      });
      
      // Show feedback message
      function showFeedback(message, type) {
        const feedbackElement = document.getElementById('settingsFeedback');
        feedbackElement.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
        
        // Scroll to feedback
        feedbackElement.scrollIntoView({ behavior: 'smooth' });
      }
    </script>
  `;
  
  return html;
}

/**
 * Generate HTML for Stryke Center
 * @returns {string} HTML for Stryke Center
 */
function generateStrykeCenterHtml() {
  // Get configuration and status
  const config = getProcessingConfig() || {};
  
  const html = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Stryke Center - AI Processing</h2>
      </div>
      
      <div class="mb-3">
        <p>The Stryke Center is where the AI processing magic happens. Configure and monitor AI processing settings.</p>
      </div>
      
      <div class="stryke-center">
        <div class="tab-container">
          <div class="tab-buttons">
            <button class="tab-button active" data-tab="ai-config">
              <i class="fas fa-brain"></i> AI Configuration
            </button>
            <button class="tab-button" data-tab="processing">
              <i class="fas fa-cogs"></i> Processing
            </button>
            <button class="tab-button" data-tab="monitoring">
              <i class="fas fa-chart-line"></i> Monitoring
            </button>
          </div>

          <div class="tab-content">
            <!-- AI Configuration Tab -->
            <div id="ai-config" class="tab-pane active">
              <div class="settings-section">
                <h3 class="section-title">Model Settings</h3>
                <form id="aiSettingsForm">
                  <div class="form-group">
                    <label for="model" class="form-label">AI Model</label>
                    <select id="model" class="form-control">
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-35-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="temperature" class="form-label">Temperature</label>
                    <input type="range" id="temperature" class="form-control" 
                           min="0" max="1" step="0.1" value="${config.temperature || 0.7}">
                    <div class="range-value">${config.temperature || 0.7}</div>
                  </div>
                  
                  <div class="form-group">
                    <label for="maxTokens" class="form-label">Max Tokens</label>
                    <input type="number" id="maxTokens" class="form-control" 
                           min="1" max="4000" value="${config.maxTokens || 2000}">
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary" data-loading="Saving...">
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Processing Tab -->
            <div id="processing" class="tab-pane">
              <div class="settings-section">
                <h3 class="section-title">Processing Rules</h3>
                <form id="processingForm">
                  <div class="form-group">
                    <label for="batchSize" class="form-label">Batch Size</label>
                    <input type="number" id="batchSize" class="form-control" 
                           min="1" max="50" value="${config.batchSize || 10}">
                  </div>
                  
                  <div class="form-group">
                    <label for="retryAttempts" class="form-label">Retry Attempts</label>
                    <input type="number" id="retryAttempts" class="form-control" 
                           min="0" max="5" value="${config.retryAttempts || 3}">
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary" data-loading="Saving...">
                      Save Processing Rules
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Monitoring Tab -->
            <div id="monitoring" class="tab-pane">
              <div class="settings-section">
                <h3 class="section-title">Processing Statistics</h3>
                <div id="processingStats" class="stats-grid">
                  <!-- Stats will be populated via JavaScript -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .stryke-center {
        background: white;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .tab-container {
        padding: 20px;
      }
      
      .tab-buttons {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        border-bottom: 1px solid #eee;
        padding-bottom: 12px;
      }
      
      .tab-button {
        background: none;
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        font-weight: 500;
        color: var(--color-text-light);
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 2px solid transparent;
        transition: all 0.3s ease;
      }
      
      .tab-button.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }
      
      .tab-button i {
        font-size: 16px;
      }
      
      .tab-pane {
        display: none;
      }
      
      .tab-pane.active {
        display: block;
      }
      
      .range-value {
        text-align: center;
        margin-top: 4px;
        font-size: 14px;
        color: var(--color-text-light);
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      
      .stat-card {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: var(--color-primary);
        margin: 8px 0;
      }
      
      .stat-label {
        font-size: 14px;
        color: var(--color-text-light);
      }
    </style>

    <script>
      // Initialize page
      document.addEventListener('DOMContentLoaded', function() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
          button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active states
            document.querySelectorAll('.tab-button').forEach(btn => 
              btn.classList.remove('active')
            );
            document.querySelectorAll('.tab-pane').forEach(pane => 
              pane.classList.remove('active')
            );
            
            // Activate selected tab
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
          });
        });

        // Temperature range input
        const temperatureInput = document.getElementById('temperature');
        const rangeValue = temperatureInput.nextElementSibling;
        
        temperatureInput.addEventListener('input', function() {
          rangeValue.textContent = this.value;
        });

        // AI Settings form
        document.getElementById('aiSettingsForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const settings = {
            model: document.getElementById('model').value,
            temperature: parseFloat(document.getElementById('temperature').value),
            maxTokens: parseInt(document.getElementById('maxTokens').value)
          };
          
          const submitBtn = this.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          
          google.script.run
            .withSuccessHandler(() => {
              submitBtn.disabled = false;
              showAlert('AI settings saved successfully!', 'success');
            })
            .withFailureHandler(error => {
              submitBtn.disabled = false;
              showAlert('Error saving settings: ' + error.message, 'danger');
            })
            .saveAISettings(settings);
        });

        // Processing form
        document.getElementById('processingForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const settings = {
            batchSize: parseInt(document.getElementById('batchSize').value),
            retryAttempts: parseInt(document.getElementById('retryAttempts').value)
          };
          
          const submitBtn = this.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          
          google.script.run
            .withSuccessHandler(() => {
              submitBtn.disabled = false;
              showAlert('Processing rules saved successfully!', 'success');
            })
            .withFailureHandler(error => {
              submitBtn.disabled = false;
              showAlert('Error saving rules: ' + error.message, 'danger');
            })
            .saveProcessingRules(settings);
        });

        // Initialize monitoring stats
        updateMonitoringStats();
        // Update stats every 30 seconds
        setInterval(updateMonitoringStats, 30000);
      });

      // Update monitoring statistics
      function updateMonitoringStats() {
        google.script.run
          .withSuccessHandler(stats => {
            const statsContainer = document.getElementById('processingStats');
            statsContainer.innerHTML = renderStats(stats);
          })
          .withFailureHandler(error => {
            console.error('Error updating stats:', error);
          })
          .getProcessingStats();
      }

      // Render statistics cards
      function renderStats(stats) {
        return Object.entries(stats).map(([key, value]) => 
          '<div class="stat-card">' +
            '<div class="stat-value">' + value + '</div>' +
            '<div class="stat-label">' + formatLabel(key) + '</div>' +
          '</div>'
        ).join('');
      }

      // Format stat label
      function formatLabel(key) {
        return key
          .split(/(?=[A-Z])/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    </script>
  `;
  
  return html;
}

// Helper function to get processing configuration
function getProcessingConfig() {
  // Implement this function to return the current processing configuration
  return {
    temperature: 0.7,
    maxTokens: 2000,
    batchSize: 10,
    retryAttempts: 3
  };
}