import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, BookOpen, Building2 } from 'lucide-react';
import type { Metrics } from '../services/api';

interface MetricsDashboardProps {
  metrics: Metrics;
  keyPoints?: string[];
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  const [animatedMetrics, setAnimatedMetrics] = useState({
    totalUpdates: Math.max(0, metrics.totalUpdates - 20),
    highImpact: Math.max(0, metrics.highImpact - 20),
    newResearch: Math.max(0, metrics.newResearch - 20),
    industryMoves: Math.max(0, metrics.industryMoves - 20)
  });

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 50;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedMetrics({
        totalUpdates: Math.floor(Math.max(0, metrics.totalUpdates - 20) + (20 * progress)),
        highImpact: Math.floor(Math.max(0, metrics.highImpact - 20) + (20 * progress)),
        newResearch: Math.floor(Math.max(0, metrics.newResearch - 20) + (20 * progress)),
        industryMoves: Math.floor(Math.max(0, metrics.industryMoves - 20) + (20 * progress))
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedMetrics({
          totalUpdates: metrics.totalUpdates,
          highImpact: metrics.highImpact,
          newResearch: metrics.newResearch,
          industryMoves: metrics.industryMoves
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [metrics]);

  return (
    <div className="metrics-dashboard">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon total">
            <TrendingUp />
          </div>
          <div className="metric-content">
            <h3>{animatedMetrics.totalUpdates}</h3>
            <p>Total Updates</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon high-impact">
            <AlertCircle />
          </div>
          <div className="metric-content">
            <h3>{animatedMetrics.highImpact}</h3>
            <p>High Impact</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon research">
            <BookOpen />
          </div>
          <div className="metric-content">
            <h3>{animatedMetrics.newResearch}</h3>
            <p>New Research</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon industry">
            <Building2 />
          </div>
          <div className="metric-content">
            <h3>{animatedMetrics.industryMoves}</h3>
            <p>Industry Moves</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;