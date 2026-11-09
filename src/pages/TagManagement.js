import React, { useEffect, useState } from 'react';
import { Alert, Button, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import request from '../utils/common';
import TagManager from './TagManager';

export default function TagManagement() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus('loading');
    request.get('api/user/me', { skipGlobalError: true }).then(({ data }) => {
      if (active) setStatus(data.can_manage_tags ? 'allowed' : 'forbidden');
    }).catch(error => {
      if (!active) return;
      if (error.response?.status === 401) setStatus('login');
      else if (error.response?.status === 403) setStatus('forbidden');
      else { setStatus('error'); setError(error.response?.data?.message || '页面加载失败，请稍后重试'); }
    });
    return () => { active = false; };
  }, [retry]);
  return <div className="tag-management-page">
    <Link className="back-link" to="/user">← 返回个人中心</Link>
    <div className="section-heading"><h1>标签管理</h1></div>
    {status === 'loading' && <div className="surface loading-card"><Skeleton active /></div>}
    {status === 'allowed' && <TagManager />}
    {status === 'login' && <Alert type="info" showIcon title="请先登录管理员账号" action={<Link to="/user">前往登录</Link>} />}
    {status === 'forbidden' && <Alert type="warning" showIcon title="此页面仅限管理员访问" />}
    {status === 'error' && <Alert type="error" showIcon title={error} action={<Button onClick={() => setRetry(value => value + 1)}>重试</Button>} />}
  </div>;
}
