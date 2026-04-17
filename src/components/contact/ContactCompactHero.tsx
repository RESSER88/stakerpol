import { Phone, MessageCircle } from 'lucide-react';
import { trackCTAClick } from '@/utils/analytics';

const ContactCompactHero = () => {
  return (
    <section className="bg-gray-50 border-b border-gray-200">
      <div className="container-custom py-8 md:py-10">
        <h1 className="text-[22px] md:text-[28px] font-bold text-stakerpol-navy leading-tight">
          Pomożemy dobrać wózek do Twojego magazynu
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Odpowiadamy tego samego dnia · Doradztwo bezpłatne · Gwarancja i serwis pogwarancyjny
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          <a
            href="tel:+48694133592"
            onClick={() => trackCTAClick('contact_hero_call')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-stakerpol-orange hover:bg-stakerpol-orange/90 text-white font-semibold text-sm min-h-[44px]"
          >
            <Phone size={16} />
            Zadzwoń: 694 133 592
          </a>
          <a
            href="https://wa.me/48694133592"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCTAClick('contact_hero_whatsapp')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm min-h-[44px]"
          >
            <MessageCircle size={16} />
            Napisz na WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContactCompactHero;
