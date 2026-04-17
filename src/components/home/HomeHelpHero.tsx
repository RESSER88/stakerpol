import { Phone, MessageCircle, Send, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackCTAClick } from '@/utils/analytics';

const HomeHelpHero = () => {
  const badges = [
    'Odpowiadamy tego samego dnia',
    'Doradztwo bezpłatne',
    'Gwarancja i serwis pogwarancyjny',
  ];

  return (
    <section className="bg-white border-t border-gray-200">
      <div className="container-custom py-10 px-4 md:px-8">
        <h2 className="text-2xl md:text-4xl font-bold leading-tight text-stakerpol-navy text-center">
          Pomożemy dobrać wózek do Twojego magazynu
        </h2>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
          {badges.map((b) => (
            <div key={b} className="flex items-center gap-1.5 text-sm text-gray-700">
              <Check size={16} className="text-green-600 flex-shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-center items-stretch gap-2 mt-6">
          <a
            href="tel:+48694133592"
            onClick={() => trackCTAClick('home_help_hero_call')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-stakerpol-orange hover:bg-stakerpol-orange/90 text-white font-semibold text-sm min-h-[44px] transition-colors shadow-sm"
          >
            <Phone size={16} />
            Zadzwoń: 694 133 592
          </a>
          <a
            href="https://wa.me/48694133592"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCTAClick('home_help_hero_whatsapp')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm min-h-[44px] transition-colors shadow-sm"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
          <Link
            to="/contact#form"
            onClick={() => trackCTAClick('home_help_hero_form')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-stakerpol-navy text-stakerpol-navy hover:bg-stakerpol-navy hover:text-white font-semibold text-sm min-h-[44px] transition-colors"
          >
            <Send size={16} />
            Wyślij zapytanie
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeHelpHero;
