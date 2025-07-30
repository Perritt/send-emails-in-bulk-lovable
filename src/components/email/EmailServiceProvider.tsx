import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { feishuAPI } from "@/services/emailService";
import { useToast } from "@/hooks/use-toast";

interface EmailServiceProviderProps {
  selectedProvider: "feishu" | "gmail";
  onProviderChange: (provider: "feishu" | "gmail") => void;
}

export const EmailServiceProvider = ({ selectedProvider, onProviderChange }: EmailServiceProviderProps) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "success" | "failed">("untested");
  const { toast } = useToast();

  const testFeishuConnection = async () => {
    setIsTestingConnection(true);
    try {
      const isValid = await feishuAPI.validateConfig();
      if (isValid) {
        setConnectionStatus("success");
        toast({
          title: "连接成功",
          description: "飞书API配置有效，可以开始发送邮件",
        });
      } else {
        setConnectionStatus("failed");
        toast({
          title: "连接失败",
          description: "飞书API配置无效，请检查App ID和Secret",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus("failed");
      toast({
        title: "连接失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
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
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-sm text-primary font-medium mb-2">飞书邮箱配置信息</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>App ID: cli_a80cb37dcd38100c</div>
                <div>App Secret: Mwt5***（已配置）</div>
                <div>SMTP服务器: smtp.feishu.cn</div>
                <div>端口: 465 (SSL)</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={testFeishuConnection}
                disabled={isTestingConnection}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isTestingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : connectionStatus === "success" ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : connectionStatus === "failed" ? (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isTestingConnection ? "测试中..." : "测试连接"}
              </Button>
              
              {connectionStatus === "success" && (
                <Badge variant="outline" className="text-success border-success">
                  连接正常
                </Badge>
              )}
              
              {connectionStatus === "failed" && (
                <Badge variant="outline" className="text-destructive border-destructive">
                  连接失败
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};