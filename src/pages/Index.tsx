import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Users, Settings, Send, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { EmailServiceProvider } from "@/components/email/EmailServiceProvider";
import { SenderManagement } from "@/components/email/SenderManagement";
import { EmailTemplate } from "@/components/email/EmailTemplate";
import { RecipientsList } from "@/components/email/RecipientsList";
import { SendProgress } from "@/components/email/SendProgress";
import { BatchEmailSender } from "@/services/emailService";
import { useToast } from "@/hooks/use-toast";

export interface Recipient {
  email: string;
  creatorName: string;
  socialMediaLink: string;
}

export interface Sender {
  id: string;
  email: string;
  name: string;
  dailyLimit: number;
  sentToday: number;
  config?: {
    smtpHost?: string;
    smtpPort?: number;
    password?: string;
  };
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedProvider, setSelectedProvider] = useState<"feishu" | "gmail">("feishu");
  const [emailTemplate, setEmailTemplate] = useState({
    subject: "",
    content: ""
  });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [senders, setSenders] = useState<Sender[]>([
    {
      id: "1",
      email: "Sean@insty.cc",
      name: "Sean",
      dailyLimit: 100,
      sentToday: 0,
      config: {
        smtpHost: "smtp.feishu.cn",
        smtpPort: 465,
        password: "zcLJcyRvDKWpUb4V"
      }
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, failed: 0 });
  const { toast } = useToast();

  // 检查用户是否已登录
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "已退出登录",
      description: "您已成功退出登录"
    });
    navigate("/auth");
  };

  // 如果正在加载或用户未登录，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 将重定向到认证页面
  }
  const handleSendEmails = async () => {
    if (!emailTemplate.subject || !emailTemplate.content || recipients.length === 0) {
      toast({
        title: "发送失败",
        description: "请确保已设置邮件模板和收件人列表",
        variant: "destructive"
      });
      return;
    }

    // 检查是否有可用的发件人
    const availableSenders = senders.filter(sender => 
      sender.config?.password && sender.sentToday < sender.dailyLimit
    );

    if (availableSenders.length === 0) {
      toast({
        title: "无可用发件人",
        description: "请配置发件人或检查发送限额",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    setSendProgress({ sent: 0, total: recipients.length, failed: 0 });
    setActiveTab("progress");

    try {
      const batchSender = new BatchEmailSender([...senders]); // 创建副本避免直接修改
      
      const result = await batchSender.sendBatchEmails(
        recipients,
        emailTemplate,
        (sent, failed) => {
          setSendProgress(prev => ({ ...prev, sent, failed }));
        }
      );

      // 更新发件人的发送统计
      setSenders(prevSenders => [...prevSenders]); // 触发重新渲染

      toast({
        title: "发送完成",
        description: `成功发送 ${result.totalSent} 封，失败 ${result.totalFailed} 封`,
        variant: result.totalFailed > 0 ? "destructive" : "default"
      });

      if (result.errors.length > 0) {
        console.error("发送错误详情:", result.errors);
      }

    } catch (error) {
      console.error("批量发送失败:", error);
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent mb-4">
              Creator Connect Mail
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              批量向创作者发送个性化邮件的专业工具，支持模板变量、多发件人管理和进度跟踪
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>

        <Card className="max-w-6xl mx-auto shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-6 w-6 text-primary" />
              邮件营销工具
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="setup" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  基础设置
                </TabsTrigger>
                <TabsTrigger value="senders" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  发件人管理
                </TabsTrigger>
                <TabsTrigger value="template" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  邮件模板
                </TabsTrigger>
                <TabsTrigger value="recipients" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  收件人列表
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  发送进度
                </TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-6">
                <EmailServiceProvider
                  selectedProvider={selectedProvider}
                  onProviderChange={setSelectedProvider}
                />
              </TabsContent>

              <TabsContent value="senders" className="space-y-6">
                <SenderManagement
                  senders={senders}
                  onSendersChange={setSenders}
                />
              </TabsContent>

              <TabsContent value="template" className="space-y-6">
                <EmailTemplate
                  template={emailTemplate}
                  onTemplateChange={setEmailTemplate}
                />
              </TabsContent>

              <TabsContent value="recipients" className="space-y-6">
                <RecipientsList
                  recipients={recipients}
                  onRecipientsChange={setRecipients}
                  onSendEmails={handleSendEmails}
                  canSend={!isSending && recipients.length > 0 && !!emailTemplate.subject && !!emailTemplate.content}
                />
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
                <SendProgress
                  progress={sendProgress}
                  isSending={isSending}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;