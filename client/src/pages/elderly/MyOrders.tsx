import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Divider, Empty, Input, List, Modal, Rate, Row, Col, Statistic, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined, MessageOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import OrderChatPanel from '../../components/OrderChatPanel';
import { getSocket } from '../../utils/socket';
import { useUserStore } from '../../store/userStore';

const { Text, Title } = Typography;

const statusMap: Record<string, { label: string; color: string }> = {
    under_review: { label: '待审核', color: 'purple' },
    pending: { label: '待接单', color: 'orange' },
    accepted: { label: '已接单', color: 'blue' },
    in_progress: { label: '服务中', color: 'processing' },
    submitted: { label: '待确认', color: 'gold' },
    completed: { label: '待评价', color: 'green' },
    cancelled: { label: '已取消', color: 'default' },
    rejected: { label: '已驳回', color: 'red' },
    expired: { label: '已过期', color: 'default' },
};

const sectionConfig = [
    { key: 'submitted', title: '待您确认', description: '志愿者已提交完成情况，等待您确认或驳回' },
    { key: 'in_progress', title: '服务进行中', description: '志愿者正在处理，按最近进度排序' },
    { key: 'accepted', title: '已接单待开始', description: '已有志愿者接单，等待开始服务' },
    { key: 'pending', title: '等待接单', description: '已发布成功，等待志愿者接单' },
    { key: 'under_review', title: '审核中', description: '管理员正在审核您的需求' },
    { key: 'completed_unrated', title: '待评价', description: '服务已完成，别忘了给志愿者评价' },
    { key: 'completed_rated', title: '已完成', description: '已确认完成并已评价的历史订单' },
    { key: 'rejected', title: '已驳回', description: '审核未通过或完成申请被判定无效的订单' },
    { key: 'cancelled', title: '已取消', description: '您或系统已取消的订单' },
    { key: 'expired', title: '已过期', description: '超出期望时间仍未完成的订单' },
];

interface Order {
    id: number;
    title: string;
    category: string;
    address: string;
    description?: string;
    expectedTime: string;
    createdAt: string;
    updatedAt?: string;
    status: string;
    volunteerId?: number | null;
    unreadCount?: number;
    rating?: number;
    comment?: string;
    completionPhotos?: string;
    completionDescription?: string;
    completionRejectionReason?: string;
}

interface OrderSection {
    key: string;
    title: string;
    description: string;
    orders: Order[];
}

const formatDateTime = (value?: string) => {
    if (!value) {
        return '-';
    }
    return new Date(value).toLocaleString();
};

const getSortTime = (order: Order) => {
    return new Date(order.updatedAt || order.expectedTime || order.createdAt).getTime();
};

const sortOrdersWithinStatus = (items: Order[]) => {
    return [...items].sort((a, b) => {
        const timeDiff = getSortTime(a) - getSortTime(b);
        if (timeDiff !== 0) {
            return timeDiff;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
};

const MyOrders: React.FC = () => {
    const currentUser = useUserStore((state) => state.user);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/orders');
            setOrders(data.orders);
        } catch {
            message.error('获取订单失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) {
            return;
        }

        const handleIncomingMessage = (incoming: { orderId?: number; senderId?: number }) => {
            if (!incoming.orderId || incoming.senderId === currentUser?.id) {
                return;
            }

            const isCurrentOrderOpen = detailModalOpen && currentOrder?.id === incoming.orderId;

            setOrders((prev) => prev.map((order) => {
                if (order.id !== incoming.orderId) {
                    return order;
                }

                return {
                    ...order,
                    unreadCount: isCurrentOrderOpen ? 0 : (order.unreadCount || 0) + 1,
                };
            }));

            if (isCurrentOrderOpen) {
                setCurrentOrder((prev) => prev ? { ...prev, unreadCount: 0 } : prev);
            }
        };

        socket.on('chat_message', handleIncomingMessage);
        return () => {
            socket.off('chat_message', handleIncomingMessage);
        };
    }, [currentUser?.id, currentOrder?.id, detailModalOpen]);

    const clearOrderUnread = (orderId: number) => {
        setOrders((prev) => prev.map((order) => (
            order.id === orderId ? { ...order, unreadCount: 0 } : order
        )));
        setCurrentOrder((prev) => (
            prev && prev.id === orderId ? { ...prev, unreadCount: 0 } : prev
        ));
    };

    const handleRate = async () => {
        if (!currentOrder) {
            return;
        }

        try {
            await api.post(`/orders/${currentOrder.id}/rate`, { rating, comment });
            message.success('评价成功');
            setRatingModalOpen(false);
            fetchOrders();
        } catch {
            message.error('评价失败');
        }
    };

    const handleConfirm = async (orderId: number) => {
        try {
            await api.post(`/orders/${orderId}/confirm`);
            message.success('任务已确认完成');
            fetchOrders();
            setDetailModalOpen(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '确认失败');
        }
    };

    const handleRejectCompletion = async () => {
        if (!currentOrder) {
            return;
        }

        const trimmedReason = rejectReason.trim();
        if (!trimmedReason) {
            message.warning('请填写驳回理由');
            return;
        }

        setRejectSubmitting(true);
        try {
            await api.post(`/orders/${currentOrder.id}/reject-completion`, { reason: trimmedReason });
            message.success('已驳回本次完成申请');
            setRejectModalOpen(false);
            setRejectReason('');
            fetchOrders();
            setDetailModalOpen(false);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '驳回失败');
        } finally {
            setRejectSubmitting(false);
        }
    };

    const renderCompletionPhotos = (photos?: string) => {
        if (!photos) {
            return null;
        }

        try {
            let parsed: unknown = photos;
            if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
                if (typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('{'))) {
                    parsed = JSON.parse(parsed);
                }
            }

            if (Array.isArray(parsed)) {
                return parsed.map((photo, index) => (
                    <img
                        key={index}
                        src={String(photo)}
                        alt={`现场照片${index + 1}`}
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
                    />
                ));
            }

            if (typeof parsed === 'string' && parsed.startsWith('data:image')) {
                return <img src={parsed} alt="现场照片" style={{ maxWidth: '100%', borderRadius: 6 }} />;
            }
        } catch (error) {
            console.error('Render completion photos error:', error);
        }

        return <Text type="secondary">照片显示异常</Text>;
    };

    const groupedSections = useMemo<OrderSection[]>(() => {
        const buckets: Record<string, Order[]> = Object.fromEntries(sectionConfig.map((item) => [item.key, []]));

        orders.forEach((order) => {
            if (order.status === 'completed') {
                if (order.rating) {
                    buckets.completed_rated.push(order);
                } else {
                    buckets.completed_unrated.push(order);
                }
                return;
            }

            if (!buckets[order.status]) {
                buckets[order.status] = [];
            }
            buckets[order.status].push(order);
        });

        return sectionConfig.map((item) => ({
            ...item,
            orders: sortOrdersWithinStatus(buckets[item.key] || []),
        }));
    }, [orders]);

    const summary = useMemo(() => {
        return {
            active: orders.filter((order) => ['accepted', 'in_progress', 'submitted'].includes(order.status)).length,
            pending: orders.filter((order) => ['under_review', 'pending'].includes(order.status)).length,
            completed: orders.filter((order) => order.status === 'completed').length,
            unread: orders.reduce((total, order) => total + (order.unreadCount || 0), 0),
        };
    }, [orders]);

    const renderOrderItem = (order: Order) => {
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
                onClick={() => {
                    setCurrentOrder(order);
                    setDetailModalOpen(true);
                }}
                actions={
                    order.status === 'completed' && !order.rating
                        ? [
                            <Button
                                key="rate"
                                type="primary"
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentOrder(order);
                                    setRatingModalOpen(true);
                                }}
                            >
                                评价服务
                            </Button>,
                        ]
                        : order.status === 'submitted'
                            ? [
                                <Button
                                    key="confirm"
                                    type="primary"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirm(order.id);
                                    }}
                                >
                                    确认完成
                                </Button>,
                                <Button
                                    key="reject"
                                    danger
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentOrder(order);
                                        setRejectReason('');
                                        setRejectModalOpen(true);
                                    }}
                                >
                                    驳回申请
                                </Button>,
                            ]
                            : order.rating
                                ? [<span key="rated">已评价 <Rate disabled defaultValue={order.rating} /></span>]
                                : []
                }
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
                            <Text type="secondary">发布时间：{formatDateTime(order.createdAt)}</Text>
                            <Text type="secondary">期望时间：{formatDateTime(order.expectedTime)}</Text>
                            <Text type="secondary">最近变动：{formatDateTime(order.updatedAt || order.expectedTime)}</Text>
                        </div>
                    )}
                />
                {order.description && (
                    <div style={{ marginTop: 8, background: '#fafafa', borderRadius: 8, padding: 12 }}>
                        <Text>{order.description}</Text>
                    </div>
                )}
            </List.Item>
        );
    };

    return (
        <Card title="我的订单" loading={loading}>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ background: '#f7fbff' }}>
                        <Statistic title="进行中的服务" value={summary.active} prefix={<ClockCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ background: '#fffaf0' }}>
                        <Statistic title="等待中的订单" value={summary.pending} prefix={<FileDoneOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ background: '#f6ffed' }}>
                        <Statistic title="已完成订单" value={summary.completed} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ background: '#fff1f0' }}>
                        <Statistic title="未读消息" value={summary.unread} prefix={<MessageOutlined />} />
                    </Card>
                </Col>
            </Row>

            {groupedSections.every((section) => section.orders.length === 0) ? (
                <Empty description="您还没有订单记录" style={{ padding: '40px 0' }} />
            ) : (
                groupedSections.map((section) => {
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
                                renderItem={renderOrderItem}
                                split={false}
                            />
                        </div>
                    );
                })
            )}

            <Modal
                title="订单详情"
                open={detailModalOpen}
                onCancel={() => setDetailModalOpen(false)}
                footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>]}
                width={760}
            >
                {currentOrder && (
                    <div style={{ padding: '10px 0' }}>
                        <p><Text strong>服务标题：</Text> {currentOrder.title}</p>
                        <p><Text strong>服务分类：</Text> <Tag color="blue">{currentOrder.category}</Tag></p>
                        <p><Text strong>订单状态：</Text> {(() => {
                            const st = statusMap[currentOrder.status] || { label: currentOrder.status, color: 'default' };
                            return <Tag color={st.color}>{st.label}</Tag>;
                        })()}</p>
                        <p><Text strong>期望上门时间：</Text> {formatDateTime(currentOrder.expectedTime)}</p>
                        <p><Text strong>服务地址：</Text> {currentOrder.address}</p>
                        <p><Text strong>发布时间：</Text> {formatDateTime(currentOrder.createdAt)}</p>
                        <p><Text strong>最近变动时间：</Text> {formatDateTime(currentOrder.updatedAt || currentOrder.expectedTime)}</p>

                        {(currentOrder.completionDescription || currentOrder.completionPhotos) && (
                            <>
                                <Divider style={{ margin: '12px 0' }}>志愿者提交的完成情况</Divider>
                                {currentOrder.completionDescription && (
                                    <p><Text strong>完成说明：</Text> {currentOrder.completionDescription}</p>
                                )}
                                {currentOrder.completionPhotos && (
                                    <div>
                                        <p><Text strong>现场照片：</Text></p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {renderCompletionPhotos(currentOrder.completionPhotos)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {currentOrder.completionRejectionReason && (
                            <>
                                <Divider style={{ margin: '12px 0' }}>最近一次驳回说明</Divider>
                                <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: 12, borderRadius: 6 }}>
                                    <Text type="danger">{currentOrder.completionRejectionReason}</Text>
                                </div>
                            </>
                        )}

                        <Divider style={{ margin: '12px 0' }} />
                        <p><Text strong>需求描述：</Text></p>
                        <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                            {currentOrder.description || '无详细描述'}
                        </div>

                        <Divider style={{ margin: '16px 0' }} />
                        <OrderChatPanel
                            orderId={currentOrder.id}
                            enabled={Boolean(currentOrder.volunteerId) && ['in_progress', 'submitted', 'completed'].includes(currentOrder.status)}
                            onRead={() => clearOrderUnread(currentOrder.id)}
                        />
                    </div>
                )}
            </Modal>

            <Modal title="评价服务" open={ratingModalOpen} onOk={handleRate} onCancel={() => setRatingModalOpen(false)}>
                <div style={{ marginBottom: 16 }}>
                    <Text>服务评分：</Text>
                    <Rate value={rating} onChange={setRating} />
                </div>
                <Input.TextArea placeholder="留下您的评价..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
            </Modal>

            <Modal
                title="驳回完成申请"
                open={rejectModalOpen}
                onOk={handleRejectCompletion}
                okText="确认驳回"
                okButtonProps={{ danger: true, loading: rejectSubmitting }}
                onCancel={() => {
                    setRejectModalOpen(false);
                    setRejectReason('');
                }}
                cancelText="取消"
            >
                <Input.TextArea
                    rows={4}
                    maxLength={300}
                    placeholder="请填写驳回理由，例如：物品未送达、服务内容不符、问题尚未解决等。"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                />
            </Modal>
        </Card>
    );
};

export default MyOrders;
