import React, { useCallback, useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Select, message, Space, Modal } from 'antd';
import api from '../../utils/api';

interface User {
    id: number;
    role: string;
    name: string;
    phone: string;
    status: string;
    points: number;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [roleFilter, setRoleFilter] = useState<string>('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/users', { params: { role: roleFilter } });
            setUsers(data.users);
        } catch {
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await api.put(`/admin/users/${id}/status`, { status });
            message.success('状态更新成功');
            await fetchUsers();
        } catch {
            message.error('更新失败');
        }
    };

    const handleDelete = (user: User) => {
        Modal.confirm({
            title: '删除用户',
            content: `确定永久删除用户【${user.name}】吗？此操作不可撤销。`,
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await api.delete(`/admin/users/${user.id}`);
                    message.success('删除成功');
                    await fetchUsers();
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
            render: (_: unknown, __: User, index: number) => index + 1
        },
        { title: '角色', dataIndex: 'role', key: 'role', render: (role: string) => {
            const roleMap: Record<string, string> = { elderly: '老人/家属', volunteer: '志愿者', admin: '管理员' };
            const colorMap: Record<string, string> = { elderly: 'blue', volunteer: 'green', admin: 'red' };
            return <Tag color={colorMap[role]}>{roleMap[role]}</Tag>;
        }},
        { title: '姓名', dataIndex: 'name', key: 'name' },
        { title: '手机号', dataIndex: 'phone', key: 'phone' },
        { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
            const statusMap: Record<string, string> = { pending: '待审核', active: '活跃', disabled: '已禁用' };
            const colorMap: Record<string, string> = { pending: 'orange', active: 'green', disabled: 'red' };
            return <Tag color={colorMap[status]}>{statusMap[status]}</Tag>;
        }},
        { title: '积分', dataIndex: 'points', key: 'points' },
        { title: '操作', key: 'action', render: (_: unknown, record: User) => (
            <Space size="middle">
                {record.status === 'pending' && <Button type="link" onClick={() => handleStatusUpdate(record.id, 'active')}>审核通过</Button>}
                {record.status !== 'disabled' && <Button type="link" danger onClick={() => handleStatusUpdate(record.id, 'disabled')}>禁用</Button>}
                {record.status === 'disabled' && <Button type="link" onClick={() => handleStatusUpdate(record.id, 'active')}>解禁</Button>}
                <Button type="link" danger onClick={() => handleDelete(record)}>删除</Button>
            </Space>
        )},
    ];

    return (
        <Card title="用户管理">
            <div style={{ marginBottom: 16 }}>
                按角色筛选：
                <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 120 }}>
                    <Select.Option value="">全部</Select.Option>
                    <Select.Option value="elderly">老人/家属</Select.Option>
                    <Select.Option value="volunteer">志愿者</Select.Option>
                </Select>
            </div>
            <Table 
                columns={columns} 
                dataSource={users} 
                rowKey="id" 
                loading={loading}
            />
        </Card>
    );
};

export default UserManagement;
