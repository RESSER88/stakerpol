import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");
const webhookUrl = Deno.env.get("LEAD_WEBHOOK_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LeadPayload {
  id?: string;
  product_id?: string;
  product_model: string;
  production_year?: string | null;
  serial_number?: string | null;
  phone?: string | null;
  language: string;
  message?: string | null;
  page_url?: string | null;
  user_agent?: string | null;
  created_at?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lead: LeadPayload = await req.json();

    // Send optional webhook
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "price_inquiry",
            timestamp: new Date().toISOString(),
            lead,
          }),
        });
      } catch (e) {
        console.warn("Webhook delivery failed:", e);
      }
    }

    // Send email via Resend if configured
    if (Deno.env.get("RESEND_API_KEY")) {
      const to = "info@stakerpol.pl";
      const subject = `Nowe zapytanie cenowe: ${lead.product_model}`;
      const html = `
        <h2>Nowe zapytanie cenowe</h2>
        <p><strong>Model:</strong> ${lead.product_model}</p>
        ${lead.production_year ? `<p><strong>Rok:</strong> ${lead.production_year}</p>` : ""}
        ${lead.serial_number ? `<p><strong>Nr seryjny:</strong> ${lead.serial_number}</p>` : ""}
        ${lead.phone ? `<p><strong>Telefon:</strong> ${lead.phone}</p>` : ""}
        <p><strong>Język:</strong> ${lead.language}</p>
        ${lead.message ? `<p><strong>Wiadomość:</strong><br/>${(lead.message || "").replace(/\n/g, "<br/>")}</p>` : ""}
        ${lead.page_url ? `<p><strong>Strona:</strong> <a href="${lead.page_url}">${lead.page_url}</a></p>` : ""}
        ${lead.user_agent ? `<p><strong>UA:</strong> ${lead.user_agent}</p>` : ""}
        ${lead.id ? `<p><strong>ID rekordu:</strong> ${lead.id}</p>` : ""}
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "Stakerpol <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
        });
        console.log("Email sent successfully:", JSON.stringify(emailResponse));
      } catch (e: any) {
        console.error("Email delivery failed:", e?.message || e, JSON.stringify(e));
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("notify-lead error:", error);
    return new Response(JSON.stringify({ error: error.message || "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
