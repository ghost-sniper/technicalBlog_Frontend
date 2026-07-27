import { Card, Col, Row } from 'antd';
import bg from '../assets/gajeel_and_levy.png'
import { Layout } from "antd";
import { Form } from 'antd';
import { Input } from 'antd';
import { Button } from 'antd';
import { Checkbox } from 'antd';
import React from 'react';
const { Sider, Content } = Layout;
function User() {
    const [isLogin, setIsLogin] = React.useState(true);
    const onFinish = values => {
        console.log('Success:', values);
    };
    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };


    const handleLogin = (values) => {
        // Handle login logic here
        console.log('Login values:', values);
    }

    const handleRegister = (values) => {
        // Handle register logic here
        console.log('Register values:', values);
    }

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