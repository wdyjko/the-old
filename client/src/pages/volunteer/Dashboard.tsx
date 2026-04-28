import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, message, Row, Col, Statistic, Rate, Modal, Typography, Space, Form, Input, Empty, Upload } from 'antd';
import { CheckCircleOutlined, TrophyOutlined, ClockCircleOutlined, EnvironmentOutlined, UserOutlined, PhoneOutlined, GiftOutlined, QrcodeOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { QRCode } from 'antd';
import api from '../../utils/api';
import { useUserStore } from '../../store/userStore';

const { Text, Paragraph, Title } = Typography;

const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待接单', color: 'orange' },
    accepted: { label: '已接单', color: 'blue' },
    in_progress: { label: '服务中', color: 'processing' },
    submitted: { label: '已提交', color: 'orange' },
    completed: { label: '已完成', color: 'green' },
    expired: { label: '已过期', color: 'default' },
    rejected: { label: '已驳回', color: 'red' },
};

interface Order {
    id: number;
    title: string;
    category: string;
    address: string;
    expectedTime: string;
    status: string;
    rating?: number;
    description?: string;
    comment?: string;
    pointsReward?: number;
}

interface PrizeRedemption {
    id: number;
    prizeName: string;
    cost: number;
    targetPhone: string;
    status: string;
    createdAt: string;
}

interface UserProfileData {
    name: string;
    phone: string;
    address: string;
    points: number;
    prizeRedemptions: PrizeRedemption[];
}

const Dashboard: React.FC = () => {
    const { user, updateUser } = useUserStore();
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Profile form states
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileDataObj, setProfileDataObj] = useState<UserProfileData | null>(null);

    // Modal state for order details
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [completionModalOpen, setCompletionModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);
    const [completionForm] = Form.useForm();

    // QR Code Modal for Prizes
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedPrize, setSelectedPrize] = useState<PrizeRedemption | null>(null);

    const showQrModal = (prize: PrizeRedemption) => {
        setSelectedPrize(prize);
        setQrModalOpen(true);
    };

    const fetchOrdersAndProfile = async () => {
        setLoading(true);
        try {
            // Fetch user's orders
            const { data: mine } = await api.get('/orders', { params: { tab: 'mine' } });
            setMyOrders(mine.orders);

            // Fetch profile data
            const { data: profileRes } = await api.get('/auth/profile');
            setProfileDataObj(profileRes.user);
            form.setFieldsValue({
                name: profileRes.user.name,
                phone: profileRes.user.phone,
                address: profileRes.user.address,
            });
            if (profileRes.user.points !== user?.points) {
                updateUser({ points: profileRes.user.points });
            }
        } catch {
            message.error('数据加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrdersAndProfile(); }, []);

    const onSaveProfile = async (values: Record<string, string>) => {
        setSaving(true);
        try {
            await api.put('/auth/profile', values);
            message.success('个人资料已保存');
            updateUser({ name: values.name, phone: values.phone });
            
            // Refetch and close edit mode
            fetchOrdersAndProfile();
            setIsEditingProfile(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '保存失败');
        } finally {
            setSaving(false);
        }
    };



    const handleUpdateStatus = async (orderId: number, status: string, extraData: any = {}) => {
        try {
            const res = await api.put(`/orders/${orderId}/status`, { status, ...extraData });
            message.success('状态更新成功！');
            
            // Sync new points globally if the backend returned them
            if (res.data.newPoints !== undefined) {
                updateUser({ points: res.data.newPoints });
            }
            fetchOrdersAndProfile();
            return true;
        } catch (error: any) {
            message.error(error.response?.data?.message || '更新状态失败');
            return false;
        }
    };

    const handleConfirmCompletion = async (values: any) => {
        if (!selectedOrder) return;
        setSubmitting(true);

        // Convert fileList to base64 images
        const photoPromises = fileList.map(item => {
            if (item.url) return Promise.resolve(item.url);
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(item.originFileObj);
                reader.onload = () => resolve(reader.result as string);
            });
        });

        const photos = await Promise.all(photoPromises);

        const success = await handleUpdateStatus(selectedOrder.id, 'submitted', {
            completionDescription: values.description,
            completionPhotos: photos.length > 0 ? photos : null
        });
        if (success) {
            setCompletionModalOpen(false);
            setFileList([]);
            completionForm.resetFields();
        }
        setSubmitting(false);
    };

    const handleUploadChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList);
    };

    const showOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailModalOpen(true);
    };

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="我的积分" value={user?.points || 0} prefix={<TrophyOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="已完成服务" value={myOrders.filter((o: Order) => o.status === 'completed').length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="进行中任务" value={myOrders.filter((o: Order) => o.status === 'in_progress' || o.status === 'accepted').length} /></Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={24}>
                    <Card 
                        title={
                            <Space>
                                <span>个人资料</span>
                                {profileDataObj?.prizeRedemptions?.some((p: any) => p.prizeName.includes('公益之星') && p.status === 'shipped') && (
                                    <Tag color="gold" icon={<TrophyOutlined />} style={{ margin: 0 }}>公益之星</Tag>
                                )}
                            </Space>
                        } 
                        extra={
                            !isEditingProfile && (
                                <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditingProfile(true)}>
                                    编辑
                                </Button>
                            )
                        }
                        bordered={false} 
                        loading={loading}
                    >
                        <div style={{ maxWidth: 600 }}>
                            {isEditingProfile ? (
                                <Form form={form} layout="vertical" onFinish={onSaveProfile} autoComplete="off">
                                    <Form.Item name="name" label="真实姓名" rules={[{ required: true, message: '请输入您的姓名' }]}>
                                        <Input prefix={<UserOutlined />} placeholder="您的姓名" size="large" />
                                    </Form.Item>
                                    <Form.Item name="phone" label="登录手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                                        <Input prefix={<PhoneOutlined />} placeholder="您的手机号" size="large" />
                                    </Form.Item>
                                    <Form.Item name="address" label="家庭寄件地址 (用于实物奖品及通知)">
                                        <Input.TextArea placeholder="请输入您的详细家庭地址..." rows={3} size="large" />
                                    </Form.Item>
                                    <Form.Item style={{ marginBottom: 0 }}>
                                        <Space style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginTop: 8 }}>
                                            <Button type="primary" htmlType="submit" loading={saving} size="large" style={{ minWidth: 120 }}>保存修改</Button>
                                            <Button onClick={() => setIsEditingProfile(false)} size="large">取消</Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: 20 }}>
                                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>真实姓名</Typography.Text>
                                        <div style={{ padding: '10px 16px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                                            <UserOutlined style={{ marginRight: 12, color: '#1890ff', fontSize: 16 }} />
                                            <Typography.Text strong style={{ fontSize: 15 }}>{profileDataObj?.name || '未填写'}</Typography.Text>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>登录手机号</Typography.Text>
                                        <div style={{ padding: '10px 16px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                                            <PhoneOutlined style={{ marginRight: 12, color: '#52c41a', fontSize: 16 }} />
                                            <Typography.Text strong style={{ fontSize: 15 }}>{profileDataObj?.phone || '未填写'}</Typography.Text>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>家庭寄件地址 (用于实物奖品及通知)</Typography.Text>
                                        <div style={{ padding: '12px 16px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, minHeight: 60 }}>
                                            <Typography.Text style={{ fontSize: 14 }}>{profileDataObj?.address || <Typography.Text type="secondary" italic>未填写家庭地址...</Typography.Text>}</Typography.Text>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card title="我接的单" loading={loading}>
                <List
                    dataSource={myOrders}
                    locale={{ emptyText: '暂无接单记录' }}
                    renderItem={(order: Order) => {
                        const st = statusMap[order.status] || { label: order.status, color: 'default' };
                        return (
                            <List.Item 
                                style={{ cursor: 'pointer' }}
                                onClick={() => showOrderDetails(order)}
                                actions={[
                                    order.status === 'accepted' && (
                                        <Button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(order.id, 'in_progress');
                                            }}
                                        >
                                            开始服务
                                        </Button>
                                    ),
                                    order.status === 'in_progress' && (
                                        <Button 
                                            type="primary" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOrder(order);
                                                setCompletionModalOpen(true);
                                            }}
                                        >
                                            完成服务
                                        </Button>
                                    ),
                                ].filter(Boolean) as React.ReactNode[]}
                            >
                                <List.Item.Meta
                                    title={<><Tag color={st.color}>{st.label}</Tag> <span>{order.title}</span></>}
                                    description={
                                        <div>
                                            <div style={{ marginBottom: 8 }}>
                                                {order.category} | {order.address}
                                            </div>
                                            {order.status === 'completed' && order.rating && (
                                                <div style={{ marginTop: 12, padding: '12px', backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '6px' }}>
                                                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                                                        <span style={{ color: '#888', marginRight: 8, fontSize: 13 }}>受助人评级:</span>
                                                        <Rate disabled defaultValue={order.rating} style={{ fontSize: 14 }} />
                                                        <Tag color="orange" style={{ marginLeft: 16 }}>获得积分: +{order.pointsReward || 0}</Tag>
                                                    </div>
                                                    {order.comment && (
                                                        <div style={{ color: '#666', fontStyle: 'italic', fontSize: 13 }}>
                                                            "{order.comment}"
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    }
                                />
                            </List.Item>
                        );
                    }}
                />
            </Card>

            <Card 
                title={
                    <Space>
                        <GiftOutlined style={{ color: '#faad14' }} /> 
                        <span>我的战利品 (兑换记录)</span>
                    </Space>
                } 
                bordered={false} 
                loading={loading}
                style={{ marginTop: 24 }}
            >
                {profileDataObj?.prizeRedemptions && profileDataObj.prizeRedemptions.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={profileDataObj.prizeRedemptions}
                        renderItem={(item: PrizeRedemption) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<div style={{ width: 48, height: 48, background: '#fffbe6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#faad14' }}><GiftOutlined /></div>}
                                    title={<Text strong style={{ fontSize: 16 }}>{item.prizeName}</Text>}
                                    description={
                                        <Space direction="vertical" size={2} style={{ marginTop: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 13 }}>充值/发奖手机号: {item.targetPhone}</Text>
                                            <Text type="secondary" style={{ fontSize: 13 }}>兑换时间: {new Date(item.createdAt).toLocaleString()}</Text>
                                        </Space>
                                    }
                                />
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <Tag color={item.status === 'shipped' ? 'green' : 'processing'}>
                                        {item.status === 'shipped' ? '已发放' : '处理中'}
                                    </Tag>
                                    <Button 
                                        type="primary" 
                                        size="small" 
                                        icon={item.prizeName.includes('公益之星') ? <TrophyOutlined /> : <QrcodeOutlined />} 
                                        style={{ marginTop: 8 }}
                                        disabled={item.status === 'shipped'}
                                        onClick={() => {
                                            if (item.prizeName.includes('公益之星')) {
                                                Modal.confirm({
                                                    title: '确认佩戴荣誉称号',
                                                    content: `你正在佩戴“${item.prizeName}”，使用后将作为永久荣誉展示在主页！`,
                                                    onOk: async () => {
                                                        try {
                                                            await api.post('/auth/prizes/use', { prizeId: item.id });
                                                            message.success('恭喜！荣誉称号已生效！');
                                                            fetchOrdersAndProfile();
                                                        } catch (error: any) {
                                                            message.error(error.response?.data?.message || '使用失败');
                                                        }
                                                    }
                                                });
                                            } else {
                                                showQrModal(item);
                                            }
                                        }}
                                    >
                                        {item.status === 'shipped' ? '已核销/已生效' : '去使用'}
                                    </Button>
                                    <div style={{ marginTop: 8, color: '#faad14', fontWeight: 'bold' }}>
                                        -{item.cost} 积分
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="您还没有兑换过任何奖品哦，快去积分商城看看吧！" />
                )}
            </Card>

            <Modal
                title="需求详情"
                open={detailModalOpen}
                onCancel={() => setDetailModalOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
                        关闭
                    </Button>
                ]}
                width={600}
            >
                {selectedOrder && (
                    <div style={{ padding: '10px 0' }}>
                        <Typography.Title level={4}>{selectedOrder.title}</Typography.Title>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div>
                                <Text type="secondary">服务分类：</Text>
                                <Tag color="blue">{selectedOrder.category}</Tag>
                            </div>
                            <div>
                                <Text type="secondary"><EnvironmentOutlined /> 服务地址：</Text>
                                <Text>{selectedOrder.address}</Text>
                            </div>
                            <div>
                                <Text type="secondary"><ClockCircleOutlined /> 期望时间：</Text>
                                <Text>{new Date(selectedOrder.expectedTime).toLocaleString()}</Text>
                            </div>
                            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginTop: 8 }}>
                                <Text strong>需求描述：</Text>
                                <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                                    {selectedOrder.description || '老人未填写详细描述'}
                                </Paragraph>
                            </div>
                        </Space>
                    </div>
                )}
            </Modal>
            
            <Modal
                title="核销奖品"
                open={qrModalOpen}
                footer={null}
                onCancel={() => setQrModalOpen(false)}
                centered
            >
                {selectedPrize && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Title level={4} style={{ marginBottom: 24 }}>{selectedPrize.prizeName}</Title>
                        <div style={{ padding: 16, background: '#fff', display: 'inline-block', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <QRCode 
                                value={`VERIFY:${selectedPrize.id}:${selectedPrize.targetPhone}`} 
                                size={200}
                                color="#1890ff"
                            />
                        </div>
                        <Paragraph type="secondary" style={{ marginTop: 24, fontSize: 16 }}>
                            请向商家出示此二维码进行核销使用
                        </Paragraph>
                    </div>
                )}
            </Modal>

            <Modal
                title="完成服务提交"
                open={completionModalOpen}
                onCancel={() => setCompletionModalOpen(false)}
                footer={null}
                width={500}
            >
                <Form
                    form={completionForm}
                    layout="vertical"
                    onFinish={handleConfirmCompletion}
                    initialValues={{ description: '' }}
                >
                    <Form.Item
                        name="description"
                        label="服务内容说明"
                        rules={[{ required: true, message: '请简要说明服务完成情况' }]}
                    >
                        <Input.TextArea 
                            placeholder="请描述您为老人提供了哪些服务，例如：已买好土豆并送到老人家中..." 
                            rows={4} 
                        />
                    </Form.Item>
                    
                    <Form.Item
                        name="photos"
                        label="服务现场照片 (选填)"
                        help="如已购买的物品照片、服务后的合影等"
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            onChange={handleUploadChange}
                            beforeUpload={() => false} // Prevent auto upload
                        >
                            {fileList.length >= 4 ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>上传</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setCompletionModalOpen(false)}>
                                取消
                            </Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                提交并等待确认
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Dashboard;
