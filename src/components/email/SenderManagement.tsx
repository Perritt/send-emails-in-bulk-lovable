import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, User, Settings, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { EmailSender } from "@/types/email";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditSenderDialogProps {
  sender: EmailSender;
  onUpdate: (sender: EmailSender) => void;
}

const EditSenderDialog = ({ sender, onUpdate }: EditSenderDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSender, setEditingSender] = useState({
    name: sender.name,
    email: sender.email,
    daily_limit: sender.daily_limit,
    smtp_password: sender.smtp_password || ""
  });

  const handleUpdate = () => {
    const updatedSender: EmailSender = {
      ...sender,
      name: editingSender.name,
      email: editingSender.email,
      daily_limit: editingSender.daily_limit,
      smtp_password: editingSender.smtp_password
    };
    
    onUpdate(updatedSender);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑发件人</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editName">发件人姓名</Label>
            <Input
              id="editName"
              value={editingSender.name}
              onChange={(e) => setEditingSender({...editingSender, name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="editEmail">邮箱地址</Label>
            <Input
              id="editEmail"
              type="email"
              value={editingSender.email}
              onChange={(e) => setEditingSender({...editingSender, email: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="editDailyLimit">每日发送限制</Label>
            <Input
              id="editDailyLimit"
              type="number"
              value={editingSender.daily_limit}
              onChange={(e) => setEditingSender({...editingSender, daily_limit: parseInt(e.target.value)})}
              min="1"
              max="1000"
            />
          </div>
          <div>
            <Label htmlFor="editPassword">IMAP/SMTP 密码</Label>
            <Input
              id="editPassword"
              type="password"
              value={editingSender.smtp_password}
              onChange={(e) => setEditingSender({...editingSender, smtp_password: e.target.value})}
              placeholder="邮箱专用密码"
            />
          </div>
          <Button onClick={handleUpdate} className="w-full">
            保存修改
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface SenderManagementProps {
  senders: EmailSender[];
  onSendersChange: (senders: EmailSender[]) => void;
}

export const SenderManagement = ({ senders, onSendersChange }: SenderManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSender, setNewSender] = useState({
    email: "",
    name: "",
    daily_limit: 100,
    smtp_password: ""
  });

  const handleAddSender = async () => {
    if (!newSender.email || !newSender.name) return;

    try {
      const { realEmailService } = await import("@/services/realEmailService");
      const addedSender = await realEmailService.addSender({
        name: newSender.name,
        email: newSender.email,
        smtp_password: newSender.smtp_password,
        smtp_host: "smtp.feishu.cn",
        smtp_port: 465,
        daily_limit: newSender.daily_limit,
        sent_today: 0,
        last_reset_date: new Date().toISOString().split('T')[0],
        is_active: true
      });

      onSendersChange([...senders, addedSender]);

      setNewSender({ email: "", name: "", daily_limit: 100, smtp_password: "" });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('添加发件人失败:', error);
    }
  };

  const handleDeleteSender = (id: string) => {
    onSendersChange(senders.filter(s => s.id !== id));
  };

  const getSenderStatus = (sender: EmailSender) => {
    if (!sender.smtp_password) return "未配置";
    if (sender.sent_today >= sender.daily_limit) return "已达上限";
    return "可用";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "可用": return "success";
      case "已达上限": return "warning";
      case "未配置": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            发件人管理
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                添加发件人
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新发件人</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="senderEmail">邮箱地址</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={newSender.email}
                    onChange={(e) => setNewSender({...newSender, email: e.target.value})}
                    placeholder="例：sender@insty.cc"
                  />
                </div>
                <div>
                  <Label htmlFor="senderName">发件人姓名</Label>
                  <Input
                    id="senderName"
                    value={newSender.name}
                    onChange={(e) => setNewSender({...newSender, name: e.target.value})}
                    placeholder="例：Sean"
                  />
                </div>
                <div>
                  <Label htmlFor="dailyLimit">每日发送限制</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    value={newSender.daily_limit}
                    onChange={(e) => setNewSender({...newSender, daily_limit: parseInt(e.target.value)})}
                    min="1"
                    max="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="password">IMAP/SMTP 密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newSender.smtp_password}
                    onChange={(e) => setNewSender({...newSender, smtp_password: e.target.value})}
                    placeholder="邮箱专用密码"
                  />
                </div>
                <Button onClick={handleAddSender} className="w-full">
                  添加发件人
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {senders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无发件人，请添加至少一个发件人</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发件人</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>今日发送</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {senders.map((sender) => {
                  const status = getSenderStatus(sender);
                  return (
                    <TableRow key={sender.id}>
                      <TableCell className="font-medium">{sender.name}</TableCell>
                      <TableCell>{sender.email}</TableCell>
                      <TableCell>
                        {sender.sent_today} / {sender.daily_limit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(status) === "success" ? "default" : 
                                       getStatusColor(status) === "warning" ? "secondary" : 
                                       getStatusColor(status) === "destructive" ? "destructive" : "secondary"}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EditSenderDialog sender={sender} onUpdate={(updatedSender) => {
                            onSendersChange(senders.map(s => s.id === sender.id ? updatedSender : s));
                          }} />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteSender(sender.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>配置指引：</strong>
                <br />
                1. 请确保邮箱已开启IMAP/SMTP服务
                <br />
                2. 使用邮箱专用密码，不是登录密码
                <br />
                3. 飞书邮箱SMTP设置：服务器 smtp.feishu.cn，端口 465，启用SSL
                <br />
                4. 发送达到上限后会自动切换到下一个可用发件人
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};