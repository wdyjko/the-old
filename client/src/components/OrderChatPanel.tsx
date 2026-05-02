import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, Empty, Image, Input, List, Space, Tag, Typography, Upload, message as antMessage } from 'antd';
import { MessageOutlined, PictureOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { useUserStore } from '../store/userStore';

const { Text } = Typography;

interface ChatMessage {
    id: number;
    orderId?: number;
    type: 'text' | 'image';
    content: string;
    senderId: number;
    senderRole: 'elderly' | 'volunteer' | 'admin';
    createdAt: string;
    sender?: {
        id: number;
        name?: string;
        phone?: string;
        role?: string;
    };
}

interface OrderChatPanelProps {
    orderId: number;
    enabled: boolean;
    onRead?: () => void;
}

const roleLabelMap: Record<string, string> = {
    elderly: '老人',
    volunteer: '志愿者',
    admin: '管理员',
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const OrderChatPanel: React.FC<OrderChatPanelProps> = ({ orderId, enabled, onRead }) => {
    const currentUser = useUserStore((state) => state.user);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [text, setText] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const roomName = useMemo(() => `order_chat_${orderId}`, [orderId]);

    const markAsRead = async () => {
        try {
            await api.post(`/orders/${orderId}/chat/read`);
            onRead?.();
        } catch (error) {
            console.error('Mark chat read failed', error);
        }
    };

    const fetchMessages = async () => {
        if (!enabled) {
            setMessages([]);
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.get(`/orders/${orderId}/chat`);
            setMessages(data.messages || []);
            await markAsRead();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            antMessage.error(err.response?.data?.message || '获取聊天记录失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [orderId, enabled]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const socket = getSocket();
        if (!socket) {
            return;
        }

        socket.emit('join', roomName);

        const handleMessage = async (incoming: ChatMessage) => {
            if (incoming.orderId !== undefined && incoming.orderId !== orderId) {
                return;
            }
            setMessages((prev) => {
                if (prev.some((item) => item.id === incoming.id)) {
                    return prev;
                }
                return [...prev, incoming];
            });

            if (incoming.senderId !== currentUser?.id) {
                await markAsRead();
            }
        };

        socket.on('chat_message', handleMessage);

        return () => {
            socket.off('chat_message', handleMessage);
        };
    }, [enabled, orderId, roomName, currentUser?.id]);

    const sendTextMessage = async () => {
        const content = text.trim();
        if (!content) {
            return;
        }

        setSending(true);
        try {
            await api.post(`/orders/${orderId}/chat`, {
                type: 'text',
                content,
            });
            setText('');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            antMessage.error(err.response?.data?.message || '发送消息失败');
        } finally {
            setSending(false);
        }
    };

    const sendImageMessage = async () => {
        if (!fileList.length || !fileList[0].originFileObj) {
            return;
        }

        setSending(true);
        try {
            const content = await fileToBase64(fileList[0].originFileObj as File);
            await api.post(`/orders/${orderId}/chat`, {
                type: 'image',
                content,
            });
            setFileList([]);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            antMessage.error(err.response?.data?.message || '发送图片失败');
        } finally {
            setSending(false);
        }
    };

    if (!enabled) {
        return (
            <div style={{ padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
                <Space direction="vertical" size={8}>
                    <Text strong>订单聊天</Text>
                    <Text type="secondary">开始服务后，老人和志愿者才能在这里实时聊天。</Text>
                </Space>
            </div>
        );
    }

    return (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                    <MessageOutlined style={{ color: '#1890ff' }} />
                    <Text strong>订单聊天</Text>
                </Space>
                <Tag color="blue">实时</Tag>
            </div>

            <div style={{ height: 280, overflowY: 'auto', padding: 16, background: '#fafcff' }}>
                {messages.length === 0 && !loading ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有聊天消息" />
                ) : (
                <List
                        loading={loading}
                        dataSource={messages}
                        split={false}
                        renderItem={(item) => {
                            const isMine = item.senderId === currentUser?.id;
                            const senderName = item.sender?.name || item.sender?.phone || roleLabelMap[item.senderRole] || '用户';
                            const senderRoleLabel = roleLabelMap[item.senderRole] || item.senderRole;

                            return (
                                <List.Item style={{ justifyContent: isMine ? 'flex-end' : 'flex-start', padding: '6px 0' }}>
                                    <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10, maxWidth: '85%' }}>
                                        <Avatar size="small" icon={<UserOutlined />} />
                                        <div>
                                            <div style={{ marginBottom: 4, textAlign: isMine ? 'right' : 'left' }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {senderName} · {senderRoleLabel}
                                                </Text>
                                            </div>
                                            <div
                                                style={{
                                                    background: isMine ? '#e6f4ff' : '#fff',
                                                    border: '1px solid #e8e8e8',
                                                    borderRadius: 12,
                                                    padding: item.type === 'image' ? 8 : '10px 12px',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                                }}
                                            >
                                                {item.type === 'image' ? (
                                                    <Image
                                                        src={item.content}
                                                        alt="聊天图片"
                                                        style={{ maxWidth: 180, borderRadius: 8 }}
                                                    />
                                                ) : (
                                                    <Text style={{ whiteSpace: 'pre-wrap' }}>{item.content}</Text>
                                                )}
                                            </div>
                                            <div style={{ marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                )}
                <div ref={bottomRef} />
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Input.TextArea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="输入聊天内容..."
                        rows={3}
                        maxLength={500}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Space>
                            <Upload
                                beforeUpload={() => false}
                                fileList={fileList}
                                onChange={({ fileList: nextFileList }) => setFileList(nextFileList.slice(-1))}
                                maxCount={1}
                                accept="image/*"
                            >
                                <Button icon={<PictureOutlined />}>选择图片</Button>
                            </Upload>
                            {fileList.length > 0 && (
                                <Button onClick={sendImageMessage} loading={sending}>
                                    发送图片
                                </Button>
                            )}
                        </Space>
                        <Button type="primary" icon={<SendOutlined />} onClick={sendTextMessage} loading={sending}>
                            发送
                        </Button>
                    </div>
                </Space>
            </div>
        </div>
    );
};

export default OrderChatPanel;
