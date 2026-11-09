import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Alert, Button, Empty, Skeleton, Tag } from 'antd';
import { Link, useParams } from 'react-router-dom';
import ArticleComments from '../components/ArticleComments';
import request_client from '../utils/common';
import { articleImageUrl } from '../utils/articleImages';
function Article() {
  const [canEdit, setCanEdit] = useState(false);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const { id } = useParams();
  useEffect(() => {
    let active = true;
    setCanEdit(false);
    request_client.get(`api/article/${id}/edit`, { skipGlobalError: true }).then(() => { if (active) setCanEdit(true); }).catch(() => {});
    setLoading(true); setError(''); setArticle(null);
    request_client.get(`api/article/${id}`, { skipGlobalError: true })
      .then(response => { if (active) setArticle(response.data?.message || null); })
      .catch(error => { if (active) setError(error.response?.data?.message || '文章加载失败'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);
  return <div className="reading-page"><Link className="back-link" to="/home">← 返回文章列表</Link><article className="surface reading-card">
    {loading ? <Skeleton active paragraph={{ rows: 10 }} /> : error ? <Alert type="error" showIcon title={error} action={<Button onClick={() => setRetry(value => value + 1)}>重试</Button>} /> : article ? <><header className="reading-header">{canEdit && <Link className="read-link" to={`/article/${id}/edit`}>编辑文章 ↗</Link>}<p className="eyebrow">THE JOURNAL / 技术笔记</p><h1>{article.article_title}</h1><div className="tag-cloud">{(article.tags || []).map(tag => <Tag key={tag.id}>{tag.tag_name}</Tag>)}</div>{article.update_time && <p className="muted">更新于 {String(article.update_time).slice(0, 10)}</p>}</header><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={articleImageUrl}>{article.article_content || ''}</ReactMarkdown></div></> : <Empty description="文章不存在或暂不可访问" />}
  </article>{!loading && !error && article && <ArticleComments key={id} articleId={id} />}</div>;
}
export default Article;
