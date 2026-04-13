import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const payload = await req.json();
    
    console.log('--- Bridge Activity ---');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // ==========================================================
    // CANAL 1: APP -> TELEGRAM (Outgoing)
    // Identificado pelo gatilho do Supabase (payload.record)
    // ==========================================================
    if (payload.record && !payload.record.is_from_dev) {
      const { message, user_name, user_id, file_url, file_type } = payload.record;
      
      let telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      let body: any = {
        chat_id: TELEGRAM_CHAT_ID,
        parse_mode: 'HTML',
      };

      const formattedMessage = `<b>🛡️ Suporte Impulse</b>\n\n<b>De:</b> ${user_name}\n<b>ID:</b> <code>${user_id}</code>\n\n<b>Mensagem:</b>\n${message}\n\n#Suporte #NovoTicket`;

      if (file_url) {
        if (file_type === 'image') {
          telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
          body.photo = file_url;
          body.caption = formattedMessage;
        } else {
          telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
          body.document = file_url;
          body.caption = formattedMessage;
        }
      } else {
        body.text = formattedMessage;
      }

      const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return new Response(JSON.stringify({ success: true, direction: 'outgoing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================
    // CANAL 2: TELEGRAM -> APP (Incoming / Response)
    // Identificado pelo Webhook do Telegram (payload.message)
    // ==========================================================
    if (payload.message) {
      const { text, reply_to_message } = payload.message;

      // Só processamos respostas (Replies) para saber para qual usuário enviar
      if (reply_to_message && reply_to_message.text) {
        // Tenta extrair o User ID da mensagem original (formato <code>USER_ID</code>)
        const idMatch = reply_to_message.text.match(/ID:\s+([a-f0-9-]{36})/i);
        
        if (idMatch) {
          const targetUserId = idMatch[1];
          console.log('Replying to User ID:', targetUserId);

          // Insere a resposta no Chat de Suporte do App
          const { error } = await supabase
            .from('dev_chat_messages')
            .insert({
              user_id: targetUserId,
              user_name: 'Suporte Dev',
              message: text || 'Arquivo/Mídia recebida do Telegram',
              is_from_dev: true,
              // Opcional: Adicionar link de arquivo se vier do telegram
            });

          if (error) throw error;
          
          return new Response(JSON.stringify({ success: true, direction: 'incoming' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, status: 'ignored' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
