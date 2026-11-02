import { Alert, Card, Col, Row, Skeleton } from 'antd';
import Profile from './Profile';
import { Layout } from "antd";
import { Form } from 'antd';
import { Input } from 'antd';
import { Button } from 'antd';
import { Checkbox } from 'antd';
import { message, Modal } from 'antd';
import React from 'react';
import { useEffect } from 'react';
import E2EE from '@chatereum/react-e2ee';
import request_client from '../utils/common';

function LoginForm({ onSuccess }) {
    const [isLogin, setIsLogin] = React.useState(true);
    const [publicKey, setPublicKey] = React.useState(null);
    const [loggingIn, setLoggingIn] = React.useState(false);
    const [modal, modalContextHolder] = Modal.useModal();
    const [messageApi, messageContextHolder] = message.useMessage();


    const handleLogin = async ({ username, password }) => {
        if (loggingIn) return;
        if (!publicKey) {
            modal.error({ title: '登录失败', content: '登录公钥尚未就绪，请刷新页面后重试', okText: '确定' });
            return;
        }
        setLoggingIn(true);
        let encryptedPassword;
        try {
            encryptedPassword = await E2EE.encryptPlaintext({ public_key: publicKey, plain_text: password });
        } catch (error) {
            setLoggingIn(false);
            modal.error({ title: '登录失败', content: '加密密码失败，请刷新页面后重试', okText: '确定' });
            return;
        }
        try {
            await request_client.post("api/login", { public_key: publicKey, username: username.trim(), password: encryptedPassword.cipher_text, iv: encryptedPassword.iv, aes_key: encryptedPassword.aes_key }, { skipGlobalError: true });
            onSuccess();
        } catch (error) {
            const data = error.response?.data;
            const errorMessage = typeof data?.message === 'string' && data.message.trim()
                ? data.message
                : error.response ? '登录失败，请稍后重试' : '请求超时或网络错误，请检查网络设置';
            modal.error({ title: '登录失败', content: errorMessage, okText: '确定' });
        } finally {
            setLoggingIn(false);
        }
    };

    const handleRegister = async () => {
        messageApi.info('注册功能尚未开放，请联系管理员');
    }

    useEffect(() => {
        let active = true;
        const fetchPublicKey = async () => {
            try {
                const response = await request_client.get("api/publicKey", { skipGlobalError: true });
                if (active) setPublicKey(response.data);
            } catch (error) {
                if (active) messageApi.error('获取公钥失败，请检查网络设置');
            }
        };
        fetchPublicKey();
        return () => { active = false; };
    }, [messageApi]);
    return (
        <Layout className="auth-page">
            {modalContextHolder}
            {messageContextHolder}
            <section className="auth-intro"><p className="eyebrow">WELCOME BACK</p><h1>欢迎回来。<br />继续你的探索。</h1><p>记录新的想法，连接每一次成长。</p><div className="auth-decoration" aria-hidden="true">✳</div></section>
            <div className="auth-form-wrap">
                <Card className="auth-card" title={isLogin ? "账号登录" : "创建账号"}>
                    <p className="muted">{isLogin ? '登录后，继续记录与分享。' : '注册功能尚未开放，请联系管理员。'}</p>
                    <Form name="userForm" layout="vertical" size="large"
                        initialValues={{ remember: true }}
                        onFinish={isLogin ? handleLogin : handleRegister}
                        autoComplete="off">
                        <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入邮箱或手机号' }]}>
                            <Input placeholder="请输入邮箱或手机号" />
                        </Form.Item>
                        <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                            <Input.Password placeholder="请输入密码" />
                        </Form.Item>
                        {isLogin ? <Form.Item name="remember" valuePropName="checked" label={null}>
                            <Checkbox>记住我</Checkbox>
                        </Form.Item> : null}
                        {isLogin ? null : <Form.Item label="确认密码" name="confirmPassword" rules={[{ required: true, message: '请确认密码' }]}>
                            <Input.Password placeholder="请确认密码" />
                        </Form.Item>}
                        {isLogin ? null : <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
                            <Input placeholder="请输入邮箱" />
                        </Form.Item>}
                        <Form.Item label={null}>
                            {isLogin ? <Row className="auth-actions" justify="space-between" align="middle">
                                <Col>
                                    <Button type="primary" htmlType="submit" loading={loggingIn}>
                                        登陆
                                    </Button>
                                </Col>
                                <Col>
                                    <Button type="default" htmlType="reset">
                                        重置
                                    </Button>
                                </Col>
                                <Col>
                                    <p style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => setIsLogin(false)}>没有账号？注册</p>
                                </Col>
                            </Row> : <Row className="auth-actions" justify="space-between" align="middle">
                                <Col><Button type="primary" htmlType="submit">
                                    注册
                                </Button></Col><Col>
                                    <Button type="default" htmlType="reset">
                                        重置
                                    </Button>
                                </Col><Col><p style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => setIsLogin(true)}>已有账号？登陆</p></Col></Row>}
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </Layout>)
}
function User() {
    const [checking, setChecking] = React.useState(true);
    const [authenticated, setAuthenticated] = React.useState(false);
    const [error, setError] = React.useState('');
    useEffect(() => {
        let active = true;
        request_client.get('api/user/me', { skipGlobalError: true }).then(response => {
            if (active) setAuthenticated(Boolean(response.data?.user));
        }).catch(error => {
            if (active && error.response?.status !== 401) setError(error.response?.data?.message || '无法恢复登录状态，请检查网络后重试');
        }).finally(() => { if (active) setChecking(false); });
        return () => { active = false; };
    }, []);
    if (checking) return <div className="surface loading-card"><Skeleton active /></div>;
    if (authenticated) return <Profile onLoggedOut={() => { setAuthenticated(false); setError(''); }} />;
    return <>{error && <Alert type="warning" showIcon title={error} className="profile-alert" />}<LoginForm onSuccess={() => { setError(''); setAuthenticated(true); }} /></>;
}
export default User;
