import { Check, Phone, MessageCircle, Send } from 'lucide-react';
import { trackCTAClick } from '@/utils/analytics';

const ContactHero = () => {
  return (
    <section className="bg-gradient-to-br from-stakerpol-navy via-stakerpol-navy to-stakerpol-navy/90 text-white py-16">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Pomożemy dobrać wózek do Twojego magazynu
          </h1>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8 text-sm md:text-base">
            {['Odpowiadamy tego samego dnia', 'Doradztwo bezpłatne', 'Gwarancja i serwis pogwarancyjny'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <Check className="text-stakerpol-orange" size={20} />
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
            <a
              href="tel:+48694133592"
              onClick={() => trackCTAClick('contact_hero_call')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-stakerpol-orange hover:bg-stakerpol-orange/90 text-white font-semibold transition-colors min-h-[48px]"
            >
              <Phone size={18} />
              Zadzwoń: 694 133 592
            </a>
            <a
              href="https://wa.me/48694133592"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('contact_hero_whatsapp')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors min-h-[48px]"
            >
              <MessageCircle size={18} />
              Napisz na WhatsApp
            </a>
            <a
              href="#form"
              onClick={() => trackCTAClick('contact_hero_form')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-white/40 hover:border-white text-white font-semibold transition-colors min-h-[48px]"
            >
              <Send size={18} />
              Wyślij zapytanie
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactHero;
