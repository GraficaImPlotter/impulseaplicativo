import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Send, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { announcementService } from "@/services/announcementService";
import { useToast } from "@/hooks/use-toast";

export function AnnouncementPanel() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<'update' | 'info' | 'warning'>('update');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      setIsSending(true);
      await announcementService.broadcastAnnouncement(message, type);
      toast({ title: "Comunicado enviado com sucesso!" });
      setMessage("");
    } catch (error) {
      console.error("Error broadcasting:", error);
      toast({ title: "Erro ao enviar comunicado", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const getNoticeDescription = () => {
    switch (type) {
      case 'update': return "Solicita que os usuários carreguem a página novamente.";
      case 'warning': return "Aviso de erro ou instabilidade temporária.";
      case 'info': return "Informação geral ou novidades.";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-impulse-gold" />
        <h3 className="text-lg font-medium">Comunicado Geral</h3>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Comunicado</label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="update">Atualização de Sistema</SelectItem>
              <SelectItem value="info">Informativo Geral</SelectItem>
              <SelectItem value="warning">Alerta de Crise / Manutenção</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{getNoticeDescription()}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensagem</label>
          <Textarea 
            placeholder="Digite a mensagem que todos os usuários receberão instantaneamente..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <Button 
          onClick={handleSend} 
          disabled={!message.trim() || isSending}
          className="w-full md:w-fit"
        >
          {isSending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Enviar para Todos os Usuários Logados
        </Button>
      </div>

      <Card className="bg-muted/50 border-sidebar-border">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Como funciona o Broadcast?</p>
              <p>
                Esta mensagem é enviada via **Realtime Broadcast**. Ela não é salva no banco de dados. 
                Apenas os usuários que estão com o sistema aberto neste exato momento receberão o aviso.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
