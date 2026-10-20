import { Card, Col, Row } from 'antd';
import bg from '../assets/gajeel_and_levy.png'
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
const { Sider, Content } = Layout;
function User() {
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
            messageApi.success('登录成功');
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
        <Layout style={{ backgroundImage: `url(${bg})`, height: '100vh', width: '100wh', cover: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
            {modalContextHolder}
            {messageContextHolder}
            <Sider width="65%" style={{ background: 'transparent' }}></Sider>
            <Content style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '8px', margin: '20px', alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                <Card title={isLogin ? "登陆" : "注册"} style={{ width: '70%', fontFamily: 'Arial, sans-serif' }} styles={{ header: { textAlign: 'center', fontSize: '24px', fontWeight: 'bold' } }}>
                    <Form name="userForm" labelCol={{ span: isLogin ? 3 : 5 }}
                        wrapperCol={{ span: 20 }}
                        style={{ maxWidth: 600 }}
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
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item> : null}
                        {isLogin ? null : <Form.Item label="确认密码" name="confirmPassword" rules={[{ required: true, message: '请确认密码' }]}>
                            <Input.Password placeholder="请确认密码" />
                        </Form.Item>}
                        {isLogin ? null : <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
                            <Input placeholder="请输入邮箱" />
                        </Form.Item>}
                        <Form.Item label={null}>
                            {isLogin ? <Row width="100%" justify="space-evenly" align="middle">
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
                            </Row> : <Row width="100%" justify="space-evenly" align="middle">
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
            </Content>
        </Layout>)
}
export default User;
