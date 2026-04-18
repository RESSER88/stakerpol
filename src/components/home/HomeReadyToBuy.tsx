import { Phone, MessageCircle } from 'lucide-react';
import { trackPhoneClick, trackWhatsAppClick } from '@/utils/analytics';
import { COMPANY_PHONE_TEL, buildWhatsAppUrl } from '@/lib/contact';

const HomeReadyToBuy = () => {
  return (
    <section
      className="text-white py-12 md:py-16 px-6 md:px-8"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--color-navy-brand)) 0%, hsl(222 64% 22%) 100%)',
      }}
    >
      <div className="max-w-[800px] mx-auto text-center">
        <h2 className="text-[22px] md:text-[28px] font-extrabold tracking-tight">
          Gotowy na zakup?
        </h2>
        <p className="text-sm md:text-base text-white/85 mt-3">
          Skontaktuj się — pomożemy dobrać wózek do Twojego magazynu.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center mt-6">
          <a
            href={`tel:${COMPANY_PHONE_TEL}`}
            onClick={() => trackPhoneClick('home_ready_to_buy')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-orange-cta hover:opacity-90 text-white font-bold transition-opacity min-h-[48px]"
          >
            <Phone size={18} />
            Zadzwoń
          </a>
          <a
            href={buildWhatsAppUrl('Dzień dobry, jestem zainteresowany Państwa ofertą.')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick('home_ready_to_buy')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-whatsapp hover:opacity-90 text-white font-bold transition-opacity min-h-[48px]"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default HomeReadyToBuy;
