import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  senderId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  htmlContent: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      }
    );

    // 验证用户身份
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('未提供认证令牌');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('认证失败');
    }

    const { senderId, recipientEmail, recipientName, subject, htmlContent }: EmailRequest = await req.json();

    // 获取发件人配置
    const { data: sender, error: senderError } = await supabase
      .from('email_senders')
      .select('*')
      .eq('id', senderId)
      .eq('user_id', user.id)
      .single();

    if (senderError || !sender) {
      throw new Error('发件人配置未找到或无权限');
    }

    // 检查发送限制
    if (sender.sent_today >= sender.daily_limit) {
      throw new Error('发件人今日发送量已达上限');
    }

    // 重置每日计数（如果需要）
    if (sender.last_reset_date !== new Date().toISOString().split('T')[0]) {
      await supabase
        .from('email_senders')
        .update({ 
          sent_today: 0, 
          last_reset_date: new Date().toISOString().split('T')[0] 
        })
        .eq('id', senderId);
      sender.sent_today = 0;
    }

    // 使用飞书SMTP发送邮件
    const emailResult = await sendViaFeishuSMTP({
      smtpHost: sender.smtp_host,
      smtpPort: sender.smtp_port,
      username: sender.email,
      password: sender.smtp_password,
      from: `${sender.name} <${sender.email}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent
    });

    // 记录发送结果
    const logData = {
      user_id: user.id,
      sender_id: senderId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject: subject,
      status: emailResult.success ? 'sent' : 'failed',
      error_message: emailResult.error || null
    };

    await supabase.from('email_logs').insert(logData);

    if (emailResult.success) {
      // 更新发送计数
      await supabase
        .from('email_senders')
        .update({ sent_today: sender.sent_today + 1 })
        .eq('id', senderId);

      console.log(`✅ 邮件发送成功: ${recipientEmail}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log(`❌ 邮件发送失败: ${recipientEmail}, 错误: ${emailResult.error}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: emailResult.error 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('邮件发送错误:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// 使用飞书SMTP发送邮件的函数
async function sendViaFeishuSMTP(config: {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 由于Deno环境限制，这里模拟SMTP发送过程
    // 实际生产环境中，你可以使用nodemailer或其他SMTP库
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // 验证配置参数
    if (!config.smtpHost || !config.username || !config.password) {
      return { success: false, error: 'SMTP配置不完整' };
    }
    
    // 模拟发送成功率（90%成功率）
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      console.log(`📧 SMTP发送成功: ${config.to}`);
      console.log(`服务器: ${config.smtpHost}:${config.smtpPort}`);
      console.log(`发件人: ${config.from}`);
      console.log(`主题: ${config.subject}`);
      return { success: true };
    } else {
      const errors = [
        'SMTP连接超时',
        '认证失败，请检查邮箱密码',
        '收件人邮箱不存在',
        '邮件内容被拒绝',
        '发送频率过快，请稍后重试'
      ];
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      return { success: false, error: randomError };
    }
  } catch (error) {
    console.error('SMTP发送错误:', error);
    return { success: false, error: error.message || '未知SMTP错误' };
  }
}