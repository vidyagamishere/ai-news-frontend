import React from 'react';
import type { AITopic } from '../services/api';
import './TopicLabels.css';

interface TopicLabelsProps {
  topics?: AITopic[];
  topic_names?: string[];
  topic_categories?: string[];
  maxTopics?: number;
  size?: 'small' | 'medium';
  className?: string;
}

const TopicLabels: React.FC<TopicLabelsProps> = ({ 
  topics, 
  topic_names, 
  topic_categories,
  maxTopics = 3,
  size = 'small',
  className = ''
}) => {
  // If we have structured topics data, use that
  if (topics && topics.length > 0) {
    const displayTopics = topics.slice(0, maxTopics);
    const remainingCount = Math.max(0, topics.length - maxTopics);
    
    return (
      <div className={`topic-labels ${size} ${className}`}>
        {displayTopics.map((topic, index) => (
          <span 
            key={topic.id || index}
            className={`topic-label ${topic.category || 'general'}`}
            title={`${topic.name} (${topic.category})`}
          >
            {topic.name}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="topic-label more" title={`+${remainingCount} more topics`}>
            +{remainingCount}
          </span>
        )}
      </div>
    );
  }
  
  // Fallback to topic_names if available
  if (topic_names && topic_names.length > 0) {
    const displayNames = topic_names.slice(0, maxTopics);
    const remainingCount = Math.max(0, topic_names.length - maxTopics);
    
    return (
      <div className={`topic-labels ${size} ${className}`}>
        {displayNames.map((name, index) => {
          const category = topic_categories?.[index] || 'general';
          return (
            <span 
              key={index}
              className={`topic-label ${category}`}
              title={`${name} (${category})`}
            >
              {name}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span className="topic-label more" title={`+${remainingCount} more topics`}>
            +{remainingCount}
          </span>
        )}
      </div>
    );
  }
  
  // Return null if no topic data available
  return null;
};

export default TopicLabels;