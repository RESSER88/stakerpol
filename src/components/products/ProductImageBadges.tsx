interface Props {
  productionYear?: string | number;
  availabilityStatus?: 'available' | 'reserved' | 'sold';
  isFeatured?: boolean;
}

const ProductImageBadges = ({ productionYear, availabilityStatus = 'available', isFeatured }: Props) => {
  const labelMap = {
    available: { text: 'Dostępny od ręki', cls: 'bg-white text-ink', dotCls: 'bg-green-available', pill: true },
    reserved: { text: 'Zarezerwowany', cls: 'bg-amber-soft text-amber-soft-foreground', dotCls: 'bg-amber-soft-foreground', pill: true },
    sold: { text: 'Sprzedany', cls: 'bg-muted text-muted-foreground', dotCls: 'bg-muted-foreground', pill: true },
  } as const;
  const status = labelMap[availabilityStatus] || labelMap.available;

  return (
    <>
      {productionYear && (
        <div className="absolute top-3 left-3 z-20 font-mono font-bold bg-ink text-white text-[10.5px] px-2.5 py-[5px] rounded-[3px] tracking-wider">
          ROK {productionYear}
        </div>
      )}
      <div className={`absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 font-bold text-[10.5px] px-2.5 py-[5px] rounded-full shadow-sm ${status.cls}`}>
        <span className={`inline-block rounded-full w-1.5 h-1.5 ${status.dotCls}`} />
        {status.text}
      </div>
      {isFeatured && (
        <div className="absolute top-12 right-3 z-20 inline-flex items-center gap-1 font-bold text-[10.5px] px-2.5 py-[5px] rounded-[3px] bg-red-accent text-white">
          ★ Polecany
        </div>
      )}
    </>
  );
};

export default ProductImageBadges;
