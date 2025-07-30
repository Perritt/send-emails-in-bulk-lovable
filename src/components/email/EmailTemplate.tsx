import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, Code } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 动态导入 ReactQuill
let ReactQuill: any = null;

interface EmailTemplateProps {
  template: {
    subject: string;
    content: string;
  };
  onTemplateChange: (template: { subject: string; content: string }) => void;
}

export const EmailTemplate = ({ template, onTemplateChange }: EmailTemplateProps) => {
  const quillRef = useRef<any>(null);

  useEffect(() => {
    // 动态导入 ReactQuill 和样式
    const loadQuill = async () => {
      if (typeof window !== 'undefined') {
        const { default: ReactQuillComponent } = await import('react-quill');
        await import('react-quill/dist/quill.snow.css');
        ReactQuill = ReactQuillComponent;
      }
    };
    loadQuill();
  }, []);

  const insertVariable = (variable: string) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      quill.insertText(index, variable);
    } else {
      // 如果 Quill 未加载，直接添加到内容末尾
      onTemplateChange({
        ...template,
        content: template.content + variable
      });
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const defaultTemplate = `Hi {Creator Name},

I'm Sean, Creator Manager at Insty.cc, and I've been genuinely impressed by your content on {Social Media Link}.

We're excited to invite you to join our creator partnership program. Here's what we can offer:

• Exclusive brand collaborations with top-tier companies
• Competitive compensation packages
• Creative freedom and support
• Access to our creator community and resources

Would you be interested in learning more about this opportunity?

Best regards,
Sean
Creator Manager, Insty.cc
sean@insty.cc`;

  const handleLoadTemplate = () => {
    onTemplateChange({
      subject: "Exciting Partnership Opportunity with Insty.cc",
      content: defaultTemplate
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            邮件模板编辑
          </CardTitle>
          <Button variant="outline" onClick={handleLoadTemplate}>
            <Code className="h-4 w-4 mr-2" />
            加载示例模板
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="subject">邮件主题</Label>
          <Input
            id="subject"
            value={template.subject}
            onChange={(e) => onTemplateChange({...template, subject: e.target.value})}
            placeholder="请输入邮件主题..."
            className="mt-2"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>邮件内容</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">插入变量：</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertVariable('{Creator Name}')}
              >
                <Badge variant="secondary">{'{Creator Name}'}</Badge>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertVariable('{Social Media Link}')}
              >
                <Badge variant="secondary">{'{Social Media Link}'}</Badge>
              </Button>
            </div>
          </div>
          
          {ReactQuill ? (
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={template.content}
              onChange={(content) => onTemplateChange({...template, content})}
              modules={modules}
              placeholder="请输入邮件内容..."
              style={{ minHeight: '300px' }}
            />
          ) : (
            <div className="border rounded-md">
              <textarea
                value={template.content}
                onChange={(e) => onTemplateChange({...template, content: e.target.value})}
                placeholder="请输入邮件内容..."
                className="w-full h-64 p-3 border-0 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>

        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            <strong>模板变量说明：</strong>
            <br />
            • <code>{'{Creator Name}'}</code> - 将被替换为创作者姓名
            <br />
            • <code>{'{Social Media Link}'}</code> - 将被替换为社交媒体链接
            <br />
            发送时系统会自动将这些变量替换为实际内容
          </AlertDescription>
        </Alert>

        {template.content && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">预览效果：</div>
            <div className="text-sm text-muted-foreground">
              主题: {template.subject || "（未设置主题）"}
            </div>
            <div 
              className="mt-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: template.content
                  .replace(/\{Creator Name\}/g, '<span class="bg-primary/20 px-1 rounded">张三</span>')
                  .replace(/\{Social Media Link\}/g, '<span class="bg-primary/20 px-1 rounded">https://instagram.com/creator</span>')
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};