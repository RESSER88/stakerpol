import { Phone, MessageCircle, Send, Check } from 'lucide-react';
import { trackCTAClick } from '@/utils/analytics';

const ContactCompactHero = () => {
  const badges = ['Odpowiadamy tego samego dnia', 'Doradztwo bezpłatne', 'Gwarancja i serwis pogwarancyjny'];
  return (
    <section className="bg-stakerpol-navy text-white">
      <div className="container-custom py-8 md:py-10">
        <h1 className="text-[22px] md:text-[32px] font-bold leading-tight">
          Pomożemy dobrać wózek do Twojego magazynu
        </h1>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
          {badges.map(b => (
            <div key={b} className="flex items-center gap-1.5 text-sm text-white/85">
              <Check size={16} className="text-green-400 flex-shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
          <a
            href="tel:+48694133592"
            onClick={() => trackCTAClick('contact_hero_call')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-stakerpol-orange hover:bg-stakerpol-orange/90 text-white font-semibold text-sm min-h-[44px] transition-colors"
          >
            <Phone size={16} />
            Zadzwoń: 694 133 592
          </a>
          <a
            href="https://wa.me/48694133592"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCTAClick('contact_hero_whatsapp')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm min-h-[44px] transition-colors"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
          <a
            href="#form"
            onClick={() => trackCTAClick('contact_hero_form')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-white/40 hover:border-white hover:bg-white/10 text-white font-semibold text-sm min-h-[44px] transition-colors"
          >
            <Send size={16} />
            Wyślij zapytanie
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContactCompactHero;
