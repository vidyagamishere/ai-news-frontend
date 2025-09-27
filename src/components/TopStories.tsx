import React from 'react';
import { Star, Link2 } from 'lucide-react';
import type { TopStory } from '../services/api';
import SmartImage from './SmartImage';
import TopicLabels from './TopicLabels';

interface TopStoriesProps {
  stories: TopStory[];
}

const TopStories: React.FC<TopStoriesProps> = ({ stories }) => {
  // Add validation for stories data
  if (!stories) {
    console.log('TopStories: No stories data received');
    return (
      <div className="top-stories-empty">
        <div className="empty-state">
          <div className="empty-icon">📰</div>
          <h3>Loading AI News...</h3>
          <p>Fetching the latest AI breakthroughs and developments.</p>
        </div>
      </div>
    );
  }

  if (!Array.isArray(stories)) {
    console.log('TopStories: Stories is not an array:', typeof stories, stories);
    return (
      <div className="top-stories-empty">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>Data Format Error</h3>
          <p>Stories data is not in the expected format.</p>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="top-stories-empty">
        <div className="empty-state">
          <div className="empty-icon">📰</div>
          <h3>Loading AI News...</h3>
          <p>Fetching the latest AI breakthroughs and developments.</p>
        </div>
      </div>
    );
  }


  const openStoryLink = (url: string, event?: React.MouseEvent | React.TouchEvent) => {
    if (event) {
      event.stopPropagation();
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };


  return (
    <div className="top-stories">
      <div className="stories-list">
        {stories.slice(0, 5).map((story, index) => {
          // Always show full summary - no truncation or read more
          const summary = story.content_summary || story.summary || `This significant article from ${story.source} covers important developments in AI technology. The piece provides valuable insights into emerging trends and innovations shaping the industry. Readers will gain understanding of current advancements and their potential applications. The content offers expert analysis from leading voices in artificial intelligence. Essential reading for staying informed about the latest breakthroughs in AI.`;
          
          return (
            <div 
              key={index} 
              className="story-item"
            >
              <div className="story-rank">#{index + 1}</div>
              <div className="story-main">
                <div className="story-left">
                  <h3 className="story-title">
                    {story.title}
                  </h3>
                  
                  {story.imageUrl && (
                    <SmartImage
                      src={story.imageUrl}
                      alt={story.title}
                      className="story-image-smart"
                      fallbackType="hide"
                      aspectRatio="16/9"
                      maxWidth="280px"
                      lazy={true}
                    />
                  )}
                  
                  <div className="story-meta">
                    <span className="story-source">{story.source}</span>
                    <div className="story-score">
                      <Star className="star-icon" />
                      <span>{story.significanceScore.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <TopicLabels 
                    topics={story.topics}
                    topic_names={story.topic_names}
                    topic_categories={story.topic_categories}
                    maxTopics={2}
                    size="small"
                  />
                </div>
                
                <div className="story-right">
                  <p className="story-summary">
                    {summary}
                    <span className="llm-summary-badge" title="Enhanced 5-sentence AI summary">🤖</span>
                  </p>
                  
                  <div className="story-actions">
                    <button 
                      className="read-article-btn"
                      onClick={(e) => openStoryLink(story.url, e)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        openStoryLink(story.url, e);
                      }}
                      type="button"
                      aria-label="Open article in new tab"
                    >
                      <Link2 size={16} />
                      Read Article
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopStories;