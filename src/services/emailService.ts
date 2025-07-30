import { Recipient, Sender } from "@/pages/Index";

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from: string;
}

// 飞书邮件服务配置
const FEISHU_CONFIG = {
  smtpHost: "smtp.feishu.cn",
  smtpPort: 465,
  secure: true
};

// 由于浏览器限制，我们使用一个简化的邮件发送模拟
// 在实际生产环境中，应该通过后端服务发送邮件
export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // 模拟邮件发送延迟
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // 模拟发送成功率（95%成功率）
      const success = Math.random() > 0.05;

      if (success) {
        console.log(`✅ 邮件发送成功: ${emailData.to}`);
        console.log(`主题: ${emailData.subject}`);
        console.log(`发件人: ${emailData.from}`);
        return { success: true };
      } else {
        console.log(`❌ 邮件发送失败: ${emailData.to}`);
        return { success: false, error: "SMTP连接超时" };
      }
    } catch (error) {
      console.error("邮件发送错误:", error);
      return { success: false, error: error instanceof Error ? error.message : "未知错误" };
    }
  }

  static createFromSender(sender: Sender): EmailService {
    const config: EmailConfig = {
      smtpHost: sender.config?.smtpHost || FEISHU_CONFIG.smtpHost,
      smtpPort: sender.config?.smtpPort || FEISHU_CONFIG.smtpPort,
      secure: FEISHU_CONFIG.secure,
      username: sender.email,
      password: sender.config?.password || ""
    };

    return new EmailService(config);
  }
}

export class BatchEmailSender {
  private senders: Sender[];
  private currentSenderIndex: number = 0;

  constructor(senders: Sender[]) {
    this.senders = senders.filter(sender => 
      sender.config?.password && sender.sentToday < sender.dailyLimit
    );
  }

  private getNextAvailableSender(): Sender | null {
    // 找到下一个可用的发件人
    const availableSenders = this.senders.filter(sender => 
      sender.sentToday < sender.dailyLimit
    );

    if (availableSenders.length === 0) {
      return null;
    }

    // 轮询策略
    this.currentSenderIndex = this.currentSenderIndex % availableSenders.length;
    return availableSenders[this.currentSenderIndex++];
  }

  private replaceVariables(template: string, recipient: Recipient): string {
    return template
      .replace(/\{Creator Name\}/g, recipient.creatorName)
      .replace(/\{Social Media Link\}/g, recipient.socialMediaLink);
  }

  async sendBatchEmails(
    recipients: Recipient[],
    template: { subject: string; content: string },
    onProgress: (sent: number, failed: number) => void
  ): Promise<{ totalSent: number; totalFailed: number; errors: string[] }> {
    let totalSent = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      const sender = this.getNextAvailableSender();
      
      if (!sender) {
        errors.push("所有发件人已达到发送限制");
        totalFailed++;
        onProgress(totalSent, totalFailed);
        continue;
      }

      const emailService = EmailService.createFromSender(sender);
      
      const emailData: EmailData = {
        to: recipient.email,
        subject: this.replaceVariables(template.subject, recipient),
        html: this.replaceVariables(template.content, recipient),
        from: `${sender.name} <${sender.email}>`
      };

      const result = await emailService.sendEmail(emailData);

      if (result.success) {
        totalSent++;
        sender.sentToday++;
        console.log(`📧 已发送给 ${recipient.creatorName} (${recipient.email})`);
      } else {
        totalFailed++;
        errors.push(`发送失败 ${recipient.email}: ${result.error}`);
        console.error(`❌ 发送失败给 ${recipient.creatorName}: ${result.error}`);
      }

      onProgress(totalSent, totalFailed);

      // 发送间隔，避免被限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { totalSent, totalFailed, errors };
  }
}

// 飞书API集成（用于获取访问令牌等）
export class FeishuAPI {
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret
        })
      });

      const data = await response.json();
      
      if (data.code === 0) {
        this.accessToken = data.app_access_token;
        return this.accessToken;
      } else {
        throw new Error(`飞书API错误: ${data.msg}`);
      }
    } catch (error) {
      console.error('获取飞书访问令牌失败:', error);
      throw error;
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}

export const feishuAPI = new FeishuAPI(
  "cli_a80cb37dcd38100c",
  "Mwt5E3bmVTpSswOREPFJSdLo6VJnnr0F"
);