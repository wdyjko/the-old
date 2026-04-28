import React, { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Statistic, List, Tag, Modal, Descriptions, Spin, message, Button, Form, Input, Space } from 'antd';
import { FileTextOutlined, HourglassOutlined, CheckCircleOutlined, EditOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { useUserStore } from '../../store/userStore';
import api from '../../utils/api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface Order {
    id: number;
    title: string;
    category: string;
    description: string;
    address: string;
    status: string;
    expectedTime: string;
    createdAt: string;
    volunteerId?: number;
    rating?: number;
    comment?: string;
}

interface UserProfileData {
    name: string;
    phone: string;
    address: string;
}

const statusColors: Record<string, string> = {
    under_review: 'purple',
    pending: 'orange',
    accepted: 'blue',
    in_progress: 'cyan',
    submitted: 'orange',
    completed: 'green',
    cancelled: 'red',
    expired: 'default',
    rejected: 'red'
};

const statusText: Record<string, string> = {
    under_review: '待审核',
    pending: '待接单',
    accepted: '已接单',
    in_progress: '服务中',
    submitted: '待您确认',
    completed: '待评价',
    cancelled: '已取消',
    expired: '已过期',
    rejected: '已驳回'
};

const Dashboard: React.FC = () => {
    const { user, updateUser } = useUserStore();
    const navigate = useNavigate();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Profile states
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileDataObj, setProfileDataObj] = useState<UserProfileData | null>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchProfile();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders');
            // Sort by latest
            const sortedOrders = res.data.orders.sort((a: Order, b: Order) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOrders(sortedOrders);
        } catch (error) {
            console.error(error);
            message.error('获取订单数据失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            setProfileDataObj(data.user);
            form.setFieldsValue({
                name: data.user.name,
                phone: data.user.phone,
            });
        } catch (error) {
            console.error('Fetch profile error:', error);
        }
    };

    const onSaveProfile = async (values: Record<string, string>) => {
        setSaving(true);
        try {
            await api.put('/auth/profile', values);
            message.success('个人资料已保存');
            updateUser({ name: values.name, phone: values.phone });
            
            // Refetch and close edit mode
            fetchProfile();
            setIsEditingProfile(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        setIsModalVisible(true);
        setModalLoading(true);
        try {
            const res = await api.get(`/orders/${id}`);
            setSelectedOrder(res.data.order);
        } catch (error) {
            console.error(error);
            message.error('获取订单详情失败');
            setIsModalVisible(false);
        } finally {
            setModalLoading(false);
        }
    };

    // Calculate stats
    const inProgressCount = orders.filter(o => ['accepted', 'in_progress'].includes(o.status)).length;
    const pendingCount = orders.filter(o => ['under_review', 'pending'].includes(o.status)).length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    
    // Recent 5
    const recentActivity = orders.slice(0, 5);

    return (
        <div>
            <Title level={3}>欢迎回来, {user?.name || user?.phone}</Title>
            
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic 
                            title="进行中的需求" 
                            value={inProgressCount} 
                            valueStyle={{ color: '#1890ff' }} 
                            prefix={<HourglassOutlined />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic 
                            title="已解决的求助" 
                            value={completedCount} 
                            valueStyle={{ color: '#52c41a' }} 
                            prefix={<CheckCircleOutlined />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic 
                            title="待接单与待审核" 
                            value={pendingCount} 
                            valueStyle={{ color: '#faad14' }}
                            prefix={<FileTextOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}>
                    <Card 
                        title="个人资料" 
                        extra={
                            !isEditingProfile && (
                                <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditingProfile(true)}>
                                    编辑
                                </Button>
                            )
                        }
                    >
                        {isEditingProfile ? (
                            <Form form={form} layout="vertical" onFinish={onSaveProfile} autoComplete="off">
                                <Form.Item name="name" label="真实姓名" rules={[{ required: true, message: '请输入您的姓名' }]}>
                                    <Input prefix={<UserOutlined />} placeholder="您的姓名" />
                                </Form.Item>
                                <Form.Item name="phone" label="登录手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                                    <Input prefix={<PhoneOutlined />} placeholder="您的手机号" />
                                </Form.Item>
                                <Form.Item style={{ marginBottom: 0 }}>
                                    <Space>
                                        <Button type="primary" htmlType="submit" loading={saving}>保存</Button>
                                        <Button onClick={() => setIsEditingProfile(false)}>取消</Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        ) : (
                            <div style={{ padding: '8px 0' }}>
                                <div style={{ marginBottom: 16 }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>真实姓名</Text>
                                    <Space>
                                        <UserOutlined style={{ color: '#1890ff' }} />
                                        <Text strong>{profileDataObj?.name || '未填写'}</Text>
                                    </Space>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>登录手机号</Text>
                                    <Space>
                                        <PhoneOutlined style={{ color: '#52c41a' }} />
                                        <Text strong>{profileDataObj?.phone || '未填写'}</Text>
                                    </Space>
                                </div>
                            </div>
                        )}
                    </Card>
                </Col>
                
                <Col xs={24} md={12}>
                    <Card title="近期动态">
                        <Spin spinning={loading}>
                            <List
                                itemLayout="horizontal"
                                dataSource={recentActivity}
                                locale={{ emptyText: '暂无动态' }}
                                renderItem={item => {
                                    let renderText = statusText[item.status] || item.status;
                                    let renderColor = statusColors[item.status] || 'default';

                                    if (['under_review', 'pending'].includes(item.status) && new Date(item.expectedTime).getTime() < Date.now()) {
                                        renderText = '已过期';
                                        renderColor = 'default';
                                    }

                                    return (
                                        <List.Item 
                                            style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', transition: 'background 0.3s' }}
                                            className="dashboard-list-item"
                                            onClick={() => handleViewDetails(item.id)}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <List.Item.Meta
                                                avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                                title={item.title}
                                                description={`${dayjs(item.createdAt).format('MM-DD HH:mm')}`}
                                            />
                                            <Tag color={renderColor}>
                                                {renderText}
                                            </Tag>
                                        </List.Item>
                                    );
                                }}
                            />
                        </Spin>
                    </Card>
                </Col>
            </Row>

            <Modal
                title="订单详情"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalVisible(false)}>关闭</Button>,
                    <Button key="goto" type="primary" onClick={() => {
                        setIsModalVisible(false);
                        navigate('/elderly/orders');
                    }}>前往我的订单</Button>
                ]}
                width={600}
            >
                <Spin spinning={modalLoading}>
                    {selectedOrder && (
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="需求标题">{selectedOrder.title}</Descriptions.Item>
                            <Descriptions.Item label="类别">
                                <Tag>{selectedOrder.category}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="当前状态">
                                <Tag color={statusColors[selectedOrder.status]}>{statusText[selectedOrder.status] || selectedOrder.status}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="服务地址">{selectedOrder.address}</Descriptions.Item>
                            <Descriptions.Item label="期望时间">{dayjs(selectedOrder.expectedTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                            <Descriptions.Item label="发布时间">{dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                            <Descriptions.Item label="详细描述">{selectedOrder.description}</Descriptions.Item>
                            
                            {selectedOrder.status === 'completed' && selectedOrder.rating && (
                                <>
                                    <Descriptions.Item label="服务评分">{selectedOrder.rating} 星</Descriptions.Item>
                                    <Descriptions.Item label="评价内容">{selectedOrder.comment || '无'}</Descriptions.Item>
                                </>
                            )}
                        </Descriptions>
                    )}
                </Spin>
            </Modal>
        </div>
    );
};

export default Dashboard;
