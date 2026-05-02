import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, List, Spin, Tag, message } from 'antd';
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

const getBrowserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('browser-geolocation-unavailable'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => reject(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    });
};

const TaskMap: React.FC = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const navigate = useNavigate();

    const fetchOrders = useCallback(async (lat?: number, lng?: number) => {
        try {
            const params: Record<string, string | number> = { tab: 'available' };
            if (lat !== undefined && lng !== undefined) {
                params.lat = lat;
                params.lng = lng;
                params.radius = 15;
            }

            const { data } = await api.get('/orders', { params });
            setOrders(data.orders);
            return data.orders as Order[];
        } catch {
            message.error('无法获取待接单任务');
            return [];
        }
    }, []);

    const handleAcceptOrder = useCallback(async (orderId: number) => {
        setLoading(true);
        try {
            await api.post(`/orders/${orderId}/accept`);
            message.success('接单成功，快去服务吧');
            navigate('/volunteer');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || '接单失败');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentLocationMarker: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let orderMarkers: any[] = [];
        let destroyed = false;

        const clearOrderMarkers = () => {
            if (!currentMap || orderMarkers.length === 0) {
                return;
            }

            currentMap.remove(orderMarkers);
            orderMarkers = [];
        };

        const convertBrowserLocation = async (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            AMap: any,
            lng: number,
            lat: number
        ): Promise<{ lat: number; lng: number }> => {
            return new Promise((resolve, reject) => {
                AMap.convertFrom(
                    [lng, lat],
                    'gps',
                    (status: string, result: { locations?: Array<{ lat: number; lng: number }> }) => {
                        if (status === 'complete' && result.locations && result.locations.length > 0) {
                            resolve(result.locations[0]);
                            return;
                        }

                        reject(new Error('convert-location-failed'));
                    }
                );
            });
        };

        const initMap = async () => {
            setLoading(true);

            AMapLoader.load({
                key: AMAP_KEY,
                version: '2.0',
                plugins: ['AMap.Geolocation'],
            })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .then(async (AMap: any) => {
                    if (!mapRef.current || destroyed) {
                        setLoading(false);
                        return;
                    }

                    currentMap = new AMap.Map(mapRef.current, {
                        zoom: 13,
                        center: [116.397428, 39.90923],
                        resizeEnable: true,
                        viewMode: '2D',
                    });

                    infoWindow = new AMap.InfoWindow({
                        offset: new AMap.Pixel(0, -30),
                    });

                    const geolocation = new AMap.Geolocation({
                        enableHighAccuracy: true,
                        timeout: 8000,
                        zoomToAccuracy: false,
                        position: 'RB',
                    });
                    currentMap.addControl(geolocation);

                    const setVolunteerLocation = (lat: number, lng: number) => {
                        if (destroyed || !currentMap) {
                            return;
                        }

                        const position: [number, number] = [lng, lat];
                        currentMap.setZoomAndCenter(15, position);

                        if (!currentLocationMarker) {
                            currentLocationMarker = new AMap.Marker({
                                position,
                                offset: new AMap.Pixel(-12, -12),
                                content: `
                                    <div style="width: 24px; height: 24px; border-radius: 50%; background: #1677ff; border: 4px solid rgba(22,119,255,0.2); box-shadow: 0 0 0 6px rgba(22,119,255,0.08);"></div>
                                `,
                                zIndex: 150,
                            });
                            currentMap.add(currentLocationMarker);
                            return;
                        }

                        currentLocationMarker.setPosition(position);
                    };

                    const renderOrders = async (lat?: number, lng?: number) => {
                        const fetchedOrders = await fetchOrders(lat, lng);

                        if (destroyed || !currentMap) {
                            return;
                        }

                        clearOrderMarkers();

                        if (fetchedOrders.length === 0) {
                            setLoading(false);
                            return;
                        }

                        orderMarkers = fetchedOrders
                            .filter((order) => order.lat && order.lng)
                            .map((order) => {
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
                                    offset: new AMap.Pixel(-20, -20),
                                });

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

                                return marker;
                            });

                        if (orderMarkers.length > 0) {
                            currentMap.add(orderMarkers);
                        }

                        setLoading(false);
                    };

                    const locateAndRefresh = async () => {
                        geolocation.getCurrentPosition(async (status: string, result: { position?: { lat: number; lng: number } }) => {
                            if (destroyed) {
                                return;
                            }

                            if (status === 'complete' && result.position) {
                                setVolunteerLocation(result.position.lat, result.position.lng);
                                await renderOrders(result.position.lat, result.position.lng);
                                return;
                            }

                            try {
                                const browserLocation = await getBrowserLocation();
                                const converted = await convertBrowserLocation(AMap, browserLocation.lng, browserLocation.lat);

                                if (destroyed) {
                                    return;
                                }

                                setVolunteerLocation(converted.lat, converted.lng);
                                await renderOrders(converted.lat, converted.lng);
                            } catch (browserLocationError) {
                                console.warn('Browser geolocation failed:', browserLocationError);
                                message.warning('定位失败，将先显示附近任务列表，请手动点击右下角重新定位');
                                await renderOrders();
                            }
                        });
                    };

                    await locateAndRefresh();
                })
                .catch((error) => {
                    console.error(error);
                    message.error('地图加载失败，请检查配置');
                    setLoading(false);
                });
        };

        initMap();

        return () => {
            destroyed = true;
            currentMap?.destroy();
        };
    }, [fetchOrders]);

    return (
        <div style={{ paddingBottom: 24 }}>
            <Card title="附近实时需求分布" style={{ marginBottom: 24 }} bodyStyle={{ padding: 0 }}>
                <Spin spinning={loading} tip="正在定位并刷新任务地图...">
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
                                <Button key={order.id} type="primary" onClick={() => handleAcceptOrder(order.id)}>一键接单</Button>
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
