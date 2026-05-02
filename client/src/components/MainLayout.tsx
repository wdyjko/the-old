import React from 'react';
import { Layout, Menu, Button } from 'antd';
import type { ItemType } from 'antd/es/menu/interface';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { UserOutlined, FileTextOutlined, AppstoreAddOutlined, EnvironmentOutlined, GiftOutlined, TeamOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

interface MainLayoutProps {
    role: 'elderly' | 'volunteer' | 'admin';
}

const MainLayout: React.FC<MainLayoutProps> = ({ role }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useUserStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    let menuItems: ItemType[] = [];

    if (role === 'elderly') {
        menuItems = [
            { key: '/elderly', icon: <UserOutlined />, label: '个人中心' },
            { key: '/elderly/publish', icon: <AppstoreAddOutlined />, label: '发布需求' },
            { key: '/elderly/orders', icon: <FileTextOutlined />, label: '我的订单' },
        ];
    } else if (role === 'volunteer') {
        menuItems = [
            { key: '/volunteer', icon: <UserOutlined />, label: '任务大厅' },
            { key: '/volunteer/map', icon: <EnvironmentOutlined />, label: '任务地图' },
            { key: '/volunteer/mall', icon: <GiftOutlined />, label: '积分商城' },
        ];
    } else if (role === 'admin') {
        menuItems = [
            { key: '/admin', icon: <AppstoreAddOutlined />, label: '数据看板' },
            { key: '/admin/audit', icon: <FileTextOutlined />, label: '需求审批' },
            { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
        ];
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '0 20px', boxShadow: '0 2px 8px #f0f1f2' }}>
                <div style={{ fontWeight: 'bold', fontSize: 18, color: '#1890ff' }}>
                    智慧助老服务对接平台
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {user && <span>欢迎, {user.name || user.phone} (积分: {user.points || 0})</span>}
                    <Button type="primary" danger onClick={handleLogout}>退出登录</Button>
                </div>
            </Header>
            <Content style={{ padding: '24px 20px', backgroundColor: '#f5f5f5' }}>
                <Layout style={{ padding: '0', background: 'transparent' }}>
                    {/* Simplified mobile-friendly navigation logic later, using desktop side layout for now to establish grounds */}
                    <Menu
                        mode="horizontal"
                        selectedKeys={[location.pathname]}
                        items={menuItems}
                        onClick={({ key }) => navigate(key)}
                        style={{ marginBottom: 24, borderRadius: 8 }}
                    />
                    <div style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: 400 }}>
                        <Outlet />
                    </div>
                </Layout>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
                智慧助老 - 社区互助生态系统 ©{new Date().getFullYear()} 
            </Footer>
        </Layout>
    );
};

export default MainLayout;
