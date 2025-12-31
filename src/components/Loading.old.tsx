import React, { useState, useEffect } from 'react';
import { RefreshCw, Brain, Zap, Database } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message: _message = "Loading AI news..." }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  const loadingSteps = [
    { icon: Brain, text: "Initializing AI systems", color: "#3b82f6" },
    { icon: Database, text: "Fetching latest news", color: "#10b981" },
    { icon: Zap, text: "Processing content", color: "#f59e0b" },
    { icon: RefreshCw, text: "Finalizing dashboard", color: "#8b5cf6" }
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % loadingSteps.length);
    }, 2000);

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <div className="enhanced-loading-container">
      <div className="loading-content">
        {/* Main spinner with progress */}
        <div className="main-loading-spinner">
          <div className="spinner-ring">
            <div className="spinner-fill"></div>
          </div>
          <div className="spinner-center">
            <CurrentIcon 
              size={32} 
              style={{ color: loadingSteps[currentStep].color }}
              className="spinning-slow"
            />
          </div>
        </div>

        {/* Step indicator */}
        <div className="loading-steps">
          {loadingSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div 
                key={index}
                className={`loading-step ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}
              >
                <div className="step-icon" style={{ borderColor: step.color }}>
                  <StepIcon size={16} style={{ color: step.color }} />
                </div>
                <span className="step-text">{step.text}</span>
              </div>
            );
          })}
        </div>

        {/* Main message */}
        <div className="loading-message-enhanced">
          <h3>Vidyagam AI News</h3>
          <p className="loading-subtitle">
            {loadingSteps[currentStep].text}{dots}
          </p>
          <p className="loading-hint">
            Curating the latest AI intelligence for you...
          </p>
        </div>

        {/* Progress bar */}
        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${((currentStep + 1) / loadingSteps.length) * 100}%`,
                backgroundColor: loadingSteps[currentStep].color
              }}
            ></div>
          </div>
          <span className="progress-text">
            {Math.round(((currentStep + 1) / loadingSteps.length) * 100)}% Complete
          </span>
        </div>

        {/* Tips for long loading */}
        <div className="loading-tips">
          <p>💡 <strong>Tip:</strong> We're fetching fresh AI news from 45+ sources</p>
          <p>🚀 <strong>Fast Track:</strong> Authentication takes only seconds</p>
        </div>
      </div>

      <style>{`
        .enhanced-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .loading-content {
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .main-loading-spinner {
          position: relative;
          margin: 0 auto 2rem;
          width: 120px;
          height: 120px;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid #e2e8f0;
          border-radius: 50%;
          overflow: hidden;
        }

        .spinner-fill {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 2s linear infinite;
        }

        .spinner-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .spinning-slow {
          animation: spin 3s linear infinite;
        }

        .loading-steps {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin: 2rem 0;
        }

        .loading-step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          opacity: 0.6;
        }

        .loading-step.active {
          opacity: 1;
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .loading-step.completed {
          opacity: 0.8;
          background: #f0f9ff;
        }

        .step-icon {
          width: 32px;
          height: 32px;
          border: 2px solid #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .loading-message-enhanced {
          margin: 2rem 0;
        }

        .loading-message-enhanced h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .loading-subtitle {
          font-size: 1.125rem;
          color: #3b82f6;
          font-weight: 600;
          margin-bottom: 0.5rem;
          min-height: 1.5rem;
        }

        .loading-hint {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .loading-progress {
          margin: 2rem 0;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .loading-tips {
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(59, 130, 246, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.1);
        }

        .loading-tips p {
          font-size: 0.875rem;
          color: #374151;
          margin: 0.5rem 0;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .enhanced-loading-container {
            padding: 1rem;
          }
          
          .loading-steps {
            grid-template-columns: 1fr;
          }
          
          .main-loading-spinner {
            width: 100px;
            height: 100px;
          }
          
          .spinner-center {
            width: 70px;
            height: 70px;
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;