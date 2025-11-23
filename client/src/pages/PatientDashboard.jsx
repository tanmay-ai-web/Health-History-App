// client/src/pages/PatientDashboard.jsx

import React, { useState, useEffect } from 'react';
import { getMyHistory } from '../services/api';

function PatientDashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Local storage se Patient ka unique ID lena
  const patientId = localStorage.getItem('user_identity');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // API call to Flask backend (Patient-only route)
        const data = await getMyHistory();
        setHistory(data.history);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load your health history. Please try logging in again.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <h2 style={{padding: '20px'}}>Loading Patient History...</h2>;
  
  // Error state handling
  if (error) return <h2 style={{padding: '20px', color: 'red'}}>{error}</h2>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>👤 My Health History</h2>
      <p style={{ fontWeight: 'bold' }}>Unique Patient ID: {patientId}</p>
      
      {history.length === 0 ? (
        <p style={{ marginTop: '20px', fontSize: '1.1em', color: 'orange' }}>
            No health records found yet. Please consult a registered Doctor.
        </p>
      ) : (
        <div className="history-list" style={{ marginTop: '20px' }}>
          {history.map((record, index) => (
            <div key={record._id} style={recordStyle}>
              <h3>Record #{history.length - index}</h3>
              <p><strong>Date of Visit:</strong> {new Date(record.date).toLocaleDateString()}</p>
              <p><strong>Recorded By Doctor ID:</strong> {record.doctor_id_ref}</p>
              <p>
                <strong style={{ color: '#007bff' }}>Summary of Problem/Diagnosis:</strong> 
                <br />
                {record.problem_summary}
              </p>
              {record.report_url && (
                  <p>
                      <strong>External Report:</strong> 
                      <a href={record.report_url} target="_blank" style={{ color: '#28a745', marginLeft: '5px' }}>
                          View Attached File
                      </a>
                  </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple internal CSS for presentation
const recordStyle = { 
    border: '1px solid #ddd', 
    padding: '15px', 
    margin: '15px 0', 
    borderRadius: '8px', 
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

export default PatientDashboard;