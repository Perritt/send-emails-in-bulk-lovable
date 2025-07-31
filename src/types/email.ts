export interface EmailSender {
  id: string;
  user_id: string;
  name: string;
  email: string;
  smtp_password: string;
  smtp_host: string;
  smtp_port: number;
  daily_limit: number;
  sent_today: number;
  last_reset_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  sender_id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
}

export interface Recipient {
  email: string;
  creatorName: string;
  socialMediaLink: string;
}

export interface EmailTemplate {
  subject: string;
  content: string;
}