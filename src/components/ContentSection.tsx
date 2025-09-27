import React, { useState } from 'react';
import { FileText, Headphones, Play } from 'lucide-react';
import type { Article } from '../services/api';
import ArticleCard from './ArticleCard';

interface ContentSectionProps {
  blogArticles: Article[];
  audioArticles: Article[];
  videoArticles: Article[];
}

type ContentType = 'blog' | 'audio' | 'video' | 'all';

const ContentSection: React.FC<ContentSectionProps> = ({ 
  blogArticles, 
  audioArticles, 
  videoArticles 
}) => {
  const [activeTab, setActiveTab] = useState<ContentType>('all');

  const getFilteredContent = () => {
    switch (activeTab) {
      case 'blog':
        return blogArticles;
      case 'audio':
        return audioArticles;
      case 'video':
        return videoArticles;
      case 'all':
      default:
        return [...blogArticles, ...audioArticles, ...videoArticles]
          .sort((a, b) => (b.rankingScore || b.significanceScore) - (a.rankingScore || a.significanceScore));
    }
  };

  const filteredContent = getFilteredContent();

  return (
    <div className="content-section">
      <div className="content-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Content ({blogArticles.length + audioArticles.length + videoArticles.length})
        </button>
        
        <button 
          className={`tab ${activeTab === 'blog' ? 'active' : ''}`}
          onClick={() => setActiveTab('blog')}
        >
          <FileText className="tab-icon" />
          Articles ({blogArticles.length})
        </button>
        
        <button 
          className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          <Headphones className="tab-icon" />
          Podcasts ({audioArticles.length})
        </button>
        
        <button 
          className={`tab ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <Play className="tab-icon" />
          Videos ({videoArticles.length})
        </button>
      </div>
      
      <div className="content-grid">
        {filteredContent.length > 0 ? (
          filteredContent.map((article, index) => (
            <ArticleCard 
              key={`${article.type}-${index}-${article.url}`} 
              article={article} 
            />
          ))
        ) : (
          <div className="no-content">
            <p>No content available for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentSection;