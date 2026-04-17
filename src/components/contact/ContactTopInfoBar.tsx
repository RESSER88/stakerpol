import { Phone, Mail, MessageCircle } from 'lucide-react';

const ContactTopInfoBar = () => {
  return (
    <div className="bg-stakerpol-navy text-white text-xs border-b border-white/10">
      <div className="container-custom flex items-center gap-5 px-4 md:px-8 py-2">
        <a href="tel:+48694133592" className="flex items-center gap-1.5 hover:text-stakerpol-orange transition-colors">
          <Phone size={13} />
          <span>694 133 592</span>
        </a>
        <a href="mailto:info@stakerpol.pl" className="hidden sm:flex items-center gap-1.5 hover:text-stakerpol-orange transition-colors">
          <Mail size={13} />
          <span>info@stakerpol.pl</span>
        </a>
        <a href="https://wa.me/48694133592" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 hover:text-green-400 transition-colors">
          <MessageCircle size={13} />
          <span>WhatsApp</span>
        </a>
        <div className="hidden md:block ml-auto text-white/75">
          Odpowiadamy tego samego dnia · pon–pt 8:00–17:00
        </div>
      </div>
    </div>
  );
};

export default ContactTopInfoBar;
