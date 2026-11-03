import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Skeleton, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import request_client from '../utils/common';
import { articleImageUrl } from '../utils/articleImages';

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tagOptions, setTagOptions] = useState([]);
  const [tagQuery, setTagQuery] = useState('');
  const [original, setOriginal] = useState(null);
  const [draft, setDraft] = useState({ article_title: '', article_content: '', prospectus: '', tags: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const markdownRef = useRef(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [messageApi, messageHolder] = message.useMessage();
  const [modal, modalHolder] = Modal.useModal();
  const dirty = original && (draft.article_title !== original.article_title || draft.article_content !== original.article_content || draft.prospectus !== (original.prospectus || '') || JSON.stringify(draft.tags) !== JSON.stringify((original.tags || []).map(tag => tag.tag_name)));
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      request_client.get('api/tags', { params: { q: tagQuery }, skipGlobalError: true }).then(response => {
        if (active) setTagOptions((response.data.suggestions || response.data.tags || []).map(tag => ({ value: tag.tag_name, label: tag.tag_name })));
      }).catch(() => {});
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [tagQuery]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setOriginal(null);
    request_client.get(`api/article/${id}/edit`, { skipGlobalError: true }).then(response => {
      if (!active) return;
      setOriginal(response.data);
      setDraft({ article_title: response.data.article_title, article_content: response.data.article_content, prospectus: response.data.prospectus || '', tags: (response.data.tags || []).map(tag => tag.tag_name) });
    }).catch(error => { if (active) setError(error.response?.data?.message || '无法加载文章，请稍后重试'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);
  useEffect(() => {
    const beforeUnload = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  const change = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const uploadImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || saving || uploading) return;
    if (file.size > 5 * 1024 * 1024) {
      messageApi.error('图片大小不能超过 5 MB');
      return;
    }
    const content = draft.article_content;
    const position = markdownRef.current?.resizableTextArea?.textArea?.selectionStart ?? content.length;
    setUploading(true);
    setError('');
    try {
      const { data } = await request_client.post(`api/article/${id}/images`, file, {
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: 30000,
        skipGlobalError: true,
      });
      const image = `\n\n![图片](${data.url})\n\n`;
      change('article_content', content.slice(0, position) + image + content.slice(position));
      requestAnimationFrame(() => {
        const textarea = markdownRef.current?.resizableTextArea?.textArea;
        textarea?.focus();
        textarea?.setSelectionRange(position + image.length, position + image.length);
      });
    } catch (error) {
      setError(error.response?.data?.message || '图片上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };
  const save = async () => {
    if (saving || uploading) return;
    if (!draft.article_title.trim() || !draft.article_content.trim()) { messageApi.error('请填写标题和 Markdown 正文'); return; }
    setSaving(true); setError('');
    try {
      const response = await request_client.put(`api/article/${id}/edit`, { ...draft, expected_update_time: original.update_time }, { skipGlobalError: true });
      setOriginal(response.data);
      setDraft({ article_title: response.data.article_title, article_content: response.data.article_content, prospectus: response.data.prospectus || '', tags: (response.data.tags || []).map(tag => tag.tag_name) });
      const actualTags = (response.data.tags || []).map(tag => tag.tag_name);
      const replaced = draft.tags.filter(name => !actualTags.includes(name));
      messageApi.success(replaced.length ? `文章已保存，相似标签已合并为：${actualTags.join('、')}` : '文章已保存');
    } catch (error) { setError(error.response?.data?.message || '保存失败，你的修改仍保留在编辑器中，请稍后重试'); }
    finally { setSaving(false); }
  };
  const cancel = () => {
    if (!dirty) navigate(`/article/${id}`);
    else modal.confirm({ title: '放弃未保存的修改？', content: '当前修改尚未保存，离开后将丢失。', okText: '放弃修改', cancelText: '继续编辑', onOk: () => navigate(`/article/${id}`) });
  };
  return <section className="editor-page">{messageHolder}{modalHolder}<div className="section-heading"><div><p className="eyebrow">MARKDOWN EDITOR</p><h1>编辑文章</h1></div><div className="editor-actions"><Button onClick={cancel} disabled={saving || uploading}>返回文章</Button><Button type="primary" loading={saving} disabled={!original || !dirty || uploading} onClick={save}>保存修改</Button></div></div>
    {error && <Alert className="profile-alert" type="error" showIcon title={error} action={!original && <Button onClick={() => setRetry(value => value + 1)}>重试</Button>} />}
    {loading ? <div className="surface loading-card"><Skeleton active /></div> : original && <><div className="surface editor-fields"><label htmlFor="article-title">文章标题</label><Input id="article-title" maxLength={255} showCount value={draft.article_title} onChange={event => change('article_title', event.target.value)} disabled={saving} /><label htmlFor="article-summary">文章摘要</label><Input.TextArea id="article-summary" maxLength={255} showCount autoSize={{ minRows: 2, maxRows: 4 }} value={draft.prospectus} onChange={event => change('prospectus', event.target.value)} disabled={saving} /><label htmlFor="article-tags">文章标签</label><Select id="article-tags" aria-label="文章标签" mode="tags" value={draft.tags} options={tagOptions} filterOption={false} onSearch={setTagQuery} onChange={tags => { if (tags.length <= 10 && tags.every(name => name.trim() && name.length <= 40)) change('tags', tags); else messageApi.warning('最多选择 10 个标签，每个标签最多 40 字'); }} disabled={saving} placeholder="选择已有标签，或输入新标签后按回车" /><span className="muted">输入时显示相近标签；保存时忽略大小写和空格，相似度达到 80% 时复用已有标签。</span></div><div className="editor-grid"><div className="surface editor-pane"><label htmlFor="markdown-content">Markdown 正文</label><label>上传图片 <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" disabled={saving || uploading} onChange={uploadImage} /></label><span className="muted">{uploading ? '正在上传图片…' : '支持 PNG、JPEG、GIF、WebP，单张最多 5 MB'}</span><Input.TextArea ref={markdownRef} id="markdown-content" value={draft.article_content} onChange={event => change('article_content', event.target.value)} disabled={saving || uploading} spellCheck={false} /><span className="muted">{dirty ? '有未保存的修改' : '所有修改已保存'} · 支持标题、列表、代码块和表格</span></div><section className="surface editor-pane" aria-label="Markdown 实时预览"><h2>实时预览</h2><div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={articleImageUrl}>{draft.article_content}</ReactMarkdown></div></section></div></>}
  </section>;
}
