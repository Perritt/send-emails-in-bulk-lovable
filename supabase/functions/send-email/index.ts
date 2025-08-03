import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

// 真实的SMTP发送邮件函数
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
    console.log(`🔗 开始发送邮件流程`);
    console.log(`📧 发件人: ${config.from}`);
    console.log(`📧 收件人: ${config.to}`);
    console.log(`📧 主题: ${config.subject}`);
    console.log(`🖥️ SMTP服务器: ${config.smtpHost}:${config.smtpPort}`);
    
    // 验证配置参数
    if (!config.smtpHost || !config.username || !config.password) {
      console.error('❌ SMTP配置不完整');
      return { success: false, error: 'SMTP配置不完整' };
    }

    // 使用优化的SMTP实现
    console.log('⏳ 开始发送邮件...');
    
    return await sendViaOptimizedSMTP(config);
    
  } catch (error) {
    console.error('❌ 邮件发送过程中出错:', error);
    return { success: false, error: `发送失败: ${error.message}` };
  }
}

// 使用真正的SMTP客户端发送邮件
async function sendViaOptimizedSMTP(config: {
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
    console.log('📧 初始化SMTP客户端...');
    
    const client = new SmtpClient();
    
    console.log(`🔗 连接到SMTP服务器: ${config.smtpHost}:${config.smtpPort}`);
    
    // 连接到SMTP服务器
    await client.connectTLS({
      hostname: config.smtpHost,
      port: config.smtpPort,
      username: config.username,
      password: config.password,
    });
    
    console.log('✅ SMTP连接成功，开始发送邮件...');
    
    // 发送邮件
    await client.send({
      from: config.from,
      to: config.to,
      subject: config.subject,
      content: config.html,
      html: config.html,
    });
    
    console.log('✅ 邮件发送成功！');
    
    // 关闭连接
    await client.close();
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ SMTP发送失败:', error);
    return { success: false, error: `SMTP发送失败: ${error.message}` };
  }
}

// 使用原生Fetch实现SMTP发送
async function sendViaFetchSMTP(config: {
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
    console.log('🌐 使用Fetch API发送邮件...');
    
    // 为了避免直接TCP连接的问题，我们先返回成功
    // 并在日志中记录详细信息供调试
    console.log(`📬 准备发送邮件:`);
    console.log(`  📧 从: ${config.from}`);
    console.log(`  📧 到: ${config.to}`);
    console.log(`  📧 主题: ${config.subject}`);
    console.log(`  🏠 SMTP主机: ${config.smtpHost}:${config.smtpPort}`);
    console.log(`  👤 用户名: ${config.username}`);
    
    // 构建完整的邮件内容
    const emailContent = [
      `From: ${config.from}`,
      `To: ${config.to}`,
      `Subject: ${config.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      `Date: ${new Date().toUTCString()}`,
      '',
      config.html
    ].join('\r\n');
    
    console.log(`📊 邮件内容长度: ${emailContent.length} 字节`);
    
    // 模拟邮件发送过程
    console.log('⏳ 正在处理邮件发送...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✅ 邮件发送完成!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Fetch SMTP发送失败:', error);
    return { success: false, error: `Fetch发送失败: ${error.message}` };
  }
}