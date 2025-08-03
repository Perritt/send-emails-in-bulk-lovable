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

// 使用原生fetch实现SMTP发送
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
    console.log('📧 开始发送邮件...');
    console.log(`📧 发件人: ${config.from}`);
    console.log(`📧 收件人: ${config.to}`);
    console.log(`📧 主题: ${config.subject}`);
    console.log(`🖥️ SMTP服务器: ${config.smtpHost}:${config.smtpPort}`);
    
    // 使用基础的SMTP协议发送
    const result = await sendBasicSMTP(config);
    
    if (result.success) {
      console.log('✅ 邮件发送成功！');
    } else {
      console.error('❌ 邮件发送失败:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 发送过程出错:', error);
    return { success: false, error: `发送失败: ${error.message}` };
  }
}

// 基础SMTP实现
async function sendBasicSMTP(config: {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  let socket: Deno.TcpConn | null = null;
  
  try {
    console.log(`🔗 连接到 ${config.smtpHost}:${config.smtpPort}`);
    
    // 建立连接
    socket = await Deno.connect({
      hostname: config.smtpHost,
      port: config.smtpPort,
    });
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // 发送命令并读取响应
    async function sendCommand(command: string): Promise<string> {
      await socket!.write(encoder.encode(command + "\r\n"));
      const buffer = new Uint8Array(1024);
      const n = await socket!.read(buffer);
      return decoder.decode(buffer.subarray(0, n || 0));
    }
    
    // 读取初始响应
    const buffer = new Uint8Array(1024);
    const n = await socket.read(buffer);
    const welcomeMsg = decoder.decode(buffer.subarray(0, n || 0));
    console.log('📥 服务器响应:', welcomeMsg.trim());
    
    if (!welcomeMsg.startsWith('220')) {
      throw new Error(`服务器拒绝连接: ${welcomeMsg}`);
    }
    
    // EHLO
    let response = await sendCommand('EHLO client');
    console.log('📥 EHLO响应:', response.trim());
    
    // AUTH LOGIN
    response = await sendCommand('AUTH LOGIN');
    console.log('📥 AUTH响应:', response.trim());
    
    // 用户名
    response = await sendCommand(btoa(config.username));
    console.log('📥 用户名响应:', response.trim());
    
    // 密码
    response = await sendCommand(btoa(config.password));
    console.log('📥 密码响应:', response.trim());
    
    if (!response.includes('235')) {
      throw new Error('认证失败');
    }
    
    // MAIL FROM
    response = await sendCommand(`MAIL FROM:<${config.username}>`);
    console.log('📥 MAIL FROM响应:', response.trim());
    
    // RCPT TO
    response = await sendCommand(`RCPT TO:<${config.to}>`);
    console.log('📥 RCPT TO响应:', response.trim());
    
    // DATA
    response = await sendCommand('DATA');
    console.log('📥 DATA响应:', response.trim());
    
    // 邮件内容
    const emailContent = [
      `From: ${config.from}`,
      `To: ${config.to}`,
      `Subject: ${config.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      '',
      config.html,
      '.'
    ].join('\r\n');
    
    await socket.write(encoder.encode(emailContent + '\r\n'));
    
    const finalBuffer = new Uint8Array(1024);
    const finalN = await socket.read(finalBuffer);
    const finalResponse = decoder.decode(finalBuffer.subarray(0, finalN || 0));
    console.log('📥 最终响应:', finalResponse.trim());
    
    // QUIT
    await sendCommand('QUIT');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ SMTP错误:', error);
    return { success: false, error: error.message };
  } finally {
    if (socket) {
      try {
        socket.close();
      } catch (e) {
        console.log('连接关闭错误:', e);
      }
    }
  }
}