import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useUserStore } from '../../store/userStore';

const { Title, Text } = Typography;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const setAuth = useUserStore((state) => state.setAuth);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const doLogin = async (values: { phone: string; password: string }) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', values);
            setAuth(data.token, data.user);
            message.success('登录成功!');
            
            // Redirect based on role
            if (data.user.role === 'elderly') navigate('/elderly');
            else if (data.user.role === 'volunteer') navigate('/volunteer');
            else if (data.user.role === 'admin') navigate('/admin');
            
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '登录失败，请检查账号和密码');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: { phone: string; password: string }) => {
        await doLogin(values);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2} style={{ color: '#1890ff', margin: 0 }}>智慧助老</Title>
                    <Text type="secondary">社区互助服务对接平台</Text>
                </div>

                <Form name="login" form={form} onFinish={onFinish} size="large">
                    <Form.Item 
                        name="phone" 
                        rules={[
                            { required: true, message: '请输入手机号或账号!' },
                            { pattern: /^(1[3-9]\d{9}|admin)$/, message: '格式错误：必须为11位手机号或 admin 账号!' }
                        ]}
                        validateTrigger="onBlur"
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="请输入手机号或账号" maxLength={11} />
                    </Form.Item>
                    
                    <Form.Item 
                        name="password" 
                        rules={[
                            { required: true, message: '请输入密码!' },
                            { max: 12, message: '密码不能超过12位!' }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="请输入密码 (最长12位)" maxLength={12} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                            登录
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        没有账号？ <Link to="/register">立即注册</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;

