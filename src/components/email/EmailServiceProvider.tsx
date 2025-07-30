import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertCircle } from "lucide-react";

interface EmailServiceProviderProps {
  selectedProvider: "feishu" | "gmail";
  onProviderChange: (provider: "feishu" | "gmail") => void;
}

export const EmailServiceProvider = ({ selectedProvider, onProviderChange }: EmailServiceProviderProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          邮件服务商选择
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedProvider} onValueChange={onProviderChange}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="feishu" id="feishu" />
              <Label htmlFor="feishu" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">飞书邮箱</div>
                    <div className="text-sm text-muted-foreground">企业级邮件服务，稳定可靠</div>
                  </div>
                  <Badge variant="default">推荐</Badge>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-60">
              <RadioGroupItem value="gmail" id="gmail" disabled />
              <Label htmlFor="gmail" className="flex-1 cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Gmail</div>
                    <div className="text-sm text-muted-foreground">Google邮件服务</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <Badge variant="secondary">即将上线</Badge>
                  </div>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>

        {selectedProvider === "feishu" && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm text-primary font-medium mb-2">飞书邮箱配置信息</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>App ID: cli_a80cb37dcd38100c</div>
              <div>App Secret: Mwt5***（已配置）</div>
              <div>SMTP服务器: smtp.feishu.cn</div>
              <div>端口: 465 (SSL)</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};