import React, { useEffect, useMemo, useState } from 'react';
import { AuditOutlined, CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, HistoryOutlined, RollbackOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Text, Paragraph } = Typography;

interface Order {
    id: number;
    title: string;
    category: string;
    description: string;
    address: string;
    expectedTime: string;
    status: string;
    elderlyId: number;
    volunteerId?: number | null;
    pointsReward?: number | null;
    completionRejectionReason?: string | null;
    completionDescription?: string | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
    under_review: { label: '待审核', color: 'purple' },
    pending: { label: '待接单', color: 'orange' },
    accepted: { label: '已接单', color: 'blue' },
    in_progress: { label: '服务中', color: 'cyan' },
    submitted: { label: '待确认', color: 'gold' },
    completed: { label: '已完成', color: 'green' },
    cancelled: { label: '已取消', color: 'default' },
    rejected: { label: '已驳回', color: 'red' },
    expired: { label: '已过期', color: 'default' },
};

const categoryOptions = [
    { value: '代购物品', label: '代购物品' },
    { value: '上门维修', label: '上门维修' },
    { value: '陪同就医', label: '陪同就医' },
    { value: '生活照料', label: '生活照料' },
];

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

    const isCompletionDispute = (order: Order) => Boolean(order.volunteerId && order.completionRejectionReason);

    const showAuditModal = (record: Order) => {
        setSelectedOrder(record);
        setPointsReward(record.pointsReward || 10);
        setAuditModalOpen(true);
    };

    const showEditModal = (record: Order) => {
        setSelectedOrder(record);
        form.setFieldsValue({
            ...record,
            expectedTime: dayjs(record.expectedTime),
        });
        setEditModalOpen(true);
    };

    const handleApproveNewOrder = async () => {
        if (!selectedOrder) {
            return;
        }

        if (!pointsReward || pointsReward <= 0) {
            message.warning('请输入有效的奖励积分');
            return;
        }

        setActionLoading(true);
        try {
            await api.put(`/admin/orders/${selectedOrder.id}/audit`, {
                status: 'pending',
                pointsReward,
            });
            message.success('审核通过，已放入任务大厅');
            setAuditModalOpen(false);
            fetchOrders();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '审核失败');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisputeAction = (order: Order, nextStatus: 'pending' | 'submitted') => {
        const isReturnToHall = nextStatus === 'pending';
        Modal.confirm({
            title: isReturnToHall ? '放回任务大厅' : '继续交由家属确认',
            content: isReturnToHall
                ? `确定将【${order.title}】放回任务大厅重新等待接单吗？`
                : `确定不通过这次驳回申请，让【${order.title}】继续回到家属端确认完成/再次驳回吗？`,
            okText: isReturnToHall ? '确认放回' : '确认继续',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await api.put(`/admin/orders/${order.id}/audit`, { status: nextStatus });
                    message.success(isReturnToHall ? '订单已放回任务大厅' : '订单已返回家属端继续确认');
                    fetchOrders();
                } catch (error) {
                    const err = error as { response?: { data?: { message?: string } } };
                    message.error(err.response?.data?.message || '操作失败');
                }
            },
        });
    };

    const handleRejectNewOrder = (order: Order) => {
        Modal.confirm({
            title: '驳回需求',
            content: `确定驳回服务需求【${order.title}】吗？驳回后将被标记为无效。`,
            okText: '确认驳回',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await api.put(`/admin/orders/${order.id}/audit`, { status: 'rejected' });
                    message.success('已驳回');
                    fetchOrders();
                } catch (error) {
                    const err = error as { response?: { data?: { message?: string } } };
                    message.error(err.response?.data?.message || '驳回失败');
                }
            },
        });
    };

    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            setActionLoading(true);
            await api.put(`/admin/orders/${selectedOrder?.id}/update`, {
                ...values,
                expectedTime: values.expectedTime.toISOString(),
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
            },
        });
    };

    const columns = [
        {
            title: '序号',
            dataIndex: 'index',
            key: 'index',
            width: 80,
            render: (_: unknown, __: Order, index: number) => index + 1,
        },
        { title: '标题', dataIndex: 'title', key: 'title', width: 150 },
        { title: '分类', dataIndex: 'category', key: 'category', width: 110, render: (text: string) => <Tag color="orange">{text}</Tag> },
        { title: '老人ID', dataIndex: 'elderlyId', key: 'elderlyId', width: 90 },
        { title: '地址', dataIndex: 'address', key: 'address', width: 260, ellipsis: true },
        {
            title: '完成驳回理由',
            dataIndex: 'completionRejectionReason',
            key: 'completionRejectionReason',
            width: 240,
            ellipsis: true,
            render: (text?: string | null) => text ? <Text type="danger">{text}</Text> : <Text type="secondary">无</Text>,
        },
        {
            title: '期望时间',
            dataIndex: 'expectedTime',
            key: 'expectedTime',
            width: 180,
            render: (text: string) => new Date(text).toLocaleString(),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: string) => {
                const st = statusMap[status] || { label: status, color: 'default' };
                return <Tag color={st.color}>{st.label}</Tag>;
            },
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right' as const,
            width: 360,
            render: (_: unknown, record: Order) => {
                const disputed = isCompletionDispute(record);

                return (
                    <Space size="middle" wrap>
                        {record.status === 'under_review' && !disputed && (
                            <>
                                <Button type="primary" icon={<CheckOutlined />} onClick={() => showAuditModal(record)} size="small">
                                    审核赋分
                                </Button>
                                <Button danger icon={<CloseOutlined />} onClick={() => handleRejectNewOrder(record)} size="small">
                                    驳回需求
                                </Button>
                            </>
                        )}

                        {record.status === 'under_review' && disputed && (
                            <>
                                <Button type="primary" icon={<RollbackOutlined />} onClick={() => handleDisputeAction(record, 'pending')} size="small">
                                    放回任务大厅
                                </Button>
                                <Button icon={<SendOutlined />} onClick={() => handleDisputeAction(record, 'submitted')} size="small">
                                    继续家属确认
                                </Button>
                            </>
                        )}

                        <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} size="small">
                            修改
                        </Button>
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} size="small">
                            删除
                        </Button>
                    </Space>
                );
            },
        },
    ];

    const pendingAuditData = useMemo(
        () => allOrders.filter((order) => order.status === 'under_review'),
        [allOrders]
    );

    return (
        <Card title="需求管理" style={{ minHeight: '80vh' }}>
            <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab={<span><AuditOutlined />待审核需求 ({pendingAuditData.length})</span>} key="1">
                    <Table
                        columns={columns}
                        dataSource={pendingAuditData}
                        rowKey="id"
                        loading={loading}
                        locale={{ emptyText: '暂无待审核需求' }}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1600 }}
                    />
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><HistoryOutlined />全部历史需求</span>} key="2">
                    <Table
                        columns={columns}
                        dataSource={allOrders}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1600 }}
                    />
                </Tabs.TabPane>
            </Tabs>

            <Modal
                title="审核并赋分"
                open={auditModalOpen}
                onOk={handleApproveNewOrder}
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
                                审核通过后，该需求会出现在志愿者任务大厅中，志愿者完成任务后将获得这里设置的积分奖励。
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
                width={680}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="title" label="标题" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                        <Select options={categoryOptions} />
                    </Form.Item>
                    <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                        <Select>
                            {Object.entries(statusMap).map(([value, item]) => (
                                <Select.Option key={value} value={value}>{item.label}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="需求描述">
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
                    <Form.Item name="completionRejectionReason" label="完成驳回理由">
                        <Input.TextArea rows={3} readOnly />
                    </Form.Item>
                    <Form.Item label="志愿者完成说明">
                        <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                            {selectedOrder?.completionDescription || '无'}
                        </Paragraph>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default OrderAudit;
