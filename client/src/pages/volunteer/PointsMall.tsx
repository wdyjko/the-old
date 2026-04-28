import React, { useState } from 'react';
import { Card, Typography, List, Button, message, Modal, Input, Space } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { useUserStore } from '../../store/userStore';
import api from '../../utils/api';

const { Title, Text } = Typography;

const mockGifts = [
    { id: 1, name: '社区超市 10 元优惠券', points: 20, icon: '🛒' },
    { id: 2, name: '理发店免费剪发一次', points: 50, icon: '💇' },
    { id: 3, name: '"公益之星"荣誉称号', points: 100, icon: '⭐' },
    { id: 4, name: '社区健身中心月卡', points: 200, icon: '🏋️' },
];

const PointsMall: React.FC = () => {
    const { user, updateUser } = useUserStore();
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const [redeemModalOpen, setRedeemModalOpen] = useState(false);
    const [selectedPrize, setSelectedPrize] = useState<typeof mockGifts[0] | null>(null);
    const [targetPhone, setTargetPhone] = useState(user?.phone || '');

    // User profile state to check for Honor Title
    const [hasHonor, setHasHonor] = useState(false);
    const [hasUnusedHonor, setHasUnusedHonor] = useState(false);

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/auth/profile');
                const redemptions = data.user.prizeRedemptions || [];
                // Check if they have the shipped honor title
                setHasHonor(redemptions.some((p: { prizeName: string, status: string }) => p.prizeName.includes('公益之星') && p.status === 'shipped'));
                // Check if they ever redeemed it (pending OR shipped) to block second purchases
                setHasUnusedHonor(redemptions.some((p: { prizeName: string }) => p.prizeName.includes('公益之星')));
            } catch (err) {
                console.error('Failed to load profile in PointsMall', err);
            }
        };
        fetchProfile();
    }, []);

    const getDiscountedPoints = (item: typeof mockGifts[0]) => {
        if (hasHonor && !item.name.includes('公益之星')) {
            return Math.floor(item.points * 0.95);
        }
        return item.points;
    };

    const handleRedeemClick = (item: typeof mockGifts[0]) => {
        setSelectedPrize(item);
        setTargetPhone(user?.phone || '');
        setRedeemModalOpen(true);
    };

    const confirmRedeem = async () => {
        if (!selectedPrize) return;
        if (!targetPhone || !/^1[3-9]\d{9}$/.test(targetPhone)) {
            message.error('请输入正确的11位手机号码');
            return;
        }

        setLoadingId(selectedPrize.id);
        const actualPoints = getDiscountedPoints(selectedPrize);

        try {
            const res = await api.post('/auth/redeem', {
                points: actualPoints,
                itemName: selectedPrize.name,
                targetPhone
            });
            
            message.success(res.data.message || '兑换成功！');
            setRedeemModalOpen(false);
            
            // Update global user points locally
            if (user) {
                updateUser({ points: res.data.points });
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            console.error('Redeem error:', err);
            message.error(err.response?.data?.message || '兑换失败，请稍后重试');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div>
            <Card style={{ marginBottom: 24, textAlign: 'center' }}>
                <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
                <Title level={3} style={{ margin: '16px 0 0' }}>我的积分: {user?.points || 0}</Title>
                <Text type="secondary">完成更多服务，赚取更多积分！</Text>
            </Card>
            
            <Card title="积分兑换商城">
                <List
                    dataSource={mockGifts}
                    renderItem={item => {
                        const actualPoints = getDiscountedPoints(item);
                        const isHonorItem = item.name.includes('公益之星');
                        const isDisabled = (user?.points || 0) < actualPoints || (isHonorItem && hasUnusedHonor);
                        
                        return (
                            <List.Item actions={[
                                <Button 
                                    type="primary" 
                                    disabled={isDisabled}
                                    loading={loadingId === item.id}
                                    onClick={() => handleRedeemClick(item)}
                                >
                                    {isHonorItem && hasUnusedHonor ? '已兑换' : `兑换 (${actualPoints} 分)`}
                                </Button>
                            ]}>
                                <List.Item.Meta
                                    avatar={<span style={{ fontSize: 32 }}>{item.icon}</span>}
                                    title={
                                        <Space>
                                            <span>{item.name}</span>
                                            {isHonorItem && <Typography.Text type="secondary" style={{fontSize: 12}}>每人限兑1次, 拥有后享全场95折</Typography.Text>}
                                        </Space>
                                    }
                                    description={
                                        hasHonor && !isHonorItem ? (
                                            <Space>
                                                <Typography.Text delete type="secondary">原价 {item.points}</Typography.Text>
                                                <Typography.Text type="danger" strong>公益之星专享 {actualPoints} 积分</Typography.Text>
                                            </Space>
                                        ) : (
                                            `需要 ${item.points} 积分`
                                        )
                                    }
                                />
                            </List.Item>
                        );
                    }}
                />
            </Card>

            <Modal
                title="兑换领取确认"
                open={redeemModalOpen}
                onOk={confirmRedeem}
                onCancel={() => setRedeemModalOpen(false)}
                okText="确认兑换"
                cancelText="取消"
                confirmLoading={loadingId !== null}
            >
                {selectedPrize && (
                    <div style={{ padding: '10px 0' }}>
                        <div style={{ marginBottom: 16 }}>
                            <Typography.Text>您即将消耗 </Typography.Text>
                            <Typography.Text type="danger" strong>{getDiscountedPoints(selectedPrize)}</Typography.Text>
                            <Typography.Text> 积分兑换：</Typography.Text>
                            <br/>
                            <Typography.Text strong style={{ fontSize: 16 }}>【{selectedPrize.name}】</Typography.Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
                                请输入领奖/充值手机号（默认填为您当前的登录手机）：
                            </Text>
                            <Input 
                                size="large"
                                value={targetPhone} 
                                onChange={e => setTargetPhone(e.target.value)} 
                                placeholder="输入完整的11位手机号码" 
                                maxLength={11}
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PointsMall;
