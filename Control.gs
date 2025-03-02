/**
 * AI Product Extractor - Process Control Module
 * Version: 3.1.0
 * 
 * Manages the state and control flow of the extraction process,
 * including starting, pausing, resuming, and stopping operations.
 */

/**
 * Enum for process states
 */
const ProcessState = { 
  RUNNING: 'RUNNING', 
  PAUSED: 'PAUSED', 
  STOPPED: 'STOPPED', 
  COMPLETED: 'COMPLETED', 
  ERROR: 'ERROR' 
};

/**
 * Reset all progress tracking
 */
function resetProgress() {
  const props = PropertiesService.getScriptProperties();
  const ui = SpreadsheetApp.getUi();
  
  try {
    Logger.info('RESET_PROGRESS', 'Resetting progress...');
    
    // Ask for confirmation
    const response = ui.alert(
      'Reset Progress', 
      'This will reset all extraction progress. Are you sure?', 
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      Logger.info('RESET_PROGRESS', 'Reset cancelled by user');
      return false;
    }
    
    // Delete all state-related properties
    props.deleteProperty("STATUS");
    props.deleteProperty("CURRENT_ROW");
    props.deleteProperty("TOTAL_ROWS");
    props.deleteProperty("START_TIME");
    props.deleteProperty("COMPLETED_COUNT");
    props.deleteProperty("ERROR_COUNT");
    props.deleteProperty("TRIGGER_ID");
    
    // Cancel any active triggers
    cancelTriggers();
    
    // Clear status column in the data sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.DATA);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) { // If there's data (excluding header)
        sheet.getRange(2, 14, lastRow - 1, 1).setValue(""); // Status column (N)
      }
    }
    
    Logger.info('RESET_PROGRESS', 'Progress reset successfully');
    ui.alert('Success', 'Progress has been reset successfully.', ui.ButtonSet.OK);
    return true;
  } catch (error) {
    Logger.error('RESET_ERROR', 'Failed to reset progress', error);
    ui.alert('Error', 'Failed to reset progress: ' + error.message, ui.ButtonSet.OK);
    return false;
  }
}

/**
 * Get the current process state
 * @returns {Object} Current process state and information
 */
function getProcessState() {
  const props = PropertiesService.getScriptProperties();
  return {
    status: props.getProperty("STATUS") || ProcessState.STOPPED,
    currentRow: Number(props.getProperty("CURRENT_ROW") || 0),
    totalRows: Number(props.getProperty("TOTAL_ROWS") || 0),
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Update the processing state with validation
 * @param {string} newState - New state from ProcessState enum
 */
function updateProcessingState(newState) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait for up to 30 seconds for the lock
    const props = PropertiesService.getScriptProperties();
    const current = props.getProperty("STATUS") || ProcessState.STOPPED;

    // Define valid state transitions to prevent invalid state changes
    const validTransitions = {
      [ProcessState.STOPPED]: [ProcessState.RUNNING],
      [ProcessState.RUNNING]: [ProcessState.PAUSED, ProcessState.STOPPED, ProcessState.COMPLETED, ProcessState.ERROR],
      [ProcessState.PAUSED]: [ProcessState.RUNNING, ProcessState.STOPPED],
      [ProcessState.COMPLETED]: [ProcessState.STOPPED, ProcessState.RUNNING],
      [ProcessState.ERROR]: [ProcessState.STOPPED, ProcessState.RUNNING]
    };

    // Validate the state transition
    if (!validTransitions[current] || !validTransitions[current].includes(newState)) {
      const error = new Error(`Invalid state transition: ${current} → ${newState}`);
      Logger.error('STATE_ERROR', error.message, error);
      throw error;
    }

    // Set the new state
    props.setProperty("STATUS", newState);
    
    // Add timestamps for certain transitions
    if (newState === ProcessState.RUNNING && current !== ProcessState.PAUSED) {
      props.setProperty("START_TIME", new Date().toISOString());
    }
    
    Logger.info('STATE_CHANGE', `Processing state updated: ${current} → ${newState}`);
  } catch (error) {
    if (error.message.includes('Invalid state transition')) {
      // This is already logged above
      throw error;
    } else {
      Logger.error('STATE_LOCK', 'Failed to update processing state', error);
      throw new Error(`Failed to update processing state: ${error.message}`);
    }
  } finally {
    try {
      lock.releaseLock();
    } catch (lockError) {
      Logger.warn('STATE_LOCK', 'Failed to release lock', lockError);
    }
  }
}

/**
 * Start the extraction process
 * @returns {boolean} Success status
 */
function startProcessing() {
  try {
    // Get current state
    const currentState = getProcessState().status;
    
    // Only allow starting if currently STOPPED or COMPLETED or ERROR
    if (![ProcessState.STOPPED, ProcessState.COMPLETED, ProcessState.ERROR].includes(currentState)) {
      Logger.warn('START_PROCESSING', `Cannot start processing when in ${currentState} state`);
      return false;
    }
    
    // Initialize values
    const props = PropertiesService.getScriptProperties();
    props.setProperty("CURRENT_ROW", "2"); // Start from row 2 (after header)
    props.setProperty("COMPLETED_COUNT", "0");
    props.setProperty("ERROR_COUNT", "0");
    props.setProperty("START_TIME", new Date().toISOString());
    
    // Update state to RUNNING
    updateProcessingState(ProcessState.RUNNING);
    
    Logger.info('START_PROCESSING', 'Processing started successfully');
    return true;
  } catch (error) {
    Logger.error('START_ERROR', 'Failed to start processing', error);
    throw new Error('Error starting processing: ' + error.message);
  }
}

/**
 * Pause the extraction process
 * @returns {boolean} Success status
 */
function pauseProcessing() {
  try {
    // Get current state
    const currentState = getProcessState().status;
    
    // Only allow pausing if currently RUNNING
    if (currentState !== ProcessState.RUNNING) {
      Logger.warn('PAUSE_PROCESSING', `Cannot pause processing when in ${currentState} state`);
      return false;
    }
    
    // Update state to PAUSED
    updateProcessingState(ProcessState.PAUSED);
    
    // Cancel any running triggers
    cancelTriggers();
    
    Logger.info('PAUSE_PROCESSING', 'Processing paused successfully');
    return true;
  } catch (error) {
    Logger.error('PAUSE_ERROR', 'Failed to pause processing', error);
    throw new Error('Error pausing processing: ' + error.message);
  }
}

/**
 * Resume the extraction process
 * @returns {boolean} Success status
 */
function resumeProcessing() {
  try {
    // Get current state
    const currentState = getProcessState().status;
    
    // Only allow resuming if currently PAUSED
    if (currentState !== ProcessState.PAUSED) {
      Logger.warn('RESUME_PROCESSING', `Cannot resume processing when in ${currentState} state`);
      return false;
    }
    
    // Update state to RUNNING
    updateProcessingState(ProcessState.RUNNING);
    
    Logger.info('RESUME_PROCESSING', 'Processing resumed successfully');
    return true;
  } catch (error) {
    Logger.error('RESUME_ERROR', 'Failed to resume processing', error);
    throw new Error('Error resuming processing: ' + error.message);
  }
}

/**
 * Stop the extraction process
 * @returns {boolean} Success status
 */
function stopProcessing() {
  try {
    // Get current state
    const currentState = getProcessState().status;
    
    // Only allow stopping if currently RUNNING, PAUSED, ERROR
    if (![ProcessState.RUNNING, ProcessState.PAUSED, ProcessState.ERROR].includes(currentState)) {
      Logger.warn('STOP_PROCESSING', `Cannot stop processing when in ${currentState} state`);
      return false;
    }
    
    // Update state to STOPPED
    updateProcessingState(ProcessState.STOPPED);
    
    // Cancel any running triggers
    cancelTriggers();
    
    Logger.info('STOP_PROCESSING', 'Processing stopped successfully');
    return true;
  } catch (error) {
    Logger.error('STOP_ERROR', 'Failed to stop processing', error);
    throw new Error('Error stopping processing: ' + error.message);
  }
}

/**
 * Cancel all triggers for the current project
 */
function cancelTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'processNextBatch') {
        ScriptApp.deleteTrigger(triggers[i]);
        Logger.debug('TRIGGER', 'Deleted trigger for processNextBatch');
      }
    }
  } catch (error) {
    Logger.error('TRIGGER_ERROR', 'Failed to cancel triggers', error);
  }
}

// Export the functions and constants
this.ProcessState = ProcessState;
this.resetProgress = resetProgress;
this.getProcessState = getProcessState;
this.updateProcessingState = updateProcessingState;
this.startProcessing = startProcessing;
this.pauseProcessing = pauseProcessing;
this.resumeProcessing = resumeProcessing;
this.stopProcessing = stopProcessing;
this.cancelTriggers = cancelTriggers;