import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Rate, Input, message, Modal, Typography, Divider } from 'antd';
import api from '../../utils/api';

const { Text } = Typography;

const statusMap: Record<string, { label: string; color: string }> = {
    under_review: { label: '待审核', color: 'purple' },
    pending: { label: '待接单', color: 'orange' },
    accepted: { label: '已接单', color: 'blue' },
    in_progress: { label: '服务中', color: 'processing' },
    submitted: { label: '待您确认', color: 'orange' },
    completed: { label: '待评价', color: 'green' },
    cancelled: { label: '已取消', color: 'default' },
    rejected: { label: '已驳回', color: 'red' },
    expired: { label: '已过期', color: 'default' },
};

interface Order {
    id: number;
    title: string;
    category: string;
    address: string;
    description?: string;
    expectedTime: string;
    createdAt: string;
    status: string;
    rating?: number;
    completionPhotos?: string;
    completionDescription?: string;
}

const MyOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

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

    useEffect(() => { fetchOrders(); }, []);

    const handleRate = async () => {
        try {
            await api.post(`/orders/${currentOrder!.id}/rate`, { rating, comment });
            message.success('评价成功！');
            setRatingModalOpen(false);
            fetchOrders();
        } catch {
            message.error('评价失败');
        }
    };

    const handleConfirm = async (orderId: number) => {
        try {
            await api.post(`/orders/${orderId}/confirm`);
            message.success('任务已确认完成！');
            fetchOrders();
            setDetailModalOpen(false);
        } catch (error: any) {
            message.error(error.response?.data?.message || '确认失败');
        }
    };

    return (
        <Card title="我的订单" loading={loading}>
            <List
                itemLayout="vertical"
                dataSource={orders}
                renderItem={(order: Order) => {
                    const st = statusMap[order.status] || { label: order.status, color: 'default' };

                    return (
                        <List.Item
                            style={{ cursor: 'pointer' }}
                            onClick={() => { setCurrentOrder(order); setDetailModalOpen(true); }}
                            actions={
                                    order.status === 'completed' && !order.rating
                                    ? [<Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); setCurrentOrder(order); setRatingModalOpen(true); }}>评价服务</Button>]
                                    : order.status === 'submitted'
                                    ? [<Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); handleConfirm(order.id); }}>确认完成</Button>]
                                    : order.rating
                                    ? [<span>已评价: <Rate disabled defaultValue={order.rating} /></span>]
                                    : []
                            }
                        >
                            <List.Item.Meta
                                title={<><Tag color={st.color}>{st.label}</Tag> {order.title}</>}
                                description={`${order.category} | ${order.address} | 发布于: ${new Date(order.createdAt).toLocaleString()} | 期望时间: ${new Date(order.expectedTime).toLocaleString()}`}
                            />
                            {order.description && <Text type="secondary">{order.description}</Text>}
                        </List.Item>
                    );
                }}
            />
            <Modal 
                title="订单详情" 
                open={detailModalOpen} 
                onCancel={() => setDetailModalOpen(false)}
                footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>]}
            >
                {currentOrder && (
                    <div style={{ padding: '10px 0' }}>
                        <p><Text strong>服务标题：</Text> {currentOrder.title}</p>
                        <p><Text strong>服务分类：</Text> <Tag color="blue">{currentOrder.category}</Tag></p>
                        <p><Text strong>订单状态：</Text> {(() => {
                            const st = statusMap[currentOrder.status] || { label: currentOrder.status, color: 'default' };
                            return <Tag color={st.color}>{st.label}</Tag>;
                        })()}</p>
                        <p><Text strong>期望上门时间：</Text> {new Date(currentOrder.expectedTime).toLocaleString()}</p>
                        <p><Text strong>服务地址：</Text> {currentOrder.address}</p>
                        <p><Text strong>发布时间：</Text> {new Date(currentOrder.createdAt).toLocaleString()}</p>
                        
                        {(currentOrder.completionDescription || currentOrder.completionPhotos) && (
                            <>
                                <Divider style={{ margin: '12px 0' }}>志愿者提交的完成情况</Divider>
                                {currentOrder.completionDescription && (
                                    <p><Text strong>完成说明：</Text> {currentOrder.completionDescription}</p>
                                )}
                                {currentOrder.completionPhotos && (
                                    <div>
                                        <p><Text strong>现场照片：</Text></p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {(() => {
                                                try {
                                                    let photos = currentOrder.completionPhotos;
                                                    // Handle double-encoded JSON if it exists
                                                    if (typeof photos === 'string' && (photos.startsWith('"') || photos.startsWith('['))) {
                                                        try {
                                                            const parsed = JSON.parse(photos);
                                                            if (parsed) photos = parsed;
                                                            // Try parsing again if it's still a string that looks like JSON
                                                            if (typeof photos === 'string' && (photos.startsWith('[') || photos.startsWith('{'))) {
                                                                const secondParsed = JSON.parse(photos);
                                                                if (secondParsed) photos = secondParsed;
                                                            }
                                                        } catch (e) {
                                                            console.error('Parse error:', e);
                                                        }
                                                    }
                                                    
                                                    if (Array.isArray(photos)) {
                                                        return photos.map((p, idx) => (
                                                            <img 
                                                                key={idx} 
                                                                src={p} 
                                                                alt={`现场照片 ${idx + 1}`} 
                                                                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} 
                                                            />
                                                        ));
                                                    }
                                                    
                                                    if (typeof photos === 'string' && photos.startsWith('data:image')) {
                                                        return <img src={photos} alt="现场照片" style={{ maxWidth: '100%' }} />;
                                                    }

                                                    return <Text type="secondary">{String(photos)}</Text>;
                                                } catch (err) {
                                                    console.error('Rendering photos error:', err);
                                                    return <Text type="secondary">照片显示异常</Text>;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <Divider style={{ margin: '12px 0' }} />
                        <p><Text strong>需求描述：</Text></p>
                        <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                            {currentOrder.description || '无详细描述'}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal title="评价服务" open={ratingModalOpen} onOk={handleRate} onCancel={() => setRatingModalOpen(false)}>
                <div style={{ marginBottom: 16 }}>
                    <Text>服务评分：</Text>
                    <Rate value={rating} onChange={setRating} />
                </div>
                <Input.TextArea placeholder="留下您的评价..." value={comment} onChange={e => setComment(e.target.value)} rows={3} />
            </Modal>
        </Card>
    );
};

export default MyOrders;
