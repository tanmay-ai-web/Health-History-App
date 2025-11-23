// client/src/pages/DoctorDashboard.jsx

import React, { useState } from 'react';
import { uploadRecord, getPatientHistory } from '../services/api';

function DoctorDashboard() {
  // State for Upload Form
  const [recordData, setRecordData] = useState({ 
    patient_id: '', 
    problem_summary: '', 
    report_url: '' 
  });
  
  // State for Search
  const [patientIdSearch, setPatientIdSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null); // Null, Array, ya [] ho sakta hai
  
  // Message for upload feedback
  const [uploadMessage, setUploadMessage] = useState('');
  
  // Local storage se Doctor ka ID lena
  const doctorId = localStorage.getItem('user_identity');

  // -----------------------------------------------------------------
  // 1. UPLOAD LOGIC
  // -----------------------------------------------------------------
  const handleUploadChange = (e) => {
    setRecordData({ ...recordData, [e.target.name]: e.target.value });
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadMessage('Uploading...');
    
    // Simple validation (Patient ID format check)
    if (!recordData.patient_id.startsWith('P-') || recordData.patient_id.length < 8) {
      setUploadMessage('Error: Invalid Patient ID format. Must start with P-');
      return;
    }

    try {
      // API call to Flask backend
      const data = await uploadRecord(recordData);
      setUploadMessage(`✅ Success: Record uploaded for patient ${data.patient}`);
      // Form ko reset karna
      setRecordData({ patient_id: '', problem_summary: '', report_url: '' }); 
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Upload failed. Check your network or token.';
      setUploadMessage(`❌ Error: ${errorMsg}`);
    }
  };

  // -----------------------------------------------------------------
  // 2. SEARCH LOGIC
  // -----------------------------------------------------------------
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setSearchResults('Loading...');
    
    // Simple validation
    if (!patientIdSearch) return;

    try {
      // API call to Flask backend (Doctor-specific route)
      const data = await getPatientHistory(patientIdSearch);
      setSearchResults(data.history);
    } catch (error) {
      console.error("Search error:", error);
      // Agar backend se 404 (Not Found) status aaya
      if (error.response && error.response.status === 404) {
        setSearchResults([]); // No records found (display empty array)
      } else {
        alert("Failed to search history. Check if your token is valid.");
        setSearchResults(null);
      }
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>🧑‍⚕️ Doctor Dashboard (ID: {doctorId})</h2>

      {/* --- Section 1: Upload New Record --- */}
      <div style={sectionStyle}>
        <h3>Upload New Patient Record</h3>
        <p style={{ color: uploadMessage.startsWith('❌') ? 'red' : 'green', fontWeight: 'bold' }}>{uploadMessage}</p>
        
        <form onSubmit={handleUploadSubmit} style={formStyle}>
          <input 
            type="text" 
            name="patient_id" 
            placeholder="Patient Unique ID (e.g., P-A1B2C3)" 
            value={recordData.patient_id} 
            onChange={handleUploadChange} 
            required 
            style={inputStyle}
          />
          <textarea 
            name="problem_summary" 
            placeholder="Diagnosis and Treatment Summary (required)" 
            value={recordData.problem_summary} 
            onChange={handleUploadChange} 
            required 
            style={{ ...inputStyle, minHeight: '80px' }}
          />
          <input 
            type="url" 
            name="report_url" 
            placeholder="Optional: Report File URL (Google Drive, etc.)" 
            value={recordData.report_url} 
            onChange={handleUploadChange} 
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>Submit New Record</button>
        </form>
      </div>
      
      {/* --- Horizontal Line --- */}
      <hr style={{ margin: '40px 0' }} />

      {/* --- Section 2: Search Patient History --- */}
      <div style={sectionStyle}>
        <h3>Search Patient History</h3>
        
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Enter Patient ID to Search (e.g., P-A1B2C3)" 
            value={patientIdSearch} 
            onChange={(e) => setPatientIdSearch(e.target.value)} 
            required 
            style={{ ...inputStyle, flexGrow: 1 }} 
          />
          <button type="submit" style={{ ...buttonStyle, width: '150px' }}>Search</button>
        </form>

        {/* --- Search Results Display --- */}
        {searchResults === 'Loading...' && <p>Searching...</p>}
        {searchResults !== null && searchResults !== 'Loading...' && (
          <div className="search-results">
            <h4>Results for Patient ID: {patientIdSearch} ({searchResults.length} records found)</h4>
            
            {searchResults.length === 0 ? (
              <p style={{ color: 'orange' }}>No records found for this patient ID.</p>
            ) : (
              searchResults.map((record, index) => (
                <div key={record._id} style={recordStyle}>
                  <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()} recorded by Dr. {record.doctor_id_ref}</p>
                  <p><strong>Summary:</strong> {record.problem_summary}</p>
                  {record.report_url && <p><strong>Report Link:</strong> <a href={record.report_url} target="_blank">View External Report</a></p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple internal CSS for presentation
const sectionStyle = { border: '1px solid #ddd', padding: '25px', borderRadius: '8px', marginBottom: '20px', boxShadow: '2px 2px 5px rgba(0,0,0,0.05)' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '10px', border: '1px solid #ccc', borderRadius: '4px' };
const buttonStyle = { padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const recordStyle = { border: '1px dashed #aaa', padding: '15px', margin: '10px 0', borderRadius: '4px', backgroundColor: '#f9f9f9' };


export default DoctorDashboard;