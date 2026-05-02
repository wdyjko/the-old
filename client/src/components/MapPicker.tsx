import React, { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Input, Spin, message } from 'antd';

interface MapPickerProps {
    onSelect: (location: { address: string; lat: number; lng: number }) => void;
    initialLocation?: { address: string; lat: number; lng: number } | null;
}

const AMAP_KEY = 'c2ce20490054a418e342748d4b31b774';

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

const MapPicker: React.FC<MapPickerProps> = ({ onSelect, initialLocation = null }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const onSelectRef = useRef(onSelect);
    const initializedRef = useRef(false);
    const destroyedRef = useRef(false);
    const [searchValue, setSearchValue] = useState(initialLocation?.address || '');
    const [loading, setLoading] = useState(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstanceRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markerRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geocoderRef = useRef<any>(null);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        destroyedRef.current = false;

        const syncSelectedAddress = (lnglat: { lat: number; lng: number }, address?: string) => {
            if (address) {
                setSearchValue(address);
                onSelectRef.current({ address, lat: lnglat.lat, lng: lnglat.lng });
                return;
            }

            geocoderRef.current?.getAddress(
                lnglat,
                (status: string, result: { regeocode?: { formattedAddress: string } }) => {
                    if (destroyedRef.current) {
                        return;
                    }

                    if (status === 'complete' && result.regeocode) {
                        const nextAddress = result.regeocode.formattedAddress;
                        setSearchValue(nextAddress);
                        onSelectRef.current({ address: nextAddress, lat: lnglat.lat, lng: lnglat.lng });
                    }
                }
            );
        };

        const applyLocation = (
            lnglat: { lat: number; lng: number },
            options?: { address?: string; zoom?: number }
        ) => {
            const zoom = options?.zoom ?? 16;
            const position: [number, number] = [lnglat.lng, lnglat.lat];
            mapInstanceRef.current?.setZoomAndCenter(zoom, position);
            markerRef.current?.setPosition(position);
            syncSelectedAddress(lnglat, options?.address);
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

        AMapLoader.load({
            key: AMAP_KEY,
            version: '2.0',
            plugins: ['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.AutoComplete', 'AMap.Geolocation'],
        })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((AMap: any) => {
                if (!mapRef.current || initializedRef.current) {
                    return;
                }

                initializedRef.current = true;

                mapInstanceRef.current = new AMap.Map(mapRef.current, {
                    zoom: 13,
                    center: [116.397428, 39.90923],
                    resizeEnable: true,
                    viewMode: '2D',
                });

                geocoderRef.current = new AMap.Geocoder({ city: '全国' });

                markerRef.current = new AMap.Marker({
                    position: mapInstanceRef.current.getCenter(),
                    draggable: true,
                    cursor: 'move',
                });
                markerRef.current.setMap(mapInstanceRef.current);

                const geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,
                    timeout: 8000,
                    zoomToAccuracy: false,
                    position: 'RB',
                });
                mapInstanceRef.current.addControl(geolocation);

                markerRef.current.on('dragend', (e: { lnglat: { lat: number; lng: number } }) => {
                    syncSelectedAddress(e.lnglat);
                });

                mapInstanceRef.current.on('click', (e: { lnglat: { lat: number; lng: number } }) => {
                    markerRef.current?.setPosition(e.lnglat);
                    syncSelectedAddress(e.lnglat);
                });

                const autoComplete = new AMap.AutoComplete({
                    input: 'amap-search-input',
                });
                const placeSearch = new AMap.PlaceSearch({ map: mapInstanceRef.current });

                autoComplete.on('select', (e: { poi: { adcode: string; name: string; address: string } }) => {
                    placeSearch.setCity(e.poi.adcode);
                    placeSearch.search(
                        e.poi.name,
                        (status: string, result: { poiList?: { pois: Array<{ location: { lat: number; lng: number }; name: string; address: string }> } }) => {
                            if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                                const poi = result.poiList.pois[0];
                                applyLocation(
                                    { lat: poi.location.lat, lng: poi.location.lng },
                                    { address: poi.name || poi.address, zoom: 16 }
                                );
                            }
                        }
                    );
                });

                if (initialLocation) {
                    applyLocation(initialLocation, {
                        address: initialLocation.address,
                        zoom: 16,
                    });
                    setLoading(false);
                    return;
                }

                geolocation.getCurrentPosition(async (status: string, result: { position?: { lat: number; lng: number } }) => {
                    if (destroyedRef.current) {
                        return;
                    }

                    if (status === 'complete' && result.position) {
                        applyLocation(result.position, { zoom: 16 });
                        setLoading(false);
                        return;
                    }

                    try {
                        const browserLocation = await getBrowserLocation();
                        const converted = await convertBrowserLocation(AMap, browserLocation.lng, browserLocation.lat);

                        if (destroyedRef.current) {
                            return;
                        }

                        applyLocation(converted, { zoom: 16 });
                    } catch (browserLocationError) {
                        console.warn('Browser geolocation failed:', browserLocationError);
                        message.info('定位不够稳定，请在地图上点选或搜索更准确的服务地址');
                    } finally {
                        if (!destroyedRef.current) {
                            setLoading(false);
                        }
                    }
                });
            })
            .catch((error: unknown) => {
                console.error(error);
                setLoading(false);
                message.error('地图加载失败，请检查网络或高德地图配置');
            });

        return () => {
            destroyedRef.current = true;
            initializedRef.current = false;
            mapInstanceRef.current?.destroy();
            mapInstanceRef.current = null;
            markerRef.current = null;
            geocoderRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!initialLocation || !mapInstanceRef.current || !markerRef.current) {
            return;
        }

        const position: [number, number] = [initialLocation.lng, initialLocation.lat];
        mapInstanceRef.current.setZoomAndCenter(16, position);
        markerRef.current.setPosition(position);
        setSearchValue(initialLocation.address);
    }, [initialLocation?.address, initialLocation?.lat, initialLocation?.lng]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10 }}>
                <Input.Search
                    id="amap-search-input"
                    placeholder="输入地址搜索..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    allowClear
                    enterButton
                    size="large"
                />
            </div>
            <Spin spinning={loading} tip="地图定位中...">
                <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 8 }}></div>
            </Spin>
        </div>
    );
};

export default MapPicker;
