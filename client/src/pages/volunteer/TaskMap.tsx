import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, Spin, message, List, Button, Tag } from 'antd';
import AMapLoader from '@amap/amap-jsapi-loader';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AMAP_KEY = 'c2ce20490054a418e342748d4b31b774';

interface Order {
    id: number;
    title: string;
    category: string;
    description: string;
    address: string;
    expectedTime: string;
    lat: number;
    lng: number;
}

const TaskMap: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const navigate = useNavigate();

    // Fetch available orders
    const fetchOrders = useCallback(async (lat?: number, lng?: number) => {
        try {
            const params: any = { tab: 'available' };
            if (lat && lng) {
                params.lat = lat;
                params.lng = lng;
                params.radius = 15; // Set operational radius limit to 15 km
            }
            const { data } = await api.get('/orders', { params });
            setOrders(data.orders);
            return data.orders;
        } catch {
            message.error('无法获取待接单任务');
            return [];
        }
    }, []);

    const handleAcceptOrder = useCallback(async (orderId: number) => {
        setLoading(true);
        try {
            await api.post(`/orders/${orderId}/accept`);
            message.success('接单成功！快去服务吧');
            navigate('/volunteer');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '接单失败');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Make handleAcceptOrder globally available for AMap InfoWindow button click
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).acceptOrderFromMap = handleAcceptOrder;
        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (window as any).acceptOrderFromMap;
        };
    }, [handleAcceptOrder]);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentMap: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let infoWindow: any = null;

        const initMap = async () => {
            setLoading(true);

            AMapLoader.load({
                key: AMAP_KEY,
                version: '2.0',
                plugins: ['AMap.Geolocation'],
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((AMap: any) => {
                if (!mapRef.current) return;

                currentMap = new AMap.Map(mapRef.current, {
                    zoom: 12,
                    center: [116.397428, 39.90923], // Default Beijing
                });

                infoWindow = new AMap.InfoWindow({
                    offset: new AMap.Pixel(0, -30),
                });

                // Get Current User Location with Geolocation plugin
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const geolocation = new (AMap as any).Geolocation({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    zoomToAccuracy: false, // Don't zoom too much since we want to see orders
                    position: 'RB'
                });
                currentMap.addControl(geolocation);
                
                // Fetch location first, then fetch orders!
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                geolocation.getCurrentPosition(async (status: string, result: any) => {
                    let fetchedOrders: Order[] = [];
                    if (status === 'complete' && result.position) {
                        currentMap.setCenter(result.position);
                        fetchedOrders = await fetchOrders(result.position.lat, result.position.lng);
                    } else {
                        // Fallback
                        message.warning('定位失败，将显示所有待接单任务');
                        fetchedOrders = await fetchOrders();
                    }

                    // Auto-fit to order markers if there are any
                    if (fetchedOrders.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const markers: any[] = [];
                        fetchedOrders.forEach((order: Order) => {
                            if (order.lat && order.lng) {
                                const customContent = `
                                    <div class="amap-custom-marker" style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                        <div class="amap-pulse" style="position: absolute; width: 100%; height: 100%; background-color: rgba(250, 84, 28, 0.4); border-radius: 50%; animation: amap-pulse-anim 1.5s infinite ease-out;"></div>
                                        <div class="amap-pin" style="position: relative; width: 24px; height: 24px; background-color: #fa541c; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 2; color: white; font-size: 12px; font-weight: bold;">需</div>
                                    </div>
                                `;

                                const marker = new AMap.Marker({
                                    position: [order.lng, order.lat],
                                    title: order.title,
                                    content: customContent,
                                    offset: new AMap.Pixel(-20, -20)
                                });
                                
                                // InfoWindow content string
                                const contentHtml = `
                                    <div style="padding: 10px; min-width: 250px;">
                                        <h4 style="margin-top:0; margin-bottom: 8px; color: #1890ff;">${order.title}</h4>
                                        <p style="margin: 4px 0; font-size: 13px;"><strong>分类:</strong> <span style="background: #e6f7ff; color: #1890ff; padding: 2px 6px; border-radius: 4px;">${order.category}</span></p>
                                        <p style="margin: 4px 0; font-size: 13px;"><strong>地址:</strong> ${order.address}</p>
                                        <p style="margin: 4px 0; font-size: 13px;"><strong>时间:</strong> ${new Date(order.expectedTime).toLocaleString()}</p>
                                        ${order.description ? `<p style="margin: 4px 0; font-size: 13px; color: #666;"><strong>需求:</strong> ${order.description}</p>` : ''}
                                        <div style="margin-top: 12px; text-align: center;">
                                            <button 
                                                onclick="window.acceptOrderFromMap(${order.id})" 
                                                style="background: #1890ff; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; width: 100%;"
                                            >
                                                一键接单
                                            </button>
                                        </div>
                                    </div>
                                `;

                                marker.on('click', () => {
                                    infoWindow.setContent(contentHtml);
                                    infoWindow.open(currentMap, marker.getPosition());
                                });

                                markers.push(marker);
                            }
                        });

                        currentMap.add(markers);
                        currentMap.setFitView(markers, false, [50, 50, 50, 50]);
                    }
                    
                    setLoading(false);
                });
            })
            .catch((e) => {
                console.error(e);
                message.error('地图加载失败，请检查配置');
                setLoading(false);
            });
        };

        initMap();

        return () => {
            currentMap?.destroy();
        };
    }, [fetchOrders]);

    return (
        <div style={{ paddingBottom: 24 }}>
            <Card title="附近实时需求分布" style={{ marginBottom: 24 }} bodyStyle={{ padding: 0 }}>
                <Spin spinning={loading}>
                    <div ref={mapRef} style={{ width: '100%', height: 500 }}></div>
                </Spin>
            </Card>

            <Card title="可接单的需求列表" loading={loading} style={{ minHeight: 400 }}>
                <List
                    dataSource={orders}
                    locale={{ emptyText: '周边暂无待接单需求' }}
                    renderItem={(order: Order) => (
                        <List.Item 
                            actions={[
                                <Button type="primary" onClick={() => handleAcceptOrder(order.id)}>一键接单</Button>
                            ]}
                        >
                            <List.Item.Meta
                                title={<><Tag color="orange">{order.category}</Tag> {order.title}</>}
                                description={`具体位置: ${order.address} | 期望上门时间: ${new Date(order.expectedTime).toLocaleString()}`}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default TaskMap;
