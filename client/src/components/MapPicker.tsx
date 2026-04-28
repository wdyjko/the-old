import React, { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Input, message } from 'antd';

interface MapPickerProps {
    onSelect: (location: { address: string; lat: number; lng: number }) => void;
}

const AMAP_KEY = 'c2ce20490054a418e342748d4b31b774';

const MapPicker: React.FC<MapPickerProps> = ({ onSelect }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentMap: any = null;
        
        AMapLoader.load({
            key: AMAP_KEY,
            version: '2.0',
            plugins: ['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.AutoComplete', 'AMap.Geolocation'],
        })
        .then((AMap) => {
            if (!mapRef.current) return;

            // Initialize Map
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentMap = new (AMap as any).Map(mapRef.current, {
                zoom: 13,
                center: [116.397428, 39.90923], // Default Beijing
            });

            // Initialize Geocoder for Address <-> LatLng
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const geo = new (AMap as any).Geocoder({ city: '全国' });

            // Initialize a draggable marker
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const curMarker = new (AMap as any).Marker({
                position: currentMap.getCenter(),
                draggable: true,
                cursor: 'move'
            });
            curMarker.setMap(currentMap);

            // Get Current User Location with Geolocation plugin
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const geolocation = new (AMap as any).Geolocation({
                enableHighAccuracy: true, // Requires precision
                timeout: 10000,          // Timeout after 10s
                zoomToAccuracy: true,    // Auto-zoom to precision level
                position: 'RB'           // Control button at Right-Bottom
            });
            currentMap.addControl(geolocation);

            geolocation.getCurrentPosition((status: string, result: any) => {
                if (status === 'complete' && result.position) {
                    const currentLngLat = result.position;
                    currentMap.setCenter(currentLngLat);
                    curMarker.setPosition(currentLngLat);
                    // Automatically get address of the current location
                    geo.getAddress(currentLngLat, (geoStatus: string, geoResult: unknown) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const result = geoResult as any;
                        if (geoStatus === 'complete' && result.regeocode) {
                            const address = result.regeocode.formattedAddress;
                            setSearchValue(address);
                            onSelect({ address, lat: currentLngLat.lat, lng: currentLngLat.lng });
                        }
                    });
                } else {
                    // Geolocation failed or denied, it will default to Beijing or last center
                    message.info('无法获取当前定位，请手动选择地址');
                }
            });

            // Listen to marker drag end
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            curMarker.on('dragend', (e: any) => {
                const lnglat = e.lnglat;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                geo.getAddress(lnglat, (status: string, result: any) => {
                    if (status === 'complete' && result.regeocode) {
                        const address = result.regeocode.formattedAddress;
                        setSearchValue(address);
                        onSelect({ address, lat: lnglat.lat, lng: lnglat.lng });
                    }
                });
            });

            // Listen to map click
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentMap.on('click', (e: any) => {
                const lnglat = e.lnglat;
                curMarker.setPosition(lnglat);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                geo.getAddress(lnglat, (status: string, result: any) => {
                    if (status === 'complete' && result.regeocode) {
                        const address = result.regeocode.formattedAddress;
                        setSearchValue(address);
                        onSelect({ address, lat: lnglat.lat, lng: lnglat.lng });
                    }
                });
            });

            // Auto complete search
            const autoOptions = {
                input: "amap-search-input"
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const autoComplete = new (AMap as any).AutoComplete(autoOptions);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const placeSearch = new (AMap as any).PlaceSearch({ map: currentMap });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            autoComplete.on('select', (e: any) => {
                placeSearch.setCity(e.poi.adcode);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                placeSearch.search(e.poi.name, (status: string, result: any) => {
                    if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
                        const poi = result.poiList.pois[0];
                        const lnglat = poi.location;
                        currentMap.setZoomAndCenter(15, lnglat);
                        curMarker.setPosition(lnglat);
                        setSearchValue(poi.name || poi.address);
                        onSelect({ address: poi.name || poi.address, lat: lnglat.lat, lng: lnglat.lng });
                    }
                });
            });

        })
        .catch((e: unknown) => {
            console.error(e);
            message.error('地图加载失败，请检查网络或配置');
        });

        return () => {
            currentMap?.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 8 }}></div>
        </div>
    );
};

export default MapPicker;
