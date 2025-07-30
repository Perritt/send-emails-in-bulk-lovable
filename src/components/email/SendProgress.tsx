import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Send } from "lucide-react";

interface SendProgressProps {
  progress: {
    sent: number;
    total: number;
    failed: number;
  };
  isSending: boolean;
}

export const SendProgress = ({ progress, isSending }: SendProgressProps) => {
  const successRate = progress.total > 0 ? ((progress.sent - progress.failed) / progress.total) * 100 : 0;
  const completionRate = progress.total > 0 ? (progress.sent / progress.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          发送进度
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{progress.total}</div>
            <div className="text-sm text-muted-foreground">总计</div>
          </div>
          <div className="text-center p-4 bg-success/10 rounded-lg">
            <div className="text-2xl font-bold text-success">{progress.sent - progress.failed}</div>
            <div className="text-sm text-muted-foreground">成功</div>
          </div>
          <div className="text-center p-4 bg-destructive/10 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{progress.failed}</div>
            <div className="text-sm text-muted-foreground">失败</div>
          </div>
          <div className="text-center p-4 bg-warning/10 rounded-lg">
            <div className="text-2xl font-bold text-warning">{progress.total - progress.sent}</div>
            <div className="text-sm text-muted-foreground">待发送</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">发送进度</span>
            <span className="text-sm text-muted-foreground">
              {progress.sent} / {progress.total} ({completionRate.toFixed(1)}%)
            </span>
          </div>
          <Progress value={completionRate} className="h-3" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">成功率</span>
            <span className="text-sm text-muted-foreground">
              {successRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={successRate} className="h-3" />
        </div>

        <div className="flex items-center justify-center gap-4 py-4">
          {isSending ? (
            <>
              <Clock className="h-5 w-5 text-warning animate-spin" />
              <Badge variant="outline" className="text-warning border-warning">
                正在发送中...
              </Badge>
            </>
          ) : progress.sent === progress.total && progress.total > 0 ? (
            <>
              <CheckCircle className="h-5 w-5 text-success" />
              <Badge variant="outline" className="text-success border-success">
                发送完成
              </Badge>
            </>
          ) : progress.sent > 0 ? (
            <>
              <XCircle className="h-5 w-5 text-destructive" />
              <Badge variant="outline" className="text-destructive border-destructive">
                发送中断
              </Badge>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline">
                等待开始
              </Badge>
            </>
          )}
        </div>

        {isSending && (
          <div className="text-center text-sm text-muted-foreground">
            正在发送邮件，请耐心等待...
            <br />
            系统会自动切换发件人以确保发送成功
          </div>
        )}

        {progress.sent === progress.total && progress.total > 0 && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="text-center text-success font-medium">
              🎉 所有邮件发送完成！
            </div>
            <div className="text-center text-sm text-muted-foreground mt-1">
              成功发送 {progress.sent - progress.failed} 封，失败 {progress.failed} 封
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};