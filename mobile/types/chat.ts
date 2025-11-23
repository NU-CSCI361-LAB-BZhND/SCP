export type ChatSearchParams = {
  id?: string;
};

export type Message = {
  id: number;
  thread: number;
  sender: number;
  sender_email: string;
  sender_role: string;
  text: string;
  file: string | null;
  is_read: boolean;
  created_at: string;
};

export type Chat = {
  id: number;
  consumer: number;
  consumer_name: string;
  supplier: number;
  supplier_name: string;
  updated_at: string;
  last_message: Message;
  escalation_level: string;
};
