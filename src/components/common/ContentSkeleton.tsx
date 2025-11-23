/**
 * Skeleton loader for content while fetching
 */

import React from 'react';

export const ContentSkeleton: React.FC = () => {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        marginBottom: '16px',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      <div
        style={{
          height: '200px',
          backgroundColor: '#e5e7eb',
          borderRadius: '8px',
          marginBottom: '12px'
        }}
      />
      <div
        style={{
          height: '20px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          marginBottom: '8px',
          width: '80%'
        }}
      />
      <div
        style={{
          height: '16px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          width: '60%'
        }}
      />
    </div>
  );
};