import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");
const webhookUrl = Deno.env.get("LEAD_WEBHOOK_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadPayload {
  id?: string;
  product_id?: string;
  product_model: string;
  production_year?: string | null;
  serial_number?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  language: string;
  message?: string | null;
  page_url?: string | null;
  user_agent?: string | null;
  created_at?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  home_hero_form: 'Formularz na stronie głównej',
  faq_form: 'Formularz pod FAQ',
  faq_test_drive: 'FAQ — prośba o test wózka',
  faq_transport: 'FAQ — wycena transportu',
  faq_callback: 'FAQ — prośba o oddzwonienie',
  product_inquiry: 'Zapytanie o produkt',
  chat_widget: 'Floating chat',
  booking_modal: 'Umów wizytę',
};

const getSourceLabel = (source?: string | null): string => {
  if (!source) return '—';
  return SOURCE_LABELS[source] ?? source;
};

const formatPlDateTime = (iso?: string) => {
  try {
    const d = iso ? new Date(iso) : new Date();
    return new Intl.DateTimeFormat("pl-PL", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Warsaw",
    }).format(d);
  } catch {
    return new Date().toISOString();
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lead: LeadPayload = await req.json();

    // Optional webhook
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: lead.source === "visit_request" ? "visit_request" : "price_inquiry",
            timestamp: new Date().toISOString(),
            lead,
          }),
        });
      } catch (e) {
        console.warn("Webhook delivery failed:", e);
      }
    }

    if (Deno.env.get("RESEND_API_KEY")) {
      const to = "info@stakerpol.pl";
      const isVisit = lead.source === "visit_request";

      const phoneClean = (lead.phone || "").replace(/\s+/g, "");
      const phoneHref = phoneClean ? `tel:${phoneClean}` : "#";
      const sentAt = formatPlDateTime(lead.created_at);

      const subject = isVisit
        ? `Klient chce przyjechać — zadzwoń: ${lead.phone || "(brak numeru)"}`
        : lead.product_model === "Zapytanie ogólne"
        ? "Nowe zapytanie ze strony"
        : `Nowe zapytanie cenowe: ${lead.product_model}`;

      const productLine = [lead.product_model, lead.serial_number].filter(Boolean).join(" — nr ");

      const html = isVisit
        ? `
            <h2 style="margin:0 0 12px;font-family:Arial,sans-serif;color:#0E0E0E;">Klient chce przyjechać zobaczyć wózek</h2>
            <table style="font-family:Arial,sans-serif;font-size:14px;color:#0E0E0E;border-collapse:collapse;">
              <tr><td style="padding:4px 8px;"><strong>Imię:</strong></td><td style="padding:4px 8px;">${lead.name || "—"}</td></tr>
              <tr><td style="padding:4px 8px;"><strong>Telefon:</strong></td><td style="padding:4px 8px;"><a href="${phoneHref}" style="color:#C8102E;font-weight:bold;">${lead.phone || "—"}</a></td></tr>
              <tr><td style="padding:4px 8px;"><strong>Produkt:</strong></td><td style="padding:4px 8px;">${productLine || "—"}</td></tr>
              <tr><td style="padding:4px 8px;"><strong>Data zapytania:</strong></td><td style="padding:4px 8px;">${sentAt}</td></tr>
              ${lead.page_url ? `<tr><td style="padding:4px 8px;"><strong>Strona:</strong></td><td style="padding:4px 8px;"><a href="${lead.page_url}">${lead.page_url}</a></td></tr>` : ""}
              ${lead.id ? `<tr><td style="padding:4px 8px;"><strong>ID rekordu:</strong></td><td style="padding:4px 8px;">${lead.id}</td></tr>` : ""}
            </table>
            <p style="margin-top:16px;font-family:Arial,sans-serif;font-size:13px;color:#5B5B5B;">
              Zadzwoń jak najszybciej, klient czeka na ustalenie terminu wizyty.
            </p>
          `
        : `
            <h2>Nowe zapytanie cenowe</h2>
            <p><strong>Model:</strong> ${lead.product_model}</p>
            ${lead.production_year ? `<p><strong>Rok:</strong> ${lead.production_year}</p>` : ""}
            ${lead.serial_number ? `<p><strong>Nr seryjny:</strong> ${lead.serial_number}</p>` : ""}
            ${lead.name ? `<p><strong>Imię:</strong> ${lead.name}</p>` : ""}
            ${lead.phone ? `<p><strong>Telefon:</strong> <a href="${phoneHref}">${lead.phone}</a></p>` : ""}
            ${lead.email ? `<p><strong>E-mail:</strong> ${lead.email}</p>` : ""}
            <p><strong>Język:</strong> ${lead.language}</p>
            ${lead.source ? `<p><strong>Źródło:</strong> ${lead.source}</p>` : ""}
            ${lead.message ? `<p><strong>Wiadomość:</strong><br/>${(lead.message || "").replace(/\n/g, "<br/>")}</p>` : ""}
            ${lead.page_url ? `<p><strong>Strona:</strong> <a href="${lead.page_url}">${lead.page_url}</a></p>` : ""}
            ${lead.user_agent ? `<p><strong>UA:</strong> ${lead.user_agent}</p>` : ""}
            ${lead.id ? `<p><strong>ID rekordu:</strong> ${lead.id}</p>` : ""}
          `;

      let emailSent = false;
      let emailError: string | null = null;
      try {
        const emailResponse = await resend.emails.send({
          from: "Stakerpol <onboarding@resend.dev>",
          to: [to],
          reply_to: lead.email || undefined,
          subject,
          html,
        });
        if ((emailResponse as any)?.error) {
          emailError = JSON.stringify((emailResponse as any).error);
          console.error("Resend returned error:", emailError);
        } else {
          emailSent = true;
          console.log("Email sent successfully:", JSON.stringify(emailResponse));
        }
      } catch (e: any) {
        emailError = e?.message || String(e);
        console.error("Email delivery failed:", emailError, JSON.stringify(e));
      }

      // If email failed AND no webhook fallback succeeded, surface error to client
      if (!emailSent && !webhookUrl) {
        return new Response(
          JSON.stringify({ ok: false, error: emailError || "Email delivery failed" }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
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
