import { useState, FormEvent } from 'react';
import { Loader2, Check } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY_PHONE_DISPLAY } from '@/lib/contact';

interface HomeHeroFormProps {
  variant?: 'light' | 'dark';
  isInHero?: boolean;
}

const phoneRegex = /^(\+48\s?)?[5-9]\d{2}[\s-]?\d{3}[\s-]?\d{3}$/;

const schema = z.object({
  name: z.string().trim().min(2, { message: 'Podaj imię i nazwisko' }).max(120),
  email: z.string().trim().email({ message: 'Podaj poprawny e-mail' }).max(255),
  phone: z
    .string()
    .trim()
    .max(32)
    .regex(phoneRegex, { message: 'Podaj poprawny numer telefonu' }),
  message: z.string().trim().max(2000).optional(),
  rodo: z.literal(true, {
    errorMap: () => ({ message: 'Musisz zaakceptować politykę prywatności' }),
  }),
});

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'message' | 'rodo' | '_form', string>>;

const HomeHeroForm = ({ isInHero = false, variant = 'light' }: HomeHeroFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [rodo, setRodo] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isDark = variant === 'dark';

  const inputBase = isDark
    ? 'w-full bg-white/10 border border-white/25 rounded text-[13px] text-white placeholder:text-white/60 px-3 py-2.5 focus:outline-none focus:border-orange-cta focus:ring-2 focus:ring-orange-cta/30 focus:bg-white/15 transition-colors disabled:opacity-60'
    : 'w-full bg-white border border-border-line rounded text-[13px] text-ink placeholder:text-ink-soft px-3 py-2.5 focus:outline-none focus:border-orange-cta focus:ring-2 focus:ring-orange-cta/20 transition-colors disabled:opacity-60';

  const errClass = (field: keyof FieldErrors) =>
    errors[field] ? 'border-red-accent focus:border-red-accent focus:ring-red-accent/20' : '';

  const reset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setRodo(false);
    setErrors({});
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ name, email, phone, message, rodo });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((iss) => {
        const key = iss.path[0] as keyof FieldErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = iss.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const { error } = await supabase.from('leads').insert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        message: result.data.message || null,
        rodo_accepted: true,
        source: 'home_hero_form',
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(reset, 10000);
    } catch (err) {
      setErrors({
        _form: `Coś poszło nie tak. Spróbuj zadzwonić: ${COMPANY_PHONE_DISPLAY}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-6 px-2">
        <div className="w-12 h-12 rounded-full bg-green-available/10 flex items-center justify-center mb-3">
          <Check className="w-7 h-7 text-green-available" />
        </div>
        <h3 className="text-[16px] font-extrabold text-navy-brand">Dziękujemy!</h3>
        <p className="text-[13px] text-ink-soft mt-1.5 leading-relaxed">
          Otrzymaliśmy Twoje zapytanie. Odpowiemy w ciągu 30 minut.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className={isDark ? 'text-base font-extrabold text-white' : 'text-base font-extrabold text-navy-brand'}>Zapytaj o wózek</h3>
      <p className={isDark ? 'text-xs text-white/75 mt-1 mb-3.5' : 'text-xs text-ink-soft mt-1 mb-3.5'}>
        Opisz potrzebę — odpowiemy w ciągu 30 minut. <strong className={isDark ? 'text-white' : 'text-ink'}>Bez zobowiązań.</strong>
      </p>

      <div className="space-y-2.5">
        <div>
          <input
            type="text"
            placeholder="Imię i nazwisko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            maxLength={120}
            className={`${inputBase} ${errClass('name')}`}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-red-accent mt-1" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <input
            type="email"
            placeholder="jan@firma.pl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            maxLength={255}
            className={`${inputBase} ${errClass('email')}`}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-red-accent mt-1" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <input
            type="tel"
            placeholder="600 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            maxLength={32}
            className={`${inputBase} ${errClass('phone')}`}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-red-accent mt-1" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <textarea
            placeholder="Jakiego wózka szukasz? Co chcesz podnosić, jak często, gdzie?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            rows={isInHero ? 3 : 4}
            maxLength={2000}
            className={`${inputBase} resize-none`}
          />
        </div>

        <label className="flex items-start gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={rodo}
            onChange={(e) => setRodo(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 w-3.5 h-3.5 accent-orange-cta cursor-pointer flex-shrink-0"
          />
          <span className={isDark ? 'text-xs text-white/75 leading-[1.4]' : 'text-xs text-ink-soft leading-[1.4]'}>
            Akceptuję{' '}
            <a
              href="/privacy"
              className={isDark ? 'underline hover:text-orange-cta text-white transition-colors' : 'underline hover:text-orange-cta transition-colors'}
            >
              politykę prywatności
            </a>
          </span>
        </label>
        {errors.rodo && (
          <p className="text-xs text-red-accent" role="alert">
            {errors.rodo}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-3.5 bg-orange-cta hover:opacity-90 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-md transition-opacity inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Wysyłanie...
          </>
        ) : (
          'Wyślij zapytanie →'
        )}
      </button>

      {errors._form && (
        <p
          className="text-xs text-red-accent mt-2.5 text-center"
          role="alert"
          dangerouslySetInnerHTML={{
            __html: errors._form.replace(
              COMPANY_PHONE_DISPLAY,
              `<strong>${COMPANY_PHONE_DISPLAY}</strong>`,
            ),
          }}
        />
      )}
    </form>
  );
};

export default HomeHeroForm;
