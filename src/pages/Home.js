import React, { useEffect, useState } from 'react';
import { Alert, Button, Empty, Input, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import request_client from '../utils/common';

function Home() {
  const [articles, setArticles] = useState([]);
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    Promise.allSettled([
      request_client.get('api/list/article', { skipGlobalError: true }),
      request_client.get('api/tags', { skipGlobalError: true }),
      request_client.get('api/categories', { skipGlobalError: true }),
    ]).then(([posts, labels, groups]) => {
      if (!active) return;
      setArticles(posts.status === 'fulfilled' ? posts.value.data?.message?.article_list || [] : []);
      setTags(labels.status === 'fulfilled' ? labels.value.data?.tags || [] : []);
      setCategories(groups.status === 'fulfilled' ? groups.value.data?.categories || [] : []);
      setError(posts.status === 'rejected'); setLoading(false);
    });
    return () => { active = false; };
  }, [retry]);
  const keyword = query.trim().toLowerCase();
  const filtered = articles.filter(article =>
    (selectedTag === null || article.tag_ids?.includes(selectedTag)) &&
    `${article.article_title} ${article.prospectus || ''}`.toLowerCase().includes(keyword)
  );
  return <>
    <section className="home-hero"><div><p className="eyebrow">NOTES ON BUILDING & LIVING</p><h1>把探索写成记录，<br />让思考持续生长。</h1><p className="hero-description">关于编程、工程实践，以及生活中的一点灵感。</p></div><div className="hero-note"><span>持续学习 / 持续记录</span><span className="hero-symbol" aria-hidden="true">✳</span><span>TECHNOLOGY & LIFE</span></div></section>
    <div className="home-grid"><section aria-label="文章列表"><div className="section-heading"><div><p className="eyebrow">THE JOURNAL</p><h2>最新文章 <span className="count">{filtered.length}</span></h2></div><Input allowClear aria-label="搜索文章" placeholder="搜索标题或摘要…" value={query} onChange={event => setQuery(event.target.value)} className="article-search" /></div>
      {loading ? <div className="surface loading-card"><Skeleton active paragraph={{ rows: 5 }} /></div> : error ? <Alert type="error" showIcon title="暂时无法加载文章" description="请检查网络连接，或稍后重试。" action={<Button onClick={() => setRetry(value => value + 1)}>重试</Button>} /> : filtered.length ? <div className="article-list">{filtered.map((article, index) => <article className="surface article-card" key={article.id}><div className="article-meta"><span>ARTICLE / {String(index + 1).padStart(2, '0')}</span>{article.update_time && <time>{String(article.update_time).slice(0, 10)}</time>}</div><h3><Link to={`/article/${article.id}`}>{article.article_title}</Link></h3><p>{article.prospectus || '打开文章，继续阅读完整内容。'}</p><Link className="read-link" to={`/article/${article.id}`}>阅读全文 <span aria-hidden="true">↗</span></Link></article>)}</div> : <div className="surface empty-card"><Empty description={keyword || selectedTag !== null ? '没有找到匹配的文章' : '还没有发布文章'} /></div>}
    </section><aside className="sidebar"><section className="surface about-card"><p className="eyebrow">HELLO, WORLD</p><div className="profile-mark">JR</div><h2>你好，我是 John。</h2><p>在这里整理技术笔记，记录解决问题的过程，也分享日常观察。</p><div className="profile-divider" /><span className="muted">保持好奇，慢慢积累。</span></section><section className="surface side-card"><h2>探索标签</h2><div className="tag-cloud">{tags.length ? <>
      <Button size="small" type={selectedTag === null ? 'primary' : 'default'} aria-pressed={selectedTag === null} onClick={() => setSelectedTag(null)}>全部标签</Button>
      {tags.map(tag => <Button key={tag.id} size="small" type={selectedTag === tag.id ? 'primary' : 'default'} aria-pressed={selectedTag === tag.id} onClick={() => setSelectedTag(current => current === tag.id ? null : tag.id)}>{tag.tag_name}</Button>)}
    </> : <p className="muted">暂无标签</p>}</div></section><section className="surface side-card"><h2>文章分类</h2>{categories.length ? <ul className="category-list">{categories.map(category => <li key={category.id || category.name}><span>{category.name}</span><span aria-hidden="true">↗</span></li>)}</ul> : <p className="muted">暂无分类</p>}</section></aside></div>
  </>;
}
export default Home;
