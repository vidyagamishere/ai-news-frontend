// Router Test Component - Test new single function backend architecture
import React, { useState } from 'react';
import { routerApiService } from '../services/api-router';

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

export const RouterTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (endpoint: string, update: Partial<TestResult>) => {
    setResults(prev => prev.map(r => 
      r.endpoint === endpoint ? { ...r, ...update } : r
    ));
  };

  const testEndpoint = async (endpoint: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    
    try {
      updateResult(endpoint, { status: 'pending' });
      const data = await testFn();
      const duration = Date.now() - startTime;
      
      updateResult(endpoint, { 
        status: 'success', 
        data, 
        duration 
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateResult(endpoint, { 
        status: 'error', 
        error: error.message,
        duration 
      });
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    
    // Initialize test results
    const endpoints = ['health', 'digest', 'sources', 'test-neon', 'personalized-digest'];
    setResults(endpoints.map(endpoint => ({ endpoint, status: 'pending' as const })));
    
    // Test each endpoint
    await testEndpoint('health', () => routerApiService.getHealth());
    await testEndpoint('digest', () => routerApiService.getDigest());
    await testEndpoint('sources', () => routerApiService.getSources());
    await testEndpoint('test-neon', () => routerApiService.testNeon());
    
    // Test personalized digest (may fail without auth token)
    await testEndpoint('personalized-digest', () => routerApiService.getPersonalizedDigest());
    
    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };


  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 Router API Test Suite</h2>
      <p><strong>Architecture:</strong> Single Function Router Backend</p>
      <p><strong>Backend URL:</strong> https://api-ibf1hsnr0-vijayan-subramaniyans-projects-0c70c64d.vercel.app</p>
      
      <button 
        onClick={runAllTests} 
        disabled={testing}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: testing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {testing ? 'Testing...' : 'Run All Router Tests'}
      </button>

      {results.length > 0 && (
        <div>
          <h3>Test Results:</h3>
          {results.map((result) => (
            <div 
              key={result.endpoint}
              style={{
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '10px',
                margin: '10px 0',
                backgroundColor: '#f8f9fa'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '20px', marginRight: '10px' }}>
                  {getStatusIcon(result.status)}
                </span>
                <strong>/{result.endpoint}</strong>
                {result.duration && (
                  <span style={{ marginLeft: '10px', color: '#666' }}>
                    ({result.duration}ms)
                  </span>
                )}
              </div>
              
              {result.status === 'error' && (
                <div style={{ color: '#ff0000', fontSize: '14px' }}>
                  Error: {result.error}
                </div>
              )}
              
              {result.status === 'success' && result.data && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <details>
                    <summary>Response Data</summary>
                    <pre style={{ 
                      background: '#f0f0f0', 
                      padding: '10px', 
                      borderRadius: '3px',
                      fontSize: '11px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
            <h4>🎯 Router Architecture Benefits:</h4>
            <ul>
              <li>✅ <strong>Single Function:</strong> Only 1 serverless function (vs 12 limit)</li>
              <li>✅ <strong>Scalable:</strong> Add unlimited endpoints without hitting limits</li>
              <li>✅ <strong>Maintainable:</strong> Centralized routing and logic</li>
              <li>✅ <strong>Cost Effective:</strong> Reduced serverless function count</li>
              <li>✅ <strong>Future Proof:</strong> Easy to add new endpoints</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouterTest;