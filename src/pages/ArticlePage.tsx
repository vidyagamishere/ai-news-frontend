/**
 * ArticlePage – canonical story page served at /article/:slug
 *
 * - Fetches article from backend using the slug.
 * - Returns a real 404 UI when the backend says not found.
 * - Fires an outbound-click analytics event BEFORE redirecting to the
 *   external source URL (so we capture it even if the tab is opened).
 * - Sets page <title> and basic Open Graph meta via react-helmet-async
 *   so crawlers and link-preview tools see real content on first response
 *   (once SSR / prerender is wired up; they are no-ops in pure CSR).
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ShareDialog from '../components/ShareDialog';
import { useAuth } from '../contexts/AuthContext';
import { fetchArticleBySlug, fetchCategoryBySlug } from '../services/api';
import { trackArticleClick } from '../utils/analytics';
import Header from '../newcomponents/Header';
import type { Article } from '../types/article';

// ─── tiny inline styles (no extra CSS file needed) ───────────────────────────
const styles: Record<string, React.CSSProperties> = {
  pageShell: { width: '100%', minHeight: 'calc(100vh - 64px)', padding: '0 0 2rem' },
  contentFrame: { width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 1rem' },
  wrapper: { maxWidth: 820, margin: '0 auto', padding: '2rem 0', fontFamily: 'inherit' },
  back:    { display: 'inline-block', marginBottom: '1.5rem', color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' },
  meta:    { fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.5rem' },
  title:   { fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.35, margin: '0.25rem 0 1rem' },
  pill:    { display: 'inline-block', background: '#f3f4f6', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', marginRight: 6, color: '#374151' },
  pillLink:{ display: 'inline-block', background: '#eef2ff', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.75rem', marginRight: 6, color: '#4338ca', textDecoration: 'none', fontWeight: 600 },
  summary: { marginTop: '1.25rem', lineHeight: 1.7, color: '#1f2937' },
  cta:     { display: 'inline-block', marginTop: '1.75rem', padding: '0.6rem 1.4rem', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 },
  ghostCta:{ display: 'inline-block', marginTop: '1.75rem', marginLeft: '0.75rem', padding: '0.6rem 1.1rem', background: '#eef2ff', color: '#4338ca', borderRadius: 8, textDecoration: 'none', fontWeight: 600, border: 'none', cursor: 'pointer' },
  divider: { margin: '1.5rem 0', border: 'none', borderTop: '1px solid #e5e7eb' },
  h404:    { fontSize: '4rem', fontWeight: 800, color: '#6366f1', margin: 0 },
  p404:    { color: '#6b7280', marginTop: '0.5rem' },
  spin:    { color: '#6b7280', marginTop: '3rem', textAlign: 'center' },
  section: { marginTop: '2.5rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' },
  relatedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  relatedCard: { border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem', background: '#fff' },
  cardMeta: { fontSize: '0.75rem', color: '#9ca3af' },
  relatedTitle: { display: 'block', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.45, color: '#111827', textDecoration: 'none', marginTop: '0.5rem' },
  signupCard: { marginTop: '2.5rem', borderRadius: 16, padding: '1.25rem', background: 'linear-gradient(135deg, #111827 0%, #312e81 100%)', color: '#fff' },
  signupTitle: { fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem' },
  signupText: { margin: 0, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6 },
  signupButton: { display: 'inline-block', marginTop: '1rem', padding: '0.65rem 1.15rem', background: '#fff', color: '#111827', borderRadius: 10, textDecoration: 'none', fontWeight: 700 },
};

// ─── outbound click handler ───────────────────────────────────────────────────
function handleOutboundClick(article: Article) {
  // Fire GA4 event; the browser will still follow the link because it is a
  // normal anchor with target="_blank" – we do NOT need to await this.
  trackArticleClick(article.title, article.source ?? '', article.category ?? '');
}

// ─── component ───────────────────────────────────────────────────────────────
const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const outletContext = useOutletContext<{
    onMenuClick?: () => void;
    onTrendingClick?: () => void;
  }>();
  const [article, setArticle] = useState<Article | null | undefined>(undefined); // undefined = loading
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const { isAuthenticated } = useAuth();

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
    if (!slug) { setArticle(null); return; }
    let cancelled = false;
    setRelatedArticles([]);
    fetchArticleBySlug(slug).then(async (a) => {
      if (cancelled) return;
      setArticle(a);
      if (!a?.category_label) return;

      try {
        const categoryData = await fetchCategoryBySlug(a.category_label, 6, 30);
        if (cancelled || !categoryData?.articles) return;

        const filtered = categoryData.articles
          .filter((candidate) => candidate.slug && candidate.slug !== a.slug)
          .slice(0, 3);
        setRelatedArticles(filtered);
      } catch {
        if (!cancelled) {
          setRelatedArticles([]);
        }
      }
    }).catch(() => {
      if (!cancelled) setArticle(null);
    });
    return () => { cancelled = true; };
  }, [slug]);

  const articleJsonLd = article ? JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary ?? article.description ?? '',
    url: typeof window !== 'undefined' ? `${window.location.origin}/article/${slug}` : `/article/${slug}`,
    mainEntityOfPage: typeof window !== 'undefined' ? `${window.location.origin}/article/${slug}` : `/article/${slug}`,
    author: article.author ? { '@type': 'Person', name: article.author } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Vidyagam',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://vidyagam.com',
    },
    datePublished: article.published_date || undefined,
    image: article.image ? [article.image] : undefined,
    articleSection: article.category || undefined,
  }) : '';

  // ── loading ──
  if (article === undefined) {
    return (
      <>
        <Header
          showSearch={true}
          onSearch={handleHeaderSearch}
          onMenuClick={outletContext?.onMenuClick}
          onTrendingClick={outletContext?.onTrendingClick}
        />
        <div style={styles.spin}>
          <p>Loading…</p>
        </div>
      </>
    );
  }

  // ── 404 ──
  if (article === null) {
    return (
      <>
        <Header
          showSearch={true}
          onSearch={handleHeaderSearch}
          onMenuClick={outletContext?.onMenuClick}
          onTrendingClick={outletContext?.onTrendingClick}
        />
        <Helmet>
          <title>Article Not Found – Vidyagam</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div style={{ ...styles.wrapper, textAlign: 'center', paddingTop: '4rem' }}>
          <p style={styles.h404}>404</p>
          <p style={styles.p404}>This article could not be found.</p>
          <Link to="/" style={{ ...styles.cta, marginTop: '1rem' }}>Back to Home</Link>
        </div>
      </>
    );
  }

  const canonicalUrl = `${window.location.origin}/article/${slug}`;
  const categorySlug = article.category_label;
  const displayDate = article.published_date
    ? new Date(article.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const description = article.summary ?? article.description ?? '';

  return (
    <>
      <Header
        showSearch={true}
        onSearch={handleHeaderSearch}
        onMenuClick={outletContext?.onMenuClick}
        onTrendingClick={outletContext?.onTrendingClick}
      />
      <Helmet>
        <title>{article.title} – Vidyagam</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph */}
        <meta property="og:type"        content="article" />
        <meta property="og:title"       content={article.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url"         content={canonicalUrl} />
        {article.image && <meta property="og:image" content={article.image} />}
        {/* Twitter Card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={article.title} />
        <meta name="twitter:description" content={description} />
        {article.image && <meta name="twitter:image" content={article.image} />}
        <script type="application/ld+json">{articleJsonLd}</script>
      </Helmet>

      <div style={styles.pageShell}>
        <div style={styles.contentFrame}>
          <div style={styles.wrapper}>
            <Link to="/" style={styles.back}>← Back to Feed</Link>

            <div style={styles.meta}>
          {article.source && <span style={styles.pill}>{article.source}</span>}
          {categorySlug && article.category ? (
            <Link to={`/category/${categorySlug}`} style={styles.pillLink}>{article.category}</Link>
          ) : article.category ? (
            <span style={styles.pill}>{article.category}</span>
          ) : null}
          {article.content_type_label && <span style={styles.pill}>{article.content_type_label}</span>}
          {displayDate && <span style={{ marginLeft: 4 }}>{displayDate}</span>}
        </div>

          <h1 style={styles.title}>{article.title}</h1>

            {article.author && (
              <p style={{ ...styles.meta, marginBottom: '0.25rem' }}>By {article.author}</p>
            )}

          <hr style={styles.divider} />

            {(article.summary || article.description) && (
              <p style={styles.summary}>{article.summary || article.description}</p>
            )}

            {article.url && (
              <>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.cta}
                  onClick={() => handleOutboundClick(article)}
                >
                  Read Full Article ↗
                </a>
                <button type="button" style={styles.ghostCta} onClick={() => setShareOpen(true)}>
                  Share Story
                </button>
              </>
            )}

            {relatedArticles.length > 0 && categorySlug && article.category && (
              <section style={styles.section}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <h2 style={styles.sectionTitle}>More in {article.category}</h2>
                  <Link to={`/category/${categorySlug}`} style={styles.back}>View Category →</Link>
                </div>
                <div style={styles.relatedGrid}>
                  {relatedArticles.map((related) => (
                    <div key={related.slug ?? related.id} style={styles.relatedCard}>
                      <div style={styles.cardMeta}>
                        {related.source && <span style={styles.pill}>{related.source}</span>}
                        {related.published_date && (
                          <span>
                            {new Date(related.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {related.slug ? (
                        <Link to={`/article/${related.slug}`} style={styles.relatedTitle}>
                          {related.title}
                        </Link>
                      ) : (
                        <a href={related.url} target="_blank" rel="noopener noreferrer" style={styles.relatedTitle}>
                          {related.title}
                        </a>
                      )}
                      {related.summary && (
                        <p style={{ margin: '0.75rem 0 0', color: '#4b5563', lineHeight: 1.6, fontSize: '0.9rem' }}>
                          {related.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!isAuthenticated && (
              <section style={styles.signupCard}>
                <p style={styles.signupTitle}>Get stories like this every morning</p>
                <p style={styles.signupText}>
                  Create a free Vidyagam account to follow AI categories, save articles, and get a personalized daily briefing.
                </p>
                <Link to="/auth?mode=signup" style={styles.signupButton}>Create Free Account</Link>
              </section>
            )}
          </div>
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        articleId={typeof article.id === 'number' ? article.id : parseInt(String(article.id))}
        articleUrl={article.url}
        articleTitle={article.title}
        articleSlug={article.slug}
        preferOwnedArticleUrl={true}
        canonicalUrl={canonicalUrl}
      />
    </>
  );
};

export default ArticlePage;
