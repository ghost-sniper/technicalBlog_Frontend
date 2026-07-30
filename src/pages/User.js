import { Card, Col, Row } from 'antd';
import bg from '../assets/gajeel_and_levy.png'
import { Layout } from "antd";
import { Form } from 'antd';
import { Input } from 'antd';
import { Button } from 'antd';
import { Checkbox } from 'antd';
import { message } from 'antd';
import React from 'react';
import { useEffect } from 'react';
import E2EE from '@chatereum/react-e2ee';
const { Sider, Content } = Layout;
function User() {
    const [isLogin, setIsLogin] = React.useState(true);
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [publicKey, setPublicKey] = React.useState(null);
    const [encryptedPassword, setEncryptedPassword] = React.useState('');
    const onFinish = values => {
        console.log('Success:', values);
    };
    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };


    const handleLogin = async (value) => {
        try {
            setEncryptedPassword(await E2EE.encryptPlaintext({ public_key: publicKey, plain_text: password }));
            console.log('Encrypted Password:', encryptedPassword.cipher_text);
            console.log('Encrypted Password:', encryptedPassword.iv);
            console.log('Encrypted Password:', encryptedPassword.aes_key);
        } catch (error) {
            message.error('加密密码失败，请检查公钥是否正确');
        }
        try {
            console.log('密码:', password);
            console.log('用户名: ', username);
            const response = await fetch("http://localhost:8600/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ public_key: publicKey, username: username, password: encryptedPassword.cipher_text, iv: encryptedPassword.iv, aes_key: encryptedPassword.aes_key })
            });
        } catch (error) {
            message.error('登录失败，请检查用户名和密码');
        }
    };

    const handleRegister = async (value) => {
        
    }

    const fetchPublicKey = async () => {
        try {
            const response = await fetch("http://localhost:8600/publicKey");
            const data = await response.text();
            console.log('Public Key:', data);
            setPublicKey(data);
        } catch (error) {
            message.error('获取公钥失败，请检查网络设置');
        }
    };


    useEffect(() => {
        fetchPublicKey();
    });
    return (
        <Layout style={{ backgroundImage: `url(${bg})`, height: '100vh', width: '100wh', cover: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
            <Sider width="65%" style={{ background: 'transparent' }}></Sider>
            <Content style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '8px', margin: '20px', alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                <Card title={isLogin ? "登陆" : "注册"} style={{ width: '70%', fontFamily: 'Arial, sans-serif' }} headStyle={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                    <Form name="userForm" labelCol={{ span: isLogin ? 3 : 5 }}
                        wrapperCol={{ span: 20 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off">
                        <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入邮箱或手机号' }]}>
                            <Input value={username} placeholder="请输入邮箱或手机号" onChange={(e) => setUsername(e.target.value)} />
                        </Form.Item>
                        <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                            <Input.Password value={password} placeholder="请输入密码" onChange={(e) => setPassword(e.target.value)} />
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
                                    <Button type="primary" htmlType="submit" onClick={handleLogin}>
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
                                <Col><Button type="primary" htmlType="submit" onClick={handleRegister}>
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