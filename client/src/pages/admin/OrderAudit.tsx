import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, message, Space, Modal, InputNumber, Typography, Tabs, Form, Input, DatePicker, Select } from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined, HistoryOutlined, AuditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Order {
    id: number;
    title: string;
    category: string;
    description: string;
    address: string;
    expectedTime: string;
    status: string;
    elderlyId: number;
    pointsReward?: number;
}

const OrderAudit: React.FC = () => {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [auditModalOpen, setAuditModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [pointsReward, setPointsReward] = useState<number | null>(10);
    const [actionLoading, setActionLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/orders');
            setAllOrders(data.orders);
        } catch {
            message.error('获取需求列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const showAuditModal = (record: Order) => {
        setSelectedOrder(record);
        setPointsReward(10); // default suggested points
        setAuditModalOpen(true);
    };

    const showEditModal = (record: Order) => {
        setSelectedOrder(record);
        form.setFieldsValue({
            ...record,
            expectedTime: dayjs(record.expectedTime)
        });
        setEditModalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedOrder) return;
        if (!pointsReward || pointsReward <= 0) {
            message.warning('请输入有效的奖励积分');
            return;
        }
        
        setActionLoading(true);
        try {
            await api.put(`/admin/orders/${selectedOrder.id}/audit`, {
                status: 'pending', 
                pointsReward: pointsReward
            });
            message.success('审批通过并成功赋分！');
            setAuditModalOpen(false);
            fetchOrders();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '审批失败');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            setActionLoading(true);
            await api.put(`/admin/orders/${selectedOrder?.id}/update`, {
                ...values,
                expectedTime: values.expectedTime.toISOString()
            });
            message.success('更新成功');
            setEditModalOpen(false);
            fetchOrders();
        } catch (error) {
            console.error(error);
            message.error('更新失败');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = (order: Order) => {
        Modal.confirm({
            title: '驳回需求',
            content: `确定驳回服务需求【${order.title}】吗？驳回后将被标记为无效。`,
            okText: '确认驳回',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await api.put(`/admin/orders/${order.id}/audit`, {
                        status: 'rejected'
                    });
                    message.success('已驳回');
                    fetchOrders();
                } catch (error) {
                    const err = error as { response?: { data?: { message?: string } } };
                    message.error(err.response?.data?.message || '驳回失败');
                }
            }
        });
    };

    const handleDelete = (order: Order) => {
        Modal.confirm({
            title: '删除需求',
            content: `确定永久删除服务需求【${order.title}】吗？此操作不可撤销。`,
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await api.delete(`/admin/orders/${order.id}`);
                    message.success('删除成功');
                    fetchOrders();
                } catch (error) {
                    const err = error as { response?: { data?: { message?: string } } };
                    message.error(err.response?.data?.message || '删除失败');
                }
            }
        });
    };

    const columns = [
        { 
            title: '序号', 
            dataIndex: 'index', 
            key: 'index', 
            width: 80,
            render: (_: unknown, __: Order, index: number) => index + 1
        },
        { title: '标题', dataIndex: 'title', key: 'title', width: 150 },
        { title: '分类', dataIndex: 'category', key: 'category', width: 100, render: (text: string) => <Tag color="orange">{text}</Tag> },
        { title: '老人ID', dataIndex: 'elderlyId', key: 'elderlyId', width: 80 },
        { title: '地址', dataIndex: 'address', key: 'address', width: 250, ellipsis: true },
        { 
            title: '期望时间', 
            dataIndex: 'expectedTime', 
            key: 'expectedTime', 
            width: 180,
            render: (text: string) => new Date(text).toLocaleString()
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const map: Record<string, { label: string; color: string }> = {
                    under_review: { label: '待审核', color: 'purple' },
                    pending: { label: '待接单', color: 'orange' },
                    accepted: { label: '已接单', color: 'blue' },
                    in_progress: { label: '服务中', color: 'cyan' },
                    completed: { label: '已完成', color: 'green' },
                    cancelled: { label: '已取消', color: 'default' },
                    rejected: { label: '已驳回', color: 'red' },
                    expired: { label: '已过期', color: 'default' }
                };
                const s = map[status] || { label: status, color: 'default' };
                return <Tag color={s.color}>{s.label}</Tag>;
            },
            width: 100,
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right' as const,
            width: 280,
            render: (_: unknown, record: Order) => (
                <Space size="middle">
                    {record.status === 'under_review' && (
                        <>
                            <Button 
                                type="primary" 
                                icon={<CheckOutlined />} 
                                onClick={() => showAuditModal(record)}
                                size="small"
                            >
                                审核赋分
                            </Button>
                            <Button 
                                danger 
                                icon={<CloseOutlined />} 
                                onClick={() => handleReject(record)}
                                size="small"
                            >
                                驳回
                            </Button>
                        </>
                    )}
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => showEditModal(record)}
                        size="small"
                    >
                        修改
                    </Button>
                    <Button 
                        danger
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDelete(record)}
                        size="small"
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    const pendingAuditData = allOrders.filter(o => o.status === 'under_review');

    return (
        <Card title="需求管理" style={{ minHeight: '80vh' }}>
            <Tabs defaultActiveKey="1">
                <Tabs.TabPane 
                    tab={<span><AuditOutlined />待审核需求 ({pendingAuditData.length})</span>} 
                    key="1"
                >
                    <Table
                        columns={columns.filter(c => c.key !== 'status')}
                        dataSource={pendingAuditData}
                        rowKey="id"
                        loading={loading}
                        locale={{ emptyText: '暂无待审核需求' }}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1000 }}
                    />
                </Tabs.TabPane>
                <Tabs.TabPane 
                    tab={<span><HistoryOutlined />全部历史需求</span>} 
                    key="2"
                >
                    <Table
                        columns={columns}
                        dataSource={allOrders}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1200 }}
                    />
                </Tabs.TabPane>
            </Tabs>

            <Modal
                title="审核并赋分"
                open={auditModalOpen}
                onOk={handleApprove}
                confirmLoading={actionLoading}
                onCancel={() => setAuditModalOpen(false)}
                okText="确认发布"
                cancelText="取消"
            >
                {selectedOrder && (
                    <div style={{ padding: '16px 0' }}>
                        <p><Text strong>服务标题：</Text> {selectedOrder.title}</p>
                        <p><Text strong>服务分类：</Text> <Tag color="blue">{selectedOrder.category}</Tag></p>
                        <p><Text strong>服务描述：</Text> {selectedOrder.description || '无'}</p>
                        
                        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                            <p style={{ marginBottom: 8 }}><Text strong>请为该任务设置奖励积分：</Text></p>
                            <InputNumber 
                                min={1} 
                                max={1000} 
                                value={pointsReward} 
                                onChange={setPointsReward} 
                                style={{ width: '100%' }}
                                size="large"
                                addonAfter="积分"
                            />
                            <p style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                                提示：审核通过后该需求将出现在志愿者的大厅中。当志愿者完成任务后，系统将奖励上述设定的积分。
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                title="修改需求详情"
                open={editModalOpen}
                onOk={handleUpdate}
                confirmLoading={actionLoading}
                onCancel={() => setEditModalOpen(false)}
                okText="保存修改"
                cancelText="取消"
                width={600}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="title" label="标题" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="代购物品">代购物品</Select.Option>
                            <Select.Option value="上门维修">上门维修</Select.Option>
                            <Select.Option value="陪同就医">陪同就医</Select.Option>
                            <Select.Option value="生活照料">生活照料</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="under_review">待审核</Select.Option>
                            <Select.Option value="pending">待接单</Select.Option>
                            <Select.Option value="accepted">已接单</Select.Option>
                            <Select.Option value="in_progress">服务中</Select.Option>
                            <Select.Option value="completed">已完成</Select.Option>
                            <Select.Option value="cancelled">已取消</Select.Option>
                            <Select.Option value="rejected">已驳回</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="描述">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="address" label="地址" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="expectedTime" label="期望上门时间" rules={[{ required: true }]}>
                        <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="pointsReward" label="奖励积分">
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default OrderAudit;
