import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Users, Settings, Send } from "lucide-react";
import { EmailServiceProvider } from "@/components/email/EmailServiceProvider";
import { SenderManagement } from "@/components/email/SenderManagement";
import { EmailTemplate } from "@/components/email/EmailTemplate";
import { RecipientsList } from "@/components/email/RecipientsList";
import { SendProgress } from "@/components/email/SendProgress";

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

  const handleSendEmails = async () => {
    if (!emailTemplate.subject || !emailTemplate.content || recipients.length === 0) {
      return;
    }

    setIsSending(true);
    setSendProgress({ sent: 0, total: recipients.length, failed: 0 });
    setActiveTab("progress");

    // 模拟发送过程
    for (let i = 0; i < recipients.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟发送延迟
      setSendProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
    }

    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent mb-4">
            Creator Connect Mail
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            批量向创作者发送个性化邮件的专业工具，支持模板变量、多发件人管理和进度跟踪
          </p>
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