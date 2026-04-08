import { useEffect, useState } from "react";
import { directMessageService, DirectMessage } from "@/services/directMessageService";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function DirectMessageWatcher() {
  const { user } = useAuth();
  
  // State for the "Quick Reply" modal
  const [replyOpen, setReplyOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = directMessageService.subscribe(user.id, (msg: DirectMessage) => {
      // Sound effect (optional, native browser beep or custom audio if you have one)
      // Play a subtle notification
      
      toast(`Mensagem de ${msg.fromUserName}`, {
        description: msg.message,
        icon: <MessageSquare className="h-4 w-4 text-emerald-400" />,
        duration: 8000,
        action: {
          label: "Responder",
          onClick: () => {
            setTargetUser({ id: msg.fromUserId, name: msg.fromUserName });
            setReplyMessage("");
            setReplyOpen(true);
          }
        },
        id: `dm-${msg.timestamp}` // prevent exactly duplicate toasts
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendReply = async () => {
    if (!user || !targetUser || !replyMessage.trim()) return;
    
    setIsSending(true);
    try {
      await directMessageService.sendMessage({
        fromUserId: user.id,
        fromUserName: user.name,
        toUserId: targetUser.id,
        message: replyMessage.trim(),
        timestamp: new Date().toISOString()
      });
      
      toast.success("Resposta enviada!");
      setReplyOpen(false);
      setReplyMessage("");
    } catch (err) {
      toast.error("Erro ao enviar resposta");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
      <DialogContent className="sm:max-w-md glassmorphism border-white/10">
        <DialogHeader>
          <DialogTitle>Responder a {targetUser?.name}</DialogTitle>
          <DialogDescription>
            Envie uma mensagem direta em tempo real.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Digite sua resposta..."
            className="min-h-[100px] resize-none bg-white/5 border-white/10 focus:border-impulse-gold"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
          />
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => setReplyOpen(false)} className="text-white/70 hover:text-white">
            Cancelar
          </Button>
          <Button 
            onClick={handleSendReply} 
            disabled={!replyMessage.trim() || isSending}
            className="gradient-gold text-impulse-dark"
          >
            {isSending ? "Enviando..." : (
              <>
                <Send className="mr-2 h-4 w-4" /> Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
