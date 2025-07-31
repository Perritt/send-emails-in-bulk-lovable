import { supabase } from "@/integrations/supabase/client";
import { EmailSender, EmailLog, Recipient, EmailTemplate } from "@/types/email";

export class RealEmailService {
  // 获取用户的发件人列表
  async getSenders(): Promise<EmailSender[]> {
    const { data, error } = await supabase
      .from('email_senders')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取发件人列表失败:', error);
      throw error;
    }

    return data || [];
  }

  // 添加新发件人
  async addSender(sender: Omit<EmailSender, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<EmailSender> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('email_senders')
      .insert({
        ...sender,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('添加发件人失败:', error);
      throw error;
    }

    return data;
  }

  // 更新发件人
  async updateSender(id: string, updates: Partial<EmailSender>): Promise<EmailSender> {
    const { data, error } = await supabase
      .from('email_senders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新发件人失败:', error);
      throw error;
    }

    return data;
  }

  // 删除发件人
  async deleteSender(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_senders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除发件人失败:', error);
      throw error;
    }
  }

  // 发送单封邮件
  async sendEmail(
    senderId: string,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    htmlContent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          senderId,
          recipientEmail,
          recipientName,
          subject,
          htmlContent
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('调用发送邮件函数失败:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('发送邮件错误:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  // 批量发送邮件
  async sendBatchEmails(
    recipients: Recipient[],
    template: EmailTemplate,
    senders: EmailSender[],
    onProgress: (sent: number, failed: number) => void
  ): Promise<{ totalSent: number; totalFailed: number; errors: string[] }> {
    let totalSent = 0;
    let totalFailed = 0;
    const errors: string[] = [];
    let currentSenderIndex = 0;

    // 过滤可用的发件人
    const availableSenders = senders.filter(sender => 
      sender.is_active && sender.sent_today < sender.daily_limit
    );

    if (availableSenders.length === 0) {
      errors.push('没有可用的发件人');
      return { totalSent, totalFailed: recipients.length, errors };
    }

    for (const recipient of recipients) {
      // 轮询选择发件人
      const sender = availableSenders[currentSenderIndex % availableSenders.length];
      currentSenderIndex++;

      // 替换模板变量
      const subject = this.replaceVariables(template.subject, recipient);
      const content = this.replaceVariables(template.content, recipient);

      try {
        const result = await this.sendEmail(
          sender.id,
          recipient.email,
          recipient.creatorName,
          subject,
          content
        );

        if (result.success) {
          totalSent++;
          console.log(`✅ 已发送给 ${recipient.creatorName} (${recipient.email})`);
        } else {
          totalFailed++;
          errors.push(`发送失败 ${recipient.email}: ${result.error}`);
          console.error(`❌ 发送失败给 ${recipient.creatorName}: ${result.error}`);
        }
      } catch (error) {
        totalFailed++;
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        errors.push(`发送失败 ${recipient.email}: ${errorMsg}`);
        console.error(`❌ 发送失败给 ${recipient.creatorName}:`, error);
      }

      // 更新进度
      onProgress(totalSent, totalFailed);

      // 发送间隔，避免被限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { totalSent, totalFailed, errors };
  }

  // 替换模板变量
  private replaceVariables(template: string, recipient: Recipient): string {
    return template
      .replace(/\{Creator Name\}/g, recipient.creatorName)
      .replace(/\{Social Media Link\}/g, recipient.socialMediaLink);
  }

  // 获取发送日志
  async getEmailLogs(limit: number = 100): Promise<EmailLog[]> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取邮件日志失败:', error);
      throw error;
    }

    return (data || []) as EmailLog[];
  }

  // 重置每日发送计数
  async resetDailyCounts(): Promise<void> {
    const { error } = await supabase.rpc('reset_daily_email_counts');
    
    if (error) {
      console.error('重置每日计数失败:', error);
      throw error;
    }
  }
}

export const realEmailService = new RealEmailService();