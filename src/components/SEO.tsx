import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  article?: {
    publishedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

const SEO: React.FC<SEOProps> = ({
  title = 'AI News Digest - Your Source for AI News & Insights',
  description = 'Get personalized AI news, research breakthroughs, and industry insights delivered daily. Stay ahead with curated content from 500+ trusted sources.',
  keywords = 'AI news, artificial intelligence, machine learning, deep learning, AI research, tech news, AI insights, AI breakthroughs',
  image = '/og-image.png',
  url = 'https://ai-news-react.vercel.app',
  type = 'website',
  article
}) => {
  const fullUrl = url.startsWith('http') ? url : `https://ai-news-react.vercel.app${url}`;
  const fullImageUrl = image.startsWith('http') ? image : `https://ai-news-react.vercel.app${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="AI News Digest" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="AI News Digest" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />

      {/* Article-specific meta tags */}
      {article && type === 'article' && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:author" content={article.author} />
          <meta property="article:section" content={article.section} />
          {article.tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'Article' : 'WebSite',
          "name": title,
          "description": description,
          "url": fullUrl,
          "image": fullImageUrl,
          ...(type === 'article' && article ? {
            "headline": title,
            "datePublished": article.publishedTime,
            "author": {
              "@type": "Person",
              "name": article.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "AI News Digest",
              "logo": {
                "@type": "ImageObject",
                "url": "https://ai-news-react.vercel.app/logo.png"
              }
            }
          } : {
            "publisher": {
              "@type": "Organization",
              "name": "AI News Digest"
            }
          })
        })}
      </script>
    </Helmet>
  );
};

export default SEO;