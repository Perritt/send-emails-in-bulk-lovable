-- 创建发件人配置表
CREATE TABLE public.email_senders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  smtp_host TEXT NOT NULL DEFAULT 'smtp.feishu.cn',
  smtp_port INTEGER NOT NULL DEFAULT 465,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  sent_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.email_senders ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own senders" 
ON public.email_senders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own senders" 
ON public.email_senders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own senders" 
ON public.email_senders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own senders" 
ON public.email_senders 
FOR DELETE 
USING (auth.uid() = user_id);

-- 创建邮件发送记录表
CREATE TABLE public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.email_senders(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own email logs" 
ON public.email_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 创建自动更新updated_at的函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为email_senders表创建更新触发器
CREATE TRIGGER update_email_senders_updated_at
  BEFORE UPDATE ON public.email_senders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 创建重置每日发送计数的函数
CREATE OR REPLACE FUNCTION public.reset_daily_email_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.email_senders 
  SET sent_today = 0, last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 创建索引提高查询性能
CREATE INDEX idx_email_senders_user_id ON public.email_senders(user_id);
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_sender_id ON public.email_logs(sender_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);