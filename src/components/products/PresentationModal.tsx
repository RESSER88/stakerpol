import { useEffect } from 'react';
import { X, Phone, MessageCircle } from 'lucide-react';
import { COMPANY_PHONE_TEL, COMPANY_PHONE_DISPLAY, buildWhatsAppUrl } from '@/lib/contact';

interface Props {
  open: boolean;
  onClose: () => void;
  modelName?: string;
}

const PresentationModal = ({ open, onClose, modelName }: Props) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const waText = modelName
    ? `Chciałbym umówić prezentację: ${modelName}`
    : 'Chciałbym umówić prezentację wózka.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[400px] bg-white rounded-lg p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute top-3 right-3 text-ink-soft hover:text-ink transition-colors"
        >
          <X size={20} />
        </button>
        <h3 className="text-[18px] font-extrabold text-navy-brand mb-2 pr-6">
          Umów prezentację{modelName ? ` — ${modelName}` : ''}
        </h3>
        <p className="text-[13px] text-ink-soft mb-4">
          Wybierz wygodny sposób kontaktu — odpowiemy w ciągu 30 minut.
        </p>
        <div className="grid grid-cols-1 gap-2">
          <a
            href={`tel:${COMPANY_PHONE_TEL}`}
            className="flex items-center justify-center gap-2 bg-orange-cta text-white font-bold py-3.5 px-4 rounded-md hover:bg-orange-cta/90 transition-colors"
          >
            <Phone size={16} /> Zadzwoń — {COMPANY_PHONE_DISPLAY}
          </a>
          <a
            href={buildWhatsAppUrl(waText)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-whatsapp text-white font-bold py-3.5 px-4 rounded-md hover:bg-whatsapp/90 transition-colors"
          >
            <MessageCircle size={16} /> Napisz na WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default PresentationModal;
