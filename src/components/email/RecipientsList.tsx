import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Users, Plus, Trash2, Send, FileText, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Recipient } from "@/types/email";
import Papa from 'papaparse';

interface RecipientsListProps {
  recipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  onSendEmails: () => void;
  canSend: boolean;
}

export const RecipientsList = ({ recipients, onRecipientsChange, onSendEmails, canSend }: RecipientsListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    email: "",
    creatorName: "",
    socialMediaLink: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRecipient = () => {
    if (!newRecipient.email || !newRecipient.creatorName || !newRecipient.socialMediaLink) return;

    onRecipientsChange([...recipients, { ...newRecipient }]);
    setNewRecipient({ email: "", creatorName: "", socialMediaLink: "" });
    setIsAddDialogOpen(false);
  };

  const handleDeleteRecipient = (index: number) => {
    onRecipientsChange(recipients.filter((_, i) => i !== index));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const newRecipients: Recipient[] = data
          .filter(row => row.Email && row["Creator Name"] && row["Social Media Link"])
          .map(row => ({
            email: row.Email?.trim(),
            creatorName: row["Creator Name"]?.trim(),
            socialMediaLink: row["Social Media Link"]?.trim()
          }));
        
        if (newRecipients.length > 0) {
          onRecipientsChange([...recipients, ...newRecipients]);
        }
      },
      error: (error) => {
        console.error("CSV解析错误:", error);
      }
    });

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = "Email,Creator Name,Social Media Link\nexample@email.com,张三,https://instagram.com/creator\n";
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'email_template.csv';
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            收件人列表 ({recipients.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              下载模板
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              导入CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加收件人
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加收件人</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">邮箱地址</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newRecipient.email}
                      onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
                      placeholder="creator@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="creatorName">创作者姓名</Label>
                    <Input
                      id="creatorName"
                      value={newRecipient.creatorName}
                      onChange={(e) => setNewRecipient({...newRecipient, creatorName: e.target.value})}
                      placeholder="张三"
                    />
                  </div>
                  <div>
                    <Label htmlFor="socialMediaLink">社交媒体链接</Label>
                    <Input
                      id="socialMediaLink"
                      value={newRecipient.socialMediaLink}
                      onChange={(e) => setNewRecipient({...newRecipient, socialMediaLink: e.target.value})}
                      placeholder="https://instagram.com/creator"
                    />
                  </div>
                  <Button onClick={handleAddRecipient} className="w-full">
                    添加
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        {recipients.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">暂无收件人</h3>
            <p className="text-muted-foreground mb-4">
              请添加收件人或导入CSV文件
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                下载CSV模板
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                手动添加
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邮箱</TableHead>
                  <TableHead>创作者姓名</TableHead>
                  <TableHead>社交媒体链接</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient, index) => (
                  <TableRow key={index}>
                    <TableCell>{recipient.email}</TableCell>
                    <TableCell>{recipient.creatorName}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <a 
                        href={recipient.socialMediaLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {recipient.socialMediaLink}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecipient(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between pt-4 border-t">
              <Alert className="flex-1 mr-4">
                <AlertDescription>
                  CSV文件格式要求：Email, Creator Name, Social Media Link 三列，第一行为标题行
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={onSendEmails}
                disabled={!canSend}
                className="flex items-center gap-2"
                size="lg"
              >
                <Send className="h-4 w-4" />
                开始发送 ({recipients.length} 封邮件)
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};