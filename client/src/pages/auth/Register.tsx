import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Radio } from 'antd';
import { PhoneOutlined, LockOutlined, UserOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

const { Title, Text } = Typography;

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: { role: string; phone: string; password: string; name: string; idCard: string }) => {
        setLoading(true);
        try {
            await api.post('/auth/register', values);
            message.success('注册成功，请登录');
            navigate('/login');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2} style={{ color: '#1890ff', margin: 0 }}>欢迎注册</Title>
                    <Text type="secondary">加入智慧助老大家庭</Text>
                </div>

                <Form name="register" onFinish={onFinish} size="large" layout="vertical">
                    <Form.Item name="role" label="您是？" initialValue="elderly" rules={[{ required: true }]}>
                        <Radio.Group optionType="button" buttonStyle="solid">
                            <Radio.Button value="elderly">需要帮助 (老人/家属)</Radio.Button>
                            <Radio.Button value="volunteer">提供帮助 (志愿者)</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item 
                        name="phone" 
                        rules={[
                            { required: true, message: '请输入手机号!' },
                            { pattern: /^1[3-9]\d{9}$/, message: '请输入由11位数字组成的有效手机号码!' }
                        ]}
                        validateTrigger="onBlur"
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="手机号 (11位数字，作为登录账号)" maxLength={11} />
                    </Form.Item>
                    
                    <Form.Item 
                        name="password" 
                        rules={[
                            { required: true, message: '请输入密码!' },
                            { max: 12, message: '密码最长不能超过 12 位!' }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="设置密码 (最长12位)" maxLength={12} />
                    </Form.Item>

                    <Form.Item name="name" rules={[{ required: true, message: '请输入真实姓名!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="真实姓名" />
                    </Form.Item>

                    <Form.Item name="idCard" rules={[{ required: true, message: '请输入身份证号以便审核!' }]}>
                        <Input prefix={<IdcardOutlined />} placeholder="身份证号码" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                            注册
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        已有账号？ <Link to="/login">返回登录</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register;
