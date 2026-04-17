import { Phone, Mail, MessageCircle } from 'lucide-react';

const ContactTopInfoBar = () => {
  return (
    <div className="bg-stakerpol-navy text-white text-[13px]">
      <div className="container-custom flex items-center justify-between py-2 gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <a href="tel:+48694133592" className="flex items-center gap-1.5 hover:text-stakerpol-orange transition-colors">
            <Phone size={14} />
            <span className="hidden sm:inline">694 133 592</span>
          </a>
          <a href="mailto:info@stakerpol.pl" className="hidden sm:flex items-center gap-1.5 hover:text-stakerpol-orange transition-colors">
            <Mail size={14} />
            <span>info@stakerpol.pl</span>
          </a>
          <a href="https://wa.me/48694133592" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 hover:text-green-400 transition-colors">
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </a>
        </div>
        <div className="hidden md:block text-white/80">
          Odpowiadamy tego samego dnia · pon–pt 8:00–17:00
        </div>
      </div>
    </div>
  );
};

export default ContactTopInfoBar;
