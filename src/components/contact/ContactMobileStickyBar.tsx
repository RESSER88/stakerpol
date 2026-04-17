import { Phone, MessageCircle } from 'lucide-react';
import { trackCTAClick } from '@/utils/analytics';

const ContactMobileStickyBar = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] flex">
      <a
        href="tel:+48694133592"
        onClick={() => trackCTAClick('contact_mobile_sticky_call')}
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-stakerpol-orange text-white font-semibold text-sm min-h-[48px]"
      >
        <Phone size={18} />
        Zadzwoń
      </a>
      <a
        href="https://wa.me/48694133592"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackCTAClick('contact_mobile_sticky_whatsapp')}
        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold text-sm min-h-[48px]"
      >
        <MessageCircle size={18} />
        WhatsApp
      </a>
    </div>
  );
};

export default ContactMobileStickyBar;
