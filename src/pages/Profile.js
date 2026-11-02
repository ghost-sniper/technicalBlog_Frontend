import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Descriptions, Empty, Input, Pagination, Skeleton, Tag } from 'antd';
import { Link } from 'react-router-dom';
import request_client from '../utils/common';
import TagManager from './TagManager';

export default function Profile({ onLoggedOut }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [retry, setRetry] = useState(0);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [loggingOut, setLoggingOut] = useState(false);
    useEffect(() => {
        let active = true;
        setLoading(true); setError('');
        request_client.get('api/user/me', { skipGlobalError: true }).then(response => {
            if (active) setData(response.data);
        }).catch(error => {
            if (!active) return;
            if (error.response?.status === 401 || error.response?.status === 403) onLoggedOut();
            else setError(error.response?.data?.message || '个人主页加载失败，请稍后重试');
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
        // The callback changes parent state only when authentication expires.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retry]);
    const logout = async () => {
        setLoggingOut(true);
        try {
            await request_client.post('api/logout', {}, { skipGlobalError: true });
            onLoggedOut();
        } catch (error) {
            if (error.response?.status === 401) onLoggedOut();
            else setError('退出登录失败，请稍后重试');
        } finally { setLoggingOut(false); }
    };
    if (loading) return <div className="surface loading-card"><Skeleton active paragraph={{ rows: 8 }} /></div>;
    if (!data) return <Alert type="error" title={error || '个人主页加载失败'} action={<Button onClick={() => setRetry(value => value + 1)}>重试</Button>} />;
    const { user, articles = [] } = data;
    const filtered = articles.filter(article => `${article.article_title} ${article.prospectus || ''}`.toLowerCase().includes(query.toLowerCase()));
    return <div className="profile-page">
        {error && <Alert className="profile-alert" type="error" showIcon title={error} />}
        <section className="surface profile-header"><div className="profile-identity"><Avatar size={72} src={user.avatar || undefined}>{user.username?.slice(0, 1)}</Avatar><div><p className="eyebrow">MY SPACE</p><h1>个人主页</h1><p className="muted">欢迎回来，{user.username}。</p></div></div><Button loading={loggingOut} onClick={logout}>退出登录</Button></section>
        <div className="profile-grid"><aside className="surface side-card"><h2>基本信息</h2><Descriptions column={1} layout="vertical" size="small" items={[
            { key: 'username', label: '用户名', children: user.username },
            { key: 'email', label: '邮箱', children: user.email || '未设置' },
            { key: 'phone', label: '手机号', children: user.phone_number || '未设置' },
            { key: 'level', label: '用户等级', children: `Lv. ${user.user_level}` },
            { key: 'joined', label: '加入时间', children: user.create_time?.slice(0, 10) || '暂无记录' },
            { key: 'bio', label: '个人简介', children: user.introduction || '还没有填写简介。' },
        ]} /></aside><section aria-label="我的文章"><div className="section-heading"><h2>我的文章 <span className="count">{articles.length}</span></h2><Input className="article-search" allowClear aria-label="搜索我的文章" placeholder="搜索我的文章…" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></div>
        {filtered.length ? <><div className="article-list">{filtered.slice((page - 1) * 8, page * 8).map(article => <article key={article.id} className="surface article-card"><div className="article-meta"><span>更新于 {article.update_time?.slice(0, 10) || article.create_time?.slice(0, 10) || '暂无日期'}</span><Tag>{article.view_type === 'public' ? '公开' : '受限访问'}</Tag></div><h3><Link to={`/article/${article.id}`}>{article.article_title}</Link></h3><p>{article.prospectus || '暂无文章摘要'}</p><div className="profile-article-footer"><span className="muted">阅读 {article.view_count} · 喜欢 {article.like_count}</span><div className="editor-actions"><Link to={`/article/${article.id}/edit`}>编辑文章</Link><Link to={`/article/${article.id}`}>阅读全文 ↗</Link></div></div></article>)}</div><Pagination className="profile-pagination" current={page} pageSize={8} total={filtered.length} onChange={setPage} hideOnSinglePage showSizeChanger={false} /></> : <div className="surface empty-card"><Empty description={query ? '没有找到匹配的文章' : '你还没有创建文章'} /></div>}
        </section></div>{data.can_manage_tags && <TagManager />}
    </div>;
}
