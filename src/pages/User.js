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
    const onFinish = values => {
        console.log('Success:', values);
    };
    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };
    return (
        <Layout style={{ backgroundImage: `url(${bg})`, height: '100vh', width: '100wh', cover: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
            <Sider width="65%" style={{ background: 'transparent' }}></Sider>
            <Content style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '8px', margin: '20px', alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                <Card title="登陆/注册" style={{ width: '80%', fontFamily: 'Arial, sans-serif' }} headStyle={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                    <Form name="userForm" labelCol={{ span: 3 }}
                        wrapperCol={{ span: 20 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off">
                        <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                            <Input placeholder="请输入用户名" />
                        </Form.Item>
                        <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                            <Input.Password placeholder="请输入密码" />
                        </Form.Item>
                        <Form.Item name="remember" valuePropName="checked" label={null}>
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>

                        <Form.Item label={null}>
                            <Row width="100%" justify="space-evenly" align="middle">
                                <Col>
                                    <Button type="primary" htmlType="submit">
                                        登陆
                                    </Button>
                                </Col>
                                <Col>
                                    <Button type="default" htmlType="submit">
                                        注册
                                    </Button>
                                </Col>
                            </Row>
                        </Form.Item>
                    </Form>
                </Card>
            </Content>
        </Layout>)
}
export default User;