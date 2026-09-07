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

interface OrderPayload {
  kind: "offer_order";
  product: {
    model?: string;
    productionYear?: string;
    serialNumber?: string;
    workingHours?: string;
    minHeight?: string;
    liftHeight?: string;
    battery?: string;
    price?: string;
    productUrl?: string;
  };
  invoice: { company?: string; nip?: string; address?: string };
  shipping: { sameAsInvoice?: boolean; address?: string };
  contact: { name?: string; phone?: string; email?: string };
  options?: { wheels?: boolean; battery?: boolean; udt?: boolean };
  notes?: string;
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const clamp = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

const yesNo = (v?: boolean) => (v ? "TAK" : "NIE");

const handleOrder = async (order: OrderPayload): Promise<Response> => {
  const p = order.product || ({} as OrderPayload["product"]);
  const model = clamp(p.model, 120) || "—";
  const serial = clamp(p.serialNumber, 60);
  const contactEmail = clamp(order.contact?.email, 255);
  const contactPhone = clamp(order.contact?.phone, 30);
  const contactName = clamp(order.contact?.name, 120);
  const invoiceCompany = clamp(order.invoice?.company, 200);
  const invoiceAddress = clamp(order.invoice?.address, 400);

  if (!contactName || !contactPhone || !contactEmail || !invoiceCompany || !invoiceAddress) {
    return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  if (!Deno.env.get("RESEND_API_KEY")) {
    return new Response(JSON.stringify({ ok: false, error: "email_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const shippingLine = order.shipping?.sameAsInvoice
    ? "Taki sam jak adres do faktury"
    : clamp(order.shipping?.address, 400) || "—";

  const subject = `Zamówienie – ${model}${serial ? ` – nr seryjny ${serial}` : ""}`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:3px 10px 3px 0;color:#5B5B5B;">${esc(label)}</td><td style="padding:3px 0;font-weight:bold;">${esc(value)}</td></tr>`;

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#0E0E0E;">
      <p>Dzień dobry,</p>
      <p>klient chce zamówić poniższy wózek:</p>
      <h3 style="margin:16px 0 6px;">MODEL</h3>
      <table style="border-collapse:collapse;">
        ${row("Model:", model)}
        ${row("Rok produkcji:", clamp(p.productionYear, 20) || "—")}
        ${row("Nr seryjny:", serial || "—")}
        ${row("Motogodziny:", clamp(p.workingHours, 30) || "—")}
        ${row("Wys. konstrukcyjna:", clamp(p.minHeight, 30) || "—")}
        ${row("Podnoszenie:", clamp(p.liftHeight, 30) || "—")}
        ${row("Bateria:", clamp(p.battery, 30) || "—")}
        ${row("Cena:", clamp(p.price, 60) || "—")}
      </table>
      ${p.productUrl ? `<p>Karta produktu:<br/><a href="${esc(clamp(p.productUrl, 500))}">${esc(clamp(p.productUrl, 500))}</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #E8EAED;margin:18px 0;" />
      <h3 style="margin:0 0 6px;">DANE DO FAKTURY</h3>
      <p style="margin:0 0 4px;">Nazwa firmy / imię i nazwisko:<br/><strong>${esc(invoiceCompany)}</strong></p>
      <p style="margin:0 0 4px;">NIP:<br/><strong>${esc(clamp(order.invoice?.nip, 30) || "—")}</strong></p>
      <p style="margin:0;">Adres:<br/><strong>${esc(invoiceAddress).replace(/\n/g, "<br/>")}</strong></p>
      <hr style="border:none;border-top:1px solid #E8EAED;margin:18px 0;" />
      <h3 style="margin:0 0 6px;">ADRES WYSYŁKI</h3>
      <p style="margin:0;"><strong>${esc(shippingLine).replace(/\n/g, "<br/>")}</strong></p>
      <hr style="border:none;border-top:1px solid #E8EAED;margin:18px 0;" />
      <h3 style="margin:0 0 6px;">OSOBA KONTAKTOWA</h3>
      <table style="border-collapse:collapse;">
        ${row("Imię i nazwisko:", contactName)}
        <tr><td style="padding:3px 10px 3px 0;color:#5B5B5B;">Telefon:</td><td style="padding:3px 0;"><a href="tel:${esc(contactPhone.replace(/\s+/g, ""))}" style="font-weight:bold;color:#C8102E;">${esc(contactPhone)}</a></td></tr>
        <tr><td style="padding:3px 10px 3px 0;color:#5B5B5B;">E-mail:</td><td style="padding:3px 0;"><a href="mailto:${esc(contactEmail)}" style="font-weight:bold;">${esc(contactEmail)}</a></td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #E8EAED;margin:18px 0;" />
      <h3 style="margin:0 0 6px;">DODATKOWE OPCJE — DO WYCENY</h3>
      <table style="border-collapse:collapse;">
        ${row("Nowe koła:", yesNo(order.options?.wheels))}
        ${row("Nowa bateria:", yesNo(order.options?.battery))}
        ${row("Przygotowanie i wykonanie badań przez Urząd Dozoru Technicznego UDT:", yesNo(order.options?.udt))}
      </table>
      <hr style="border:none;border-top:1px solid #E8EAED;margin:18px 0;" />
      <h3 style="margin:0 0 6px;">UWAGI</h3>
      <p style="margin:0;">${esc(clamp(order.notes, 2000) || "—").replace(/\n/g, "<br/>")}</p>
      <p style="margin-top:18px;color:#5B5B5B;font-size:13px;">Źródło zamówienia: Oferta Stakerpol</p>
    </div>
  `;

  try {
    const emailResponse = await resend.emails.send({
      from: "Stakerpol <onboarding@resend.dev>",
      to: ["info@stakerpol.pl"],
      reply_to: contactEmail,
      subject,
      html,
    });
    if ((emailResponse as any)?.error) {
      console.error("Resend order error:", JSON.stringify((emailResponse as any).error));
      return new Response(JSON.stringify({ ok: false, error: "email_failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  } catch (e: any) {
    console.error("Order email failed:", e?.message || String(e));
    return new Response(JSON.stringify({ ok: false, error: "email_failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    if (payload?.kind === "offer_order") {
      return await handleOrder(payload as OrderPayload);
    }
    const lead: LeadPayload = payload;

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
            ${lead.source ? `<p><strong>Źródło:</strong> ${getSourceLabel(lead.source)}</p>` : ""}
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
