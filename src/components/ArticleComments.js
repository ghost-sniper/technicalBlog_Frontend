import React, { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Button, Empty, Input, Modal, Pagination, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import request from '../utils/common';

const options = { skipGlobalError: true };
const errorText = error => error.response?.data?.message || '评论服务暂时不可用，请稍后重试';
const mergeReplies = (left, right) => [...new Map([...left, ...right].map(item => [item.id, item])).values()].sort((a, b) => a.id - b.id);

function CommentRow({ comment, root, canComment, canDelete, onReply, onDelete, deleting }) {
  const prefix = root && comment.reply_to_user_id !== root.user_id;
  return <div className="comment-row" id={`comment-${comment.id}`}>
    <Avatar src={comment.avatar || undefined} size={32}>{comment.username?.slice(0, 1)}</Avatar>
    <div className="comment-main"><div className="comment-meta"><strong>{comment.username}</strong><time>{String(comment.created_at).replace('T', ' ').slice(0, 16)}</time></div>
      <p className="comment-text">{prefix && <span className="comment-recipient">回复 {comment.reply_to_username}：</span>}{comment.content}</p>
      <div className="comment-actions">{canComment && <Button size="small" type="text" onClick={() => onReply(comment, root || comment)}>回复</Button>}{canDelete && <Button size="small" type="text" danger loading={deleting === comment.id} onClick={() => onDelete(comment)}>删除</Button>}</div>
    </div>
  </div>;
}

function Thread({ articleId, root, ...actions }) {
  const [replies, setReplies] = useState(root.replies);
  const [cursor, setCursor] = useState(root.next_cursor);
  const [hasMore, setHasMore] = useState(root.reply_count > root.replies.length);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(0);
  const loading = useRef(false);
  useEffect(() => {
    version.current += 1;
    setReplies(root.replies); setCursor(root.next_cursor); setHasMore(root.reply_count > root.replies.length); setError(''); setBusy(false); loading.current = false;
    return () => { version.current += 1; };
  }, [root]);
  const more = async () => {
    if (loading.current) return;
    loading.current = true; setBusy(true); setError('');
    const current = version.current;
    try {
      const { data } = await request.get(`api/article/${articleId}/comments/${root.id}/replies`, { ...options, params: { after: cursor } });
      if (current !== version.current) return;
      setReplies(items => mergeReplies(items, data.replies)); setCursor(data.next_cursor); setHasMore(data.has_more);
    } catch (e) { if (current === version.current) setError(errorText(e)); }
    finally { if (current === version.current) { loading.current = false; setBusy(false); } }
  };
  const collapse = () => {
    version.current += 1; loading.current = false; setBusy(false); setError('');
    const initial = replies.slice(0, 3);
    setReplies(initial); setCursor(initial.at(-1)?.id || 0); setHasMore(root.reply_count > initial.length);
  };
  return <div className="comment-thread">
    <CommentRow comment={root} {...actions} />
    {!!replies.length && <div className="comment-replies" aria-label={`${root.username} 的评论回复`}>
      {replies.map(item => <CommentRow key={item.id} comment={item} root={root} {...actions} />)}
      <div className="comment-actions">{hasMore && <Button size="small" type="link" loading={busy} onClick={more}>更多回复（共 {root.reply_count} 条）</Button>}{replies.length > 3 && <Button size="small" type="link" onClick={collapse}>收起</Button>}</div>
      {error && <Alert type="error" title={error} action={<Button size="small" onClick={more}>重试</Button>} />}
    </div>}
  </div>;
}

export default function ArticleComments({ articleId }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [modal, holder] = Modal.useModal();
  const input = useRef(null);
  const submitting = useRef(false);
  const deletingRef = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    generation.current += 1;
    setLoading(true); setLoadError(''); setData(null);
    request.get(`api/article/${articleId}/comments`, { ...options, params: { page } }).then(({ data }) => {
      if (!active) return;
      if (page > 1 && !data.comments.length) { setPage(Math.max(1, Math.ceil(data.count / 10))); return; }
      setData(data);
    }).catch(e => { if (active) setLoadError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [articleId, page, retry]);
  const submit = async event => {
    event.preventDefault();
    const trimmed = content.trim();
    if (submitting.current || !data?.can_comment) return;
    if (!trimmed || [...trimmed].length > 2000) { setError('评论须为 1～2000 字'); return; }
    submitting.current = true; setSaving(true); setError('');
    const current = generation.current;
    try {
      const { data: item } = await request.post(`api/article/${articleId}/comments`, { content: trimmed, reply_to_comment_id: target?.id || null }, options);
      if (!mounted.current || generation.current !== current) return;
      setContent(''); setTarget(null);
      if (!item.root_id) { setPage(1); setRetry(v => v + 1); }
      else setData(previous => ({ ...previous, comments: previous.comments.map(root => root.id === item.root_id ? { ...root, replies: mergeReplies(root.replies, [item]), reply_count: root.reply_count + 1 } : root) }));
    } catch (e) {
      if (mounted.current && generation.current === current) { setError(errorText(e)); if ([401, 403, 404].includes(e.response?.status)) setRetry(v => v + 1); }
    } finally { submitting.current = false; if (mounted.current) setSaving(false); }
  };
  const reply = (comment, root) => {
    if (saving) return;
    setTarget({ id: comment.id, rootId: root.id, username: comment.username }); setError(''); input.current?.focus();
  };
  const remove = comment => modal.confirm({
    title: '删除这条评论？', content: comment.root_id ? '删除后该条回复将不再展示。' : '此操作将同时删除这条评论下的全部回复。', okText: '删除', cancelText: '取消', okButtonProps: { danger: true },
    onOk: async () => {
      if (deletingRef.current || !mounted.current) return;
      deletingRef.current = true; setDeleting(comment.id); setError('');
      try {
        await request.delete(`api/article/${articleId}/comments/${comment.id}`, options);
        if (!mounted.current) return;
        if (target?.id === comment.id || target?.rootId === comment.id) setTarget(null);
        setRetry(v => v + 1);
      } catch (e) { if (mounted.current) setError(errorText(e)); throw e; }
      finally { deletingRef.current = false; if (mounted.current) setDeleting(null); }
    }
  });
  return <section className="surface comments-card" aria-label="文章评论">{holder}
    <div className="section-heading"><h2>评论 {data && <span className="count">{data.count} 条讨论</span>}</h2></div>
    {error && <Alert type="error" showIcon title={error} />}
    {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : loadError ? <Alert type="error" showIcon title={loadError} action={<Button onClick={() => setRetry(v => v + 1)}>重试</Button>} /> : data && <>
      {data.can_comment ? <form className="comment-form" onSubmit={submit}>
        <label htmlFor={`comment-input-${articleId}`}>{target ? `回复 ${target.username}` : '发表评论'}</label>
        {target && <Button type="link" size="small" disabled={saving} onClick={() => setTarget(null)}>取消回复</Button>}
        <Input.TextArea id={`comment-input-${articleId}`} ref={input} value={content} onChange={e => setContent(e.target.value)} disabled={saving} autoSize={{ minRows: 3, maxRows: 10 }} placeholder="分享你的想法…" />
        <div className="comment-form-footer"><span className="muted">{[...content.trim()].length} / 2000 字 · 纯文本</span><Button type="primary" htmlType="submit" loading={saving}>发表{target ? '回复' : '评论'}</Button></div>
      </form> : <p className="muted">{!data.comments_enabled ? '该文章已关闭评论，已有评论仍可阅读。' : <>请<Link to="/user">登录</Link>后发表评论。</>}</p>}
      {!data.comments.length ? <Empty description="暂无评论，来分享你的想法吧" /> : data.comments.map(root => <Thread key={root.id} articleId={articleId} root={root} canComment={data.can_comment && !saving} canDelete={data.can_delete && !saving} onReply={reply} onDelete={remove} deleting={deleting} />)}
      <Pagination className="profile-pagination" current={page} total={data.count} pageSize={10} showSizeChanger={false} hideOnSinglePage disabled={saving || deleting !== null} onChange={value => { setPage(value); setTarget(null); }} />
    </>}
  </section>;
}
