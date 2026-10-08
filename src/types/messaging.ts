export interface MessageItem {
  id: string;
  matchId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
}

export type MessageListener = (message: MessageItem) => void;
