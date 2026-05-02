import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, message } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../utils/api';

interface CategoryData {
    category: string;
    count: number;
}

interface DashboardStats {
    pendingOrdersCount: number;
    completionRate: number;
    categoriesData: CategoryData[];
    totalUsers?: number;
    newUsersToday?: number;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/dashboard');
                setStats(data.stats);
            } catch {
                message.error('Failed to load dashboard stats');
            }
        };
        fetchStats();
    }, []);

    const getOptions = () => {
        if (!stats) return {};
        const data = stats.categoriesData.map((d: CategoryData) => ({
            name: d.category,
            value: d.count
        }));

        return {
            title: { text: '需求类型分布', left: 'center' },
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', left: 'left' },
            series: [
                {
                    name: '需求分类',
                    type: 'pie',
                    radius: '50%',
                    data,
                    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
                }
            ]
        };
    };

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic 
                            title="待处理订单 (待接单)" 
                            value={stats?.pendingOrdersCount || 0} 
                            prefix={<ClockCircleOutlined />} 
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic 
                            title="本月订单完成率" 
                            value={stats?.completionRate || 0} 
                            suffix="%"
                            prefix={<CheckCircleOutlined />} 
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic 
                            title="今日新增用户" 
                            value={stats?.newUsersToday || 0} 
                            prefix={<UserOutlined />} 
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card>
                        {stats && <ReactECharts option={getOptions()} style={{ height: 400 }} />}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
