/**
 * CategoryPage – canonical category hub served at /category/:slug
 *
 * - Fetches category metadata + recent articles from the backend.
 * - Returns a real 404 UI when the backend says not found.
 * - Each article card links to its internal /article/:slug page
 *   (when the article has a slug) or falls back to the external URL.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchCategoryBySlug, SLUG_NAV_ENABLED } from '../services/api';
import { trackArticleClick } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';
import Header from '../newcomponents/Header';
import type { Article } from '../types/article';

// ─── inline styles ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  pageShell: { width: '100%', minHeight: 'calc(100vh - 64px)', padding: '0 0 2rem' },
  contentFrame: { width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 1rem' },
  wrapper:  { maxWidth: 900, margin: '0 auto', padding: '2rem 0', fontFamily: 'inherit' },
  back:     { display: 'inline-block', marginBottom: '1.5rem', color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' },
  heading:  { fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' },
  desc:     { color: '#6b7280', marginBottom: '1.5rem' },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' },
  card:     { border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 },
  cardMeta: { fontSize: '0.75rem', color: '#9ca3af' },
  cardTitle:{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4, color: '#111827', textDecoration: 'none' },
  pill:     { display: 'inline-block', background: '#f3f4f6', borderRadius: '9999px', padding: '1px 8px', fontSize: '0.72rem', color: '#374151', marginRight: 4 },
  cta:      { display: 'inline-block', marginTop: '1.75rem', padding: '0.6rem 1.4rem', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 },
  h404:     { fontSize: '4rem', fontWeight: 800, color: '#6366f1', margin: 0 },
  p404:     { color: '#6b7280', marginTop: '0.5rem' },
  spin:     { color: '#6b7280', marginTop: '3rem', textAlign: 'center' },
};

// ─── helper: resolve the link destination for one article card ───────────────
function articleHref(article: Article): { href: string; internal: boolean } {
  if (SLUG_NAV_ENABLED && article.slug) {
    return { href: `/article/${article.slug}`, internal: true };
  }
  return { href: article.url ?? '#', internal: false };
}

// ─── component ───────────────────────────────────────────────────────────────
const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const outletContext = useOutletContext<{
    onMenuClick?: () => void;
    onTrendingClick?: () => void;
  }>();
  const [data, setData] = useState<{
    category: any;
    articles: Article[];
    count: number;
  } | null | undefined>(undefined); // undefined = loading

  const handleHeaderSearch = (query: string) => {
    if (isAuthenticated) {
      navigate('/dashboard', {
        state: {
          preselectedTab: 'news',
          initialSearchQuery: query,
        },
      });
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (!slug) { setData(null); return; }
    let cancelled = false;
    fetchCategoryBySlug(slug).then(d => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, [slug]);

  // ── loading ──
  if (data === undefined) {
    return (
      <>
        <Header
          showSearch={true}
          onSearch={handleHeaderSearch}
          onMenuClick={outletContext?.onMenuClick}
          onTrendingClick={outletContext?.onTrendingClick}
        />
        <div style={styles.spin}><p>Loading…</p></div>
      </>
    );
  }

  // ── 404 ──
  if (data === null) {
    return (
      <>
        <Header
          showSearch={true}
          onSearch={handleHeaderSearch}
          onMenuClick={outletContext?.onMenuClick}
          onTrendingClick={outletContext?.onTrendingClick}
        />
        <Helmet>
          <title>Category Not Found – Vidyagam</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div style={{ ...styles.wrapper, textAlign: 'center', paddingTop: '4rem' }}>
          <p style={styles.h404}>404</p>
          <p style={styles.p404}>This category could not be found.</p>
          <Link to="/" style={{ ...styles.cta, marginTop: '1rem' }}>Back to Home</Link>
        </div>
      </>
    );
  }

  const { category, articles } = data;
  const canonicalUrl = `${window.location.origin}/category/${slug}`;

  return (
    <>
      <Header
        showSearch={true}
        onSearch={handleHeaderSearch}
        onMenuClick={outletContext?.onMenuClick}
        onTrendingClick={outletContext?.onTrendingClick}
      />
      <Helmet>
        <title>{category.name} – Vidyagam</title>
        <meta name="description" content={category.description || `Browse ${category.name} articles on Vidyagam`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type"        content="website" />
        <meta property="og:title"       content={`${category.name} – Vidyagam`} />
        <meta property="og:description" content={category.description || ''} />
        <meta property="og:url"         content={canonicalUrl} />
      </Helmet>

      <div style={styles.pageShell}>
        <div style={styles.contentFrame}>
          <div style={styles.wrapper}>
            <Link to="/" style={styles.back}>← Back to Feed</Link>

          <h1 style={styles.heading}>{category.name}</h1>
          {category.description && <p style={styles.desc}>{category.description}</p>}

            {articles.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No articles found in this category yet.</p>
            ) : (
              <div style={styles.grid}>
                {articles.map((article, idx) => {
                  const { href, internal } = articleHref(article);
                  const displayDate = article.published_date
                    ? new Date(article.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : null;

                  return (
                    <div key={article.id ?? idx} style={styles.card}>
                      <div style={styles.cardMeta}>
                        {article.source && <span style={styles.pill}>{article.source}</span>}
                        {article.content_type_label && <span style={styles.pill}>{article.content_type_label}</span>}
                        {displayDate && <span>{displayDate}</span>}
                      </div>

                      {internal ? (
                        <Link to={href} style={styles.cardTitle}>
                          {article.title}
                        </Link>
                      ) : (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.cardTitle}
                          onClick={() => trackArticleClick(article.title, article.source ?? '', category.name)}
                        >
                          {article.title}
                        </a>
                      )}

                      {article.author && (
                        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>By {article.author}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
