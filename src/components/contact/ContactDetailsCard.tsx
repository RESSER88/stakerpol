import { Phone, Mail, MessageCircle, Clock, MapPin } from 'lucide-react';

const ContactDetailsCard = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
        Dane kontaktowe
      </div>

      <div className="space-y-4">
        {/* Phone */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-stakerpol-orange/10 flex items-center justify-center flex-shrink-0">
            <Phone className="text-stakerpol-orange" size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Telefon</div>
            <a href="tel:+48694133592" className="text-stakerpol-orange font-bold text-lg hover:underline">694 133 592</a>
            <div className="text-xs text-gray-500 mt-0.5">pon–pt 8:00–17:00</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-stakerpol-orange/10 flex items-center justify-center flex-shrink-0">
            <Mail className="text-stakerpol-orange" size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">E-mail</div>
            <a href="mailto:info@stakerpol.pl" className="text-stakerpol-orange font-semibold hover:underline break-all">info@stakerpol.pl</a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="text-green-600" size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">WhatsApp</div>
            <a href="https://wa.me/48694133592" target="_blank" rel="noopener noreferrer" className="text-green-600 font-semibold hover:underline">694 133 592</a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-stakerpol-orange/10 flex items-center justify-center flex-shrink-0">
            <Clock className="text-stakerpol-orange" size={18} />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Godziny pracy</div>
            <div className="font-semibold text-gray-800">Pon–Pt, 8:00–17:00</div>
          </div>
        </div>
      </div>

      {/* Company billing data + warehouse */}
      <div className="mt-5 pt-4 border-t border-gray-200 text-xs text-gray-500 leading-relaxed grid grid-cols-2 gap-4">
        <div className="flex items-start gap-1.5">
          <MapPin size={12} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-gray-600">FHU Stakerpol</div>
            <div>Michał Seweryn</div>
            <div>ul. Szewska 6</div>
            <div>32-043 Skała</div>
            <div>NIP: PL6492111954</div>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <MapPin size={12} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-gray-600">Magazyn</div>
            <div>ul. Międzyleśna 115</div>
            <div>32-095 Celiny</div>
            <div>Polska</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsCard;
