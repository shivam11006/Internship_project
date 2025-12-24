import React, { useState } from 'react';
import directoryService from './services/directoryService';
import './DirectoryIngestion.css';

function DirectoryIngestion() {
  const [activeTab, setActiveTab] = useState('quick-import');
  const [importType, setImportType] = useState('lawyers');
  
  // Quick import states
  const [quickFile, setQuickFile] = useState(null);
  const [quickPassword, setQuickPassword] = useState('');
  const [quickAutoApprove, setQuickAutoApprove] = useState(true);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [quickSuccess, setQuickSuccess] = useState('');
  
  // Advanced import states
  const [advancedFile, setAdvancedFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [fieldMapping, setFieldMapping] = useState({});
  const [suggestedMapping, setSuggestedMapping] = useState({});
  const [advancedPassword, setAdvancedPassword] = useState('');
  const [advancedAutoApprove, setAdvancedAutoApprove] = useState(true);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedError, setAdvancedError] = useState('');
  const [advancedSuccess, setAdvancedSuccess] = useState('');
  const [previewStep, setPreviewStep] = useState('upload'); // upload, preview, mapping, confirm
  
  // Import results
  const [importResults, setImportResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // ==================== QUICK IMPORT ====================

  const handleQuickFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuickFile(file);
      setQuickError('');
    }
  };

  const handleQuickImport = async () => {
    if (!quickFile) {
      setQuickError('Please select a file to import');
      return;
    }

    if (!quickPassword.trim()) {
      setQuickError('Please enter a default password');
      return;
    }

    setQuickLoading(true);
    setQuickError('');
    setQuickSuccess('');

    try {
      const result = importType === 'lawyers'
        ? await directoryService.quickImportLawyers(quickFile, quickPassword, quickAutoApprove)
        : await directoryService.quickImportNgos(quickFile, quickPassword, quickAutoApprove);

      if (result.success) {
        setQuickSuccess(`Successfully imported! ${result.data.successCount} records imported with ${result.data.failureCount} failures.`);
        setImportResults(result.data);
        setShowResults(true);
        setQuickFile(null);
        setQuickPassword('');
      } else {
        setQuickError(result.error);
      }
    } catch (error) {
      setQuickError('An unexpected error occurred during import.');
      console.error('Quick import error:', error);
    } finally {
      setQuickLoading(false);
    }
  };

  // ==================== ADVANCED IMPORT ====================

  const handleAdvancedFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdvancedFile(file);
      setPreviewError('');
      setCsvData([]);
      setCsvHeaders([]);
      setFieldMapping({});
      setSuggestedMapping({});
    }
  };

  // Parse CSV file on frontend
  const parseCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 1) {
            reject(new Error('CSV file is empty'));
            return;
          }

          // Parse headers from first line
          const headers = lines[0].split(',').map(h => h.trim());

          // Parse data rows
          const data = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            for (let j = 0; j < headers.length && j < values.length; j++) {
              row[headers[j]] = values[j];
            }
            data.push(row);
          }

          resolve({ headers, data });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handlePreviewCsv = async () => {
    if (!advancedFile) {
      setPreviewError('Please select a file to preview');
      return;
    }

    setPreviewLoading(true);
    setPreviewError('');

    try {
      // First parse CSV locally to get the data
      const { headers, data } = await parseCsvFile(advancedFile);
      
      if (data.length === 0) {
        setPreviewError('CSV file contains no data rows');
        setPreviewLoading(false);
        return;
      }

      // Then get suggested mapping from backend
      const result = await directoryService.previewCsv(advancedFile, importType.toUpperCase());

      if (result.success) {
        setCsvHeaders(headers);
        setCsvData(data);
        setSuggestedMapping(result.data.suggestedMapping || {});
        setFieldMapping(result.data.suggestedMapping || {});
        setPreviewStep('preview');
      } else {
        setPreviewError(result.error);
      }
    } catch (error) {
      setPreviewError('Failed to preview CSV file. Make sure it is in the correct format.');
      console.error('Preview error:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleMappingChange = (csvHeader, mappedField) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvHeader]: mappedField
    }));
  };

  const handleAdvancedImport = async () => {
    if (!csvData.length) {
      setAdvancedError('No CSV data to import');
      return;
    }

    if (!advancedPassword.trim()) {
      setAdvancedError('Please enter a default password');
      return;
    }

    // Ensure mapping is not empty - filter out skipped columns
    const validMapping = Object.keys(fieldMapping)
      .filter(key => fieldMapping[key]) // Only include mapped fields
      .reduce((acc, key) => {
        acc[key] = fieldMapping[key];
        return acc;
      }, {});

    setAdvancedLoading(true);
    setAdvancedError('');
    setAdvancedSuccess('');

    try {
      const result = importType === 'lawyers'
        ? await directoryService.importLawyersWithMapping(csvData, validMapping, advancedPassword, advancedAutoApprove)
        : await directoryService.importNgosWithMapping(csvData, validMapping, advancedPassword, advancedAutoApprove);

      if (result.success) {
        setAdvancedSuccess(`Successfully imported! ${result.data.successCount} records imported with ${result.data.failureCount} failures.`);
        setImportResults(result.data);
        setShowResults(true);
        resetAdvancedForm();
      } else {
        setAdvancedError(result.error);
      }
    } catch (error) {
      setAdvancedError('An unexpected error occurred during import.');
      console.error('Advanced import error:', error);
    } finally {
      setAdvancedLoading(false);
    }
  };

  const resetAdvancedForm = () => {
    setAdvancedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMapping({});
    setSuggestedMapping({});
    setAdvancedPassword('');
    setAdvancedAutoApprove(true);
    setPreviewStep('upload');
  };

  const resetQuickForm = () => {
    setQuickFile(null);
    setQuickPassword('');
    setQuickAutoApprove(true);
    setQuickError('');
    setQuickSuccess('');
  };

  // ==================== RENDER ====================

  return (
    <div className="directory-ingestion-container">
      <div className="ingestion-header">
        <h2 className="ingestion-title">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Directory Ingestion
        </h2>
        <p className="ingestion-subtitle">Import lawyers and NGOs into the directory in bulk</p>
      </div>

      {/* Import Type Selector */}
      <div className="import-type-selector">
        <button
          className={`type-btn ${importType === 'lawyers' ? 'active' : ''}`}
          onClick={() => {
            setImportType('lawyers');
            resetQuickForm();
            resetAdvancedForm();
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0" />
          </svg>
          <span>Import Lawyers</span>
        </button>
        <button
          className={`type-btn ${importType === 'ngos' ? 'active' : ''}`}
          onClick={() => {
            setImportType('ngos');
            resetQuickForm();
            resetAdvancedForm();
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Import NGOs</span>
        </button>
      </div>

      {/* Tab Selector */}
      <div className="ingestion-tabs">
        <button
          className={`tab-btn ${activeTab === 'quick-import' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick-import')}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Import
        </button>
        <button
          className={`tab-btn ${activeTab === 'advanced-import' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced-import')}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Advanced Import
        </button>
      </div>

      {/* QUICK IMPORT TAB */}
      {activeTab === 'quick-import' && (
        <div className="tab-content">
          <div className="import-card">
            <div className="card-header">
              <h3>Quick Import with Auto-Detection</h3>
              <p>Upload a CSV or Excel file and let the system auto-detect field mappings.</p>
            </div>

            <div className="form-section">
              <label className="form-label">Select File (CSV or Excel)</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="quick-file"
                  className="file-input"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleQuickFileSelect}
                />
                <label htmlFor="quick-file" className="file-label">
                  <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Click to upload or drag and drop</span>
                  <span className="file-hint">CSV, XLSX, or XLS</span>
                </label>
              </div>
              {quickFile && (
                <div className="file-selected">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{quickFile.name}</span>
                </div>
              )}
            </div>

            <div className="form-section">
              <label className="form-label">Default Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter default password for new accounts"
                value={quickPassword}
                onChange={(e) => setQuickPassword(e.target.value)}
              />
            </div>

            <div className="form-section checkbox-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={quickAutoApprove}
                  onChange={(e) => setQuickAutoApprove(e.target.checked)}
                />
                <span>Auto-approve imported accounts (accounts will be APPROVED upon import)</span>
              </label>
            </div>

            {quickError && (
              <div className="alert alert-error">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {quickError}
              </div>
            )}

            {quickSuccess && (
              <div className="alert alert-success">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {quickSuccess}
              </div>
            )}

            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={resetQuickForm}
                disabled={quickLoading}
              >
                Reset
              </button>
              <button
                className="btn btn-primary"
                onClick={handleQuickImport}
                disabled={quickLoading || !quickFile}
              >
                {quickLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED IMPORT TAB */}
      {activeTab === 'advanced-import' && (
        <div className="tab-content">
          <div className="import-card">
            <div className="card-header">
              <h3>Advanced Import with Custom Mapping</h3>
              <p>Upload a file, preview the data, and customize field mappings before importing.</p>
            </div>

            {previewStep === 'upload' && (
              <>
                <div className="form-section">
                  <label className="form-label">Select File (CSV or Excel)</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="advanced-file"
                      className="file-input"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleAdvancedFileSelect}
                    />
                    <label htmlFor="advanced-file" className="file-label">
                      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Click to upload or drag and drop</span>
                      <span className="file-hint">CSV, XLSX, or XLS</span>
                    </label>
                  </div>
                  {advancedFile && (
                    <div className="file-selected">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{advancedFile.name}</span>
                    </div>
                  )}
                </div>

                {previewError && (
                  <div className="alert alert-error">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {previewError}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setAdvancedFile(null)}
                    disabled={previewLoading}
                  >
                    Reset
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handlePreviewCsv}
                    disabled={previewLoading || !advancedFile}
                  >
                    {previewLoading ? 'Previewing...' : 'Preview'}
                  </button>
                </div>
              </>
            )}

            {previewStep === 'preview' && (
              <>
                <div className="form-section">
                  <label className="form-label">CSV Preview</label>
                  <div className="table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          {csvHeaders.map(header => (
                            <th key={header}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            {csvHeaders.map(header => (
                              <td key={`${idx}-${header}`}>{row[header] || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="table-note">Showing first 5 rows of {csvData.length} total rows</p>
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setPreviewStep('upload');
                      setCsvData([]);
                      setCsvHeaders([]);
                    }}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setPreviewStep('mapping')}
                  >
                    Continue to Mapping
                  </button>
                </div>
              </>
            )}

            {previewStep === 'mapping' && (
              <>
                <div className="form-section">
                  <label className="form-label">Field Mapping Configuration</label>
                  <p className="mapping-help">Map your CSV columns to system fields. Choose the appropriate system field for each CSV column.</p>
                  
                  <div className="mapping-grid">
                    {csvHeaders.map(csvHeader => (
                      <div key={csvHeader} className="mapping-item">
                        <div className="csv-column">
                          <span className="mapping-label">CSV Column:</span>
                          <span className="mapping-value">{csvHeader}</span>
                        </div>
                        <div className="mapping-arrow">→</div>
                        <div className="system-field">
                          <span className="mapping-label">Map to:</span>
                          <select
                            className="mapping-select"
                            value={fieldMapping[csvHeader] || ''}
                            onChange={(e) => handleMappingChange(csvHeader, e.target.value)}
                          >
                            <option value="">-- Skip this column --</option>
                            {importType === 'lawyers' ? (
                              <>
                                <option value="username">Username (Full Name) *</option>
                                <option value="email">Email *</option>
                                <option value="specialization">Specialization *</option>
                                <option value="barNumber">Bar Number *</option>
                                <option value="location">Location *</option>
                                <option value="phone">Phone (Optional)</option>
                                <option value="address">Address (Optional)</option>
                              </>
                            ) : (
                              <>
                                <option value="username">Username (Organization Name) *</option>
                                <option value="email">Email *</option>
                                <option value="registrationNumber">Registration Number *</option>
                                <option value="focusArea">Focus Area *</option>
                                <option value="location">Location *</option>
                                <option value="phone">Phone (Optional)</option>
                                <option value="address">Address (Optional)</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <label className="form-label">Default Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter default password for new accounts"
                    value={advancedPassword}
                    onChange={(e) => setAdvancedPassword(e.target.value)}
                  />
                </div>

                <div className="form-section checkbox-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={advancedAutoApprove}
                      onChange={(e) => setAdvancedAutoApprove(e.target.checked)}
                    />
                    <span>Auto-approve imported accounts (accounts will be APPROVED upon import)</span>
                  </label>
                </div>

                {advancedError && (
                  <div className="alert alert-error">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {advancedError}
                  </div>
                )}

                {advancedSuccess && (
                  <div className="alert alert-success">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {advancedSuccess}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPreviewStep('preview')}
                    disabled={advancedLoading}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={resetAdvancedForm}
                    disabled={advancedLoading}
                  >
                    Reset
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAdvancedImport}
                    disabled={advancedLoading || !advancedPassword}
                  >
                    {advancedLoading ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Import Results Modal */}
      {showResults && importResults && (
        <div className="results-modal-overlay" onClick={() => setShowResults(false)}>
          <div className="results-modal" onClick={(e) => e.stopPropagation()}>
            <div className="results-header">
              <h3>Import Results</h3>
              <button className="close-btn" onClick={() => setShowResults(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="results-body">
              <div className="result-stat success">
                <div className="stat-value">{importResults.successCount}</div>
                <div className="stat-label">Successfully Imported</div>
              </div>
              <div className="result-stat failure">
                <div className="stat-value">{importResults.failureCount}</div>
                <div className="stat-label">Failed Imports</div>
              </div>

              {importResults.errors && importResults.errors.length > 0 && (
                <div className="results-errors">
                  <h4>Import Errors:</h4>
                  <ul>
                    {importResults.errors.map((error, idx) => (
                      <li key={idx}><span className="error-row">Row {error.rowNumber}:</span> {error.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="results-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowResults(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectoryIngestion;
