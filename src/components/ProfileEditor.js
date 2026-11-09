import React, { useRef, useState } from 'react';
import { Alert, Input, Modal } from 'antd';
import request from '../utils/common';

export default function ProfileEditor({ user, onSaved, onClose }) {
  const [draft, setDraft] = useState({ username: user.username || '', email: user.email || '', phone_number: user.phone_number || '', introduction: user.introduction || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const change = key => event => setDraft(value => ({ ...value, [key]: event.target.value }));
  const save = async () => {
    if (saving.current) return;
    if (!draft.username.trim()) { setError('请填写用户名'); return; }
    saving.current = true; setBusy(true); setError('');
    try {
      const { data } = await request.put('api/user/me', draft, { skipGlobalError: true });
      onSaved(data.user);
    } catch (e) { setError(e.response?.data?.message || '保存失败，请稍后重试'); }
    finally { saving.current = false; setBusy(false); }
  };
  return <Modal open title="编辑基本信息" okText="保存资料" cancelText="取消" confirmLoading={busy} cancelButtonProps={{ disabled: busy }} closable={!busy} maskClosable={!busy} keyboard={!busy} onCancel={onClose} onOk={save}>
    {error && <Alert type="error" showIcon title={error} />}
    <div className="profile-edit-fields">
      <label htmlFor="profile-username">用户名</label><Input id="profile-username" value={draft.username} onChange={change('username')} maxLength={32} disabled={busy} />
      <label htmlFor="profile-email">邮箱</label><Input id="profile-email" type="email" value={draft.email} onChange={change('email')} maxLength={32} disabled={busy} />
      <p className="muted">邮箱用于登录，修改后请使用新邮箱登录。</p>
      <label htmlFor="profile-phone">手机号</label><Input id="profile-phone" type="tel" value={draft.phone_number} onChange={change('phone_number')} maxLength={16} disabled={busy} placeholder="可选，可带国际区号 +" />
      <label htmlFor="profile-introduction">个人简介</label><Input.TextArea id="profile-introduction" value={draft.introduction} onChange={change('introduction')} maxLength={4096} autoSize={{ minRows: 3, maxRows: 8 }} disabled={busy} />
    </div>
  </Modal>;
}
