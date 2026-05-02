import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Empty, Form, Input, List, message, Modal, Rate, Row, Space, Statistic, Tag, Typography, Upload } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, EditOutlined, EnvironmentOutlined, FileDoneOutlined, GiftOutlined, MessageOutlined, PhoneOutlined, PlusOutlined, QrcodeOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { QRCode } from 'antd';
import api from '../../utils/api';
import { useUserStore } from '../../store/userStore';
import OrderChatPanel from '../../components/OrderChatPanel';
import { getSocket } from '../../utils/socket';

const { Text, Paragraph, Title } = Typography;

const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待接单', color: 'orange' },
    accepted: { label: '已接单', color: 'blue' },
    in_progress: { label: '服务中', color: 'processing' },
    submitted: { label: '待确认', color: 'gold' },
    completed: { label: '已完成', color: 'green' },
    expired: { label: '已过期', color: 'default' },
    rejected: { label: '已驳回', color: 'red' },
};

const volunteerSectionConfig = [
    { key: 'submitted', title: '待家属确认', description: '您已提交完成情况，等待家属确认或驳回' },
    { key: 'in_progress', title: '服务进行中', description: '正在服务的订单，按最近进度顺序排列' },
    { key: 'accepted', title: '已接单待开始', description: '已接单但还未正式开始服务' },
    { key: 'completed', title: '已完成', description: '已确认完成的订单与评价记录' },
    { key: 'rejected', title: '已驳回/无效', description: '管理员或流程已判定无效的订单' },
    { key: 'expired', title: '已过期', description: '超过时间未完成的订单' },
];

interface Order {
    id: number;
    title: string;
    category: string;
    address: string;
    expectedTime: string;
    createdAt?: string;
    updatedAt?: string;
    status: string;
    elderlyId?: number;
    volunteerId?: number | null;
    unreadCount?: number;
    rating?: number;
    description?: string;
    comment?: string;
    pointsReward?: number;
    completionRejectionReason?: string;
}

interface OrderSection {
    key: string;
    title: string;
    description: string;
    orders: Order[];
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

const formatDateTime = (value?: string) => {
    if (!value) {
        return '-';
    }
    return new Date(value).toLocaleString();
};

const getSortTime = (order: Order) => {
    return new Date(order.updatedAt || order.expectedTime || order.createdAt || 0).getTime();
};

const sortOrdersWithinStatus = (items: Order[]) => {
    return [...items].sort((a, b) => {
        const timeDiff = getSortTime(a) - getSortTime(b);
        if (timeDiff !== 0) {
            return timeDiff;
        }
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
};

const Dashboard: React.FC = () => {
    const { user, updateUser } = useUserStore();
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileDataObj, setProfileDataObj] = useState<UserProfileData | null>(null);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [completionModalOpen, setCompletionModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);
    const [completionForm] = Form.useForm();

    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedPrize, setSelectedPrize] = useState<PrizeRedemption | null>(null);

    const showQrModal = (prize: PrizeRedemption) => {
        setSelectedPrize(prize);
        setQrModalOpen(true);
    };

    const fetchOrdersAndProfile = async () => {
        setLoading(true);
        try {
            const { data: mine } = await api.get('/orders', { params: { tab: 'mine' } });
            setMyOrders(mine.orders);

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

    useEffect(() => {
        fetchOrdersAndProfile();
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) {
            return;
        }

        const handleIncomingMessage = (incoming: { orderId?: number; senderId?: number }) => {
            if (!incoming.orderId || incoming.senderId === user?.id) {
                return;
            }

            const isCurrentOrderOpen = detailModalOpen && selectedOrder?.id === incoming.orderId;

            setMyOrders((prev) => prev.map((order) => {
                if (order.id !== incoming.orderId) {
                    return order;
                }

                return {
                    ...order,
                    unreadCount: isCurrentOrderOpen ? 0 : (order.unreadCount || 0) + 1,
                };
            }));

            if (isCurrentOrderOpen) {
                setSelectedOrder((prev) => prev ? { ...prev, unreadCount: 0 } : prev);
            }
        };

        socket.on('chat_message', handleIncomingMessage);
        return () => {
            socket.off('chat_message', handleIncomingMessage);
        };
    }, [detailModalOpen, selectedOrder?.id, user?.id]);

    const clearOrderUnread = (orderId: number) => {
        setMyOrders((prev) => prev.map((order) => (
            order.id === orderId ? { ...order, unreadCount: 0 } : order
        )));
        setSelectedOrder((prev) => (
            prev && prev.id === orderId ? { ...prev, unreadCount: 0 } : prev
        ));
    };

    const onSaveProfile = async (values: Record<string, string>) => {
        setSaving(true);
        try {
            await api.put('/auth/profile', values);
            message.success('个人资料已保存');
            updateUser({ name: values.name, phone: values.phone });
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
            message.success('状态更新成功');

            if (res.data.newPoints !== undefined) {
                updateUser({ points: res.data.newPoints });
            }
            fetchOrdersAndProfile();
            return true;
        } catch (error: any) {
            message.error(error.response?.data?.message || '状态更新失败');
            return false;
        }
    };

    const handleConfirmCompletion = async (values: any) => {
        if (!selectedOrder) {
            return;
        }

        setSubmitting(true);

        const photoPromises = fileList.map((item) => {
            if (item.url) {
                return Promise.resolve(item.url);
            }

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(item.originFileObj);
                reader.onload = () => resolve(reader.result as string);
            });
        });

        const photos = await Promise.all(photoPromises);

        const success = await handleUpdateStatus(selectedOrder.id, 'submitted', {
            completionDescription: values.description,
            completionPhotos: photos.length > 0 ? photos : null,
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

    const groupedOrderSections = useMemo<OrderSection[]>(() => {
        const buckets: Record<string, Order[]> = Object.fromEntries(
            volunteerSectionConfig.map((item) => [item.key, []])
        );

        myOrders.forEach((order) => {
            if (!buckets[order.status]) {
                buckets[order.status] = [];
            }
            buckets[order.status].push(order);
        });

        return volunteerSectionConfig.map((section) => ({
            ...section,
            orders: sortOrdersWithinStatus(buckets[section.key] || []),
        }));
    }, [myOrders]);

    const orderSummary = useMemo(() => ({
        active: myOrders.filter((order) => ['accepted', 'in_progress', 'submitted'].includes(order.status)).length,
        completed: myOrders.filter((order) => order.status === 'completed').length,
        waiting: myOrders.filter((order) => ['accepted', 'submitted'].includes(order.status)).length,
        unread: myOrders.reduce((total, order) => total + (order.unreadCount || 0), 0),
    }), [myOrders]);

    const renderVolunteerOrderItem = (order: Order) => {
        const st = statusMap[order.status] || { label: order.status, color: 'default' };

        return (
            <List.Item
                key={order.id}
                style={{
                    cursor: 'pointer',
                    border: '1px solid #f0f0f0',
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 12,
                    background: '#fff',
                }}
                onClick={() => showOrderDetails(order)}
                actions={[
                    order.status === 'accepted' && (
                        <Button
                            key="start"
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
                            key="finish"
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
                    title={(
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <Tag color={st.color} style={{ marginInlineEnd: 0 }}>{st.label}</Tag>
                            <Badge dot={(order.unreadCount || 0) > 0} offset={[4, 0]}>
                                <span style={{ fontSize: 18, fontWeight: 600, paddingRight: 8 }}>{order.title}</span>
                            </Badge>
                            <Tag>{order.category}</Tag>
                        </div>
                    )}
                    description={(
                        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                            <Text type="secondary">服务地址：{order.address}</Text>
                            <Text type="secondary">期望时间：{formatDateTime(order.expectedTime)}</Text>
                            <Text type="secondary">最近变动：{formatDateTime(order.updatedAt || order.expectedTime)}</Text>
                        </div>
                    )}
                />

                {order.status === 'completed' && order.rating && (
                    <div style={{ marginTop: 12, padding: 12, backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                            <span style={{ color: '#888', fontSize: 13 }}>受助人评级</span>
                            <Rate disabled defaultValue={order.rating} style={{ fontSize: 14 }} />
                            <Tag color="orange" style={{ margin: 0 }}>获得积分: +{order.pointsReward || 0}</Tag>
                        </div>
                        {order.comment && (
                            <div style={{ color: '#666', fontStyle: 'italic', fontSize: 13 }}>
                                "{order.comment}"
                            </div>
                        )}
                    </div>
                )}
            </List.Item>
        );
    };

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="我的积分" value={user?.points || 0} prefix={<TrophyOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="已完成服务" value={myOrders.filter((o) => o.status === 'completed').length} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="进行中任务" value={myOrders.filter((o) => o.status === 'in_progress' || o.status === 'accepted').length} /></Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24}>
                    <Card
                        title={(
                            <Space>
                                <span>个人资料</span>
                                {profileDataObj?.prizeRedemptions?.some((p) => p.prizeName.includes('公益之星') && p.status === 'shipped') && (
                                    <Tag color="gold" icon={<TrophyOutlined />} style={{ margin: 0 }}>公益之星</Tag>
                                )}
                            </Space>
                        )}
                        extra={(
                            !isEditingProfile && (
                                <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditingProfile(true)}>
                                    编辑
                                </Button>
                            )
                        )}
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
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: '#f7fbff' }}>
                            <Statistic title="进行中的服务" value={orderSummary.active} prefix={<ClockCircleOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: '#fffaf0' }}>
                            <Statistic title="等待确认/开始" value={orderSummary.waiting} prefix={<FileDoneOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: '#f6ffed' }}>
                            <Statistic title="已完成服务" value={orderSummary.completed} prefix={<CheckCircleOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card bordered={false} style={{ background: '#fff1f0' }}>
                            <Statistic title="未读消息" value={orderSummary.unread} prefix={<MessageOutlined />} />
                        </Card>
                    </Col>
                </Row>

                {groupedOrderSections.every((section) => section.orders.length === 0) ? (
                    <Empty description="暂无接单记录" style={{ padding: '40px 0' }} />
                ) : (
                    groupedOrderSections.map((section) => {
                        if (section.orders.length === 0) {
                            return null;
                        }

                        return (
                            <div key={section.key} style={{ marginBottom: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <Title level={4} style={{ marginBottom: 4 }}>{section.title}</Title>
                                        <Text type="secondary">{section.description}</Text>
                                    </div>
                                    <Tag color="blue">{section.orders.length} 单</Tag>
                                </div>
                                <List
                                    itemLayout="vertical"
                                    dataSource={section.orders}
                                    renderItem={renderVolunteerOrderItem}
                                    split={false}
                                />
                            </div>
                        );
                    })
                )}
            </Card>

            <Card
                title={(
                    <Space>
                        <GiftOutlined style={{ color: '#faad14' }} />
                        <span>我的战利品 (兑换记录)</span>
                    </Space>
                )}
                bordered={false}
                loading={loading}
                style={{ marginTop: 24 }}
            >
                {profileDataObj?.prizeRedemptions && profileDataObj.prizeRedemptions.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={profileDataObj.prizeRedemptions}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<div style={{ width: 48, height: 48, background: '#fffbe6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#faad14' }}><GiftOutlined /></div>}
                                    title={<Text strong style={{ fontSize: 16 }}>{item.prizeName}</Text>}
                                    description={(
                                        <Space direction="vertical" size={2} style={{ marginTop: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 13 }}>兑奖/发奖手机号: {item.targetPhone}</Text>
                                            <Text type="secondary" style={{ fontSize: 13 }}>兑换时间: {new Date(item.createdAt).toLocaleString()}</Text>
                                        </Space>
                                    )}
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
                                                            message.success('恭喜，荣誉称号已生效');
                                                            fetchOrdersAndProfile();
                                                        } catch (error: any) {
                                                            message.error(error.response?.data?.message || '使用失败');
                                                        }
                                                    },
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
                    <Empty description="您还没有兑换过任何奖品，快去积分商城看看吧" />
                )}
            </Card>

            <Modal
                title="需求详情"
                open={detailModalOpen}
                onCancel={() => setDetailModalOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
                        关闭
                    </Button>,
                ]}
                width={760}
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
                                <Text>{formatDateTime(selectedOrder.expectedTime)}</Text>
                            </div>
                            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginTop: 8 }}>
                                <Text strong>需求描述：</Text>
                                <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                                    {selectedOrder.description || '老人未填写详细描述'}
                                </Paragraph>
                            </div>
                            {selectedOrder.completionRejectionReason && (
                                <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: '12px 16px', borderRadius: 8 }}>
                                    <Text strong type="danger">家属驳回理由：</Text>
                                    <Paragraph style={{ marginTop: 8, marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                                        {selectedOrder.completionRejectionReason}
                                    </Paragraph>
                                </div>
                            )}
                            <OrderChatPanel
                                orderId={selectedOrder.id}
                                enabled={['in_progress', 'submitted', 'completed'].includes(selectedOrder.status)}
                                onRead={() => clearOrderUnread(selectedOrder.id)}
                            />
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
                            beforeUpload={() => false}
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
