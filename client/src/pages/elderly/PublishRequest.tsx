import React, { useCallback, useMemo, useState } from 'react';
import { Form, Input, Button, Card, DatePicker, Select, message, Typography, Modal, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import { AudioOutlined, EnvironmentOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import MapPicker from '../../components/MapPicker';
import audioRecorder from '../../utils/audioRecorder';

const { Title, Text } = Typography;

const PublishRequest: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
    const [tempLocation, setTempLocation] = useState<{address: string, lat: number, lng: number} | null>(null);
    const navigate = useNavigate();

    interface OrderFormValues {
        title: string;
        category: string;
        description?: string;
        address: string;
        expectedTime: dayjs.Dayjs;
    }

    const onFinish = async (values: OrderFormValues) => {
        // Validation: Past time check
        if (values.expectedTime.isBefore(dayjs())) {
            Modal.warning({
                title: '上门时间填写错误',
                content: '您设置的期望上门时间不能早于当前时间。为了方便志愿者准时上门，请选择一个未来的时间点哟！',
                okText: '好的，我去修改'
            });
            return;
        }

        if (!selectedLocation) {
            message.warning('请通过地图选择确切的服务地址以便志愿者导航');
            return;
        }
        setLoading(true);
        try {
            await api.post('/orders', {
                ...values,
                expectedTime: values.expectedTime.toISOString(),
                lat: selectedLocation.lat,
                lng: selectedLocation.lng
            });
            message.success('需求发布成功！');
            navigate('/elderly/orders');
        } catch {
            message.error('发布失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceInput = async () => {
        if (!isRecording) {
            try {
                await audioRecorder.start();
                setIsRecording(true);
                message.info('正在聆听... 请说出您的需求，说完后再次点击麦克风结束');
            } catch (error) {
                console.error(error);
                message.error('无法启动录音，请检查浏览器麦克风权限');
            }
        } else {
            try {
                setIsRecording(false);
                setIsRecognizing(true);
                message.loading({ content: '正在智能识别声音...', key: 'voiceRec' });
                
                const base64Pcm = await audioRecorder.stop();
                
                const res = await api.post('/voice/recognize', { audioBase64: base64Pcm });
                const text = res.data.result;
                
                if (text) {
                    const currentDesc = form.getFieldValue('description') || '';
                    form.setFieldsValue({ description: currentDesc + text });
                    message.success({ content: '语音识别成功！', key: 'voiceRec' });
                } else {
                    message.error({ content: '未能识别出语音内容', key: 'voiceRec' });
                }
            } catch (error: unknown) {
                const err = error as { response?: { data?: { message?: string } } };
                console.error('Voice Rec Error:', err);
                message.error({ content: err.response?.data?.message || '语音识别失败，请重试', key: 'voiceRec' });
            } finally {
                setIsRecognizing(false);
            }
        }
    };

    const handleMapSelect = useCallback((loc: {address: string, lat: number, lng: number}) => {
        setTempLocation(loc);
    }, []);

    const initialMapLocation = useMemo(() => {
        if (tempLocation) {
            return tempLocation;
        }

        if (selectedLocation) {
            return {
                address: form.getFieldValue('address') || '',
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
            };
        }

        return null;
    }, [form, selectedLocation, tempLocation]);

    const confirmMapSelection = () => {
        if (tempLocation) {
            form.setFieldsValue({ address: tempLocation.address });
            setSelectedLocation({ lat: tempLocation.lat, lng: tempLocation.lng });
        }
        setMapModalOpen(false);
    };

    return (
        <Card>
            <Title level={3}>发布需求</Title>
            <Text type="secondary">请选择您需要的服务，志愿者接单后会尽快与您联系</Text>
            
            <Form 
                form={form} 
                layout="vertical" 
                onFinish={onFinish} 
                style={{ marginTop: 24, maxWidth: 600 }}
                size="large" // Make inputs larger for elderly
            >
                <Form.Item name="title" label="简短标题 (如：买两斤土豆)" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="category" label="服务分类" rules={[{ required: true }]}>
                    <Select placeholder="请选择">
                        <Select.Option value="代购物品">代购物品 (如买菜、买药)</Select.Option>
                        <Select.Option value="上门维修">上门维修 (家电小修、换灯泡)</Select.Option>
                        <Select.Option value="陪同就医">陪同就医</Select.Option>
                        <Select.Option value="生活照料">生活照料 (打扫卫生、理发)</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item name="description" label="详细特征">
                    <Input
                        size="large"
                        suffix={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isRecognizing && <Spin size="small" />}
                                <AudioOutlined 
                                    style={{ 
                                        fontSize: 24, 
                                        color: isRecording ? '#ff4d4f' : '#1890ff', 
                                        cursor: 'pointer',
                                    }} 
                                    onClick={(!isRecognizing && !loading) ? handleVoiceInput : undefined}
                                />
                            </div>
                        }
                        placeholder={isRecording ? "正在录音，请说话..." : "可点击右侧麦克风说出您的需求..."}
                    />
                </Form.Item>

                <Form.Item label="服务地址" required>
                    <Space.Compact style={{ width: '100%' }}>
                        <Form.Item name="address" noStyle rules={[{ required: true, message: '请选择服务地址' }]}>
                            <Input placeholder="请点击右侧按钮在地图上选择地址" readOnly />
                        </Form.Item>
                        <Button 
                            type="primary" 
                            icon={<EnvironmentOutlined />} 
                            onClick={() => setMapModalOpen(true)}
                        >
                            在地图上选择
                        </Button>
                    </Space.Compact>
                </Form.Item>

                <Form.Item name="expectedTime" label="期望上门时间" rules={[{ required: true }]}>
                    <DatePicker 
                        showTime 
                        showNow={false}
                        format="YYYY-MM-DD HH:mm" 
                        style={{ width: '100%' }} 
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        disabledTime={(current) => {
                            if (current && current.isSame(dayjs(), 'day')) {
                                return {
                                    disabledHours: () => Array.from({ length: dayjs().hour() }, (_, i) => i),
                                    disabledMinutes: (selectedHour) => {
                                        if (selectedHour === dayjs().hour()) {
                                            return Array.from({ length: dayjs().minute() }, (_, i) => i);
                                        }
                                        return [];
                                    },
                                };
                            }
                            return {};
                        }}
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ width: '100%' }}>
                        提交需求
                    </Button>
                </Form.Item>
            </Form>

            <Modal
                title="选择服务位置 (拖动图标微调)"
                open={mapModalOpen}
                onCancel={() => setMapModalOpen(false)}
                onOk={confirmMapSelection}
                okText="确认选择"
                cancelText="取消"
                width={800}
                destroyOnClose
            >
                <div style={{ height: 500 }}>
                    <MapPicker onSelect={handleMapSelect} initialLocation={initialMapLocation} />
                </div>
            </Modal>
        </Card>
    );
};

export default PublishRequest;
