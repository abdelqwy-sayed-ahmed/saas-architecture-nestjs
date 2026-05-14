export const RABBITMQ_EXCHANGES = {
  CHAT: 'chat.exchange',
} as const;

export const RABBITMQ_ROUTING_KEYS = {
  MESSAGE_SENT: 'message.sent',
} as const;

export interface MessageSentPayload {
  messageId: number;
  roomId: number;
  senderId: number;
//   senderName?: string;
  content: string;
  createdAt: Date;
  tenantId: string;             // App 2 needs this to scope the notification correctly
  recipientIds: number[];       // who should receive the notification
}