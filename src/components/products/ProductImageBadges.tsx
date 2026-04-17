interface Props {
  productionYear?: string;
  availabilityStatus?: 'available' | 'reserved' | 'sold';
}

const ProductImageBadges = ({ productionYear, availabilityStatus = 'available' }: Props) => {
  const labelMap: Record<string, { text: string; color: string; dot: string; bg: string }> = {
    available: { text: 'Dostępny od ręki', color: '#0E0E0E', dot: '#14A84A', bg: '#FFFFFF' },
    reserved: { text: 'Zarezerwowany', color: '#8A5A00', dot: '#E0A700', bg: '#FFF7E0' },
    sold: { text: 'Sprzedany', color: '#5B5B5B', dot: '#9CA3AF', bg: '#F3F4F6' },
  };
  const status = labelMap[availabilityStatus] || labelMap.available;

  return (
    <>
      {productionYear && (
        <div
          className="absolute top-3 left-3 z-20 font-mono font-bold"
          style={{
            background: '#0E0E0E',
            color: '#fff',
            fontSize: 10.5,
            padding: '5px 10px',
            borderRadius: 3,
          }}
        >
          ROK {productionYear}
        </div>
      )}
      <div
        className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 font-bold"
        style={{
          background: status.bg,
          color: status.color,
          fontSize: 10.5,
          padding: '5px 10px',
          borderRadius: 99,
        }}
      >
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: status.dot }}
        />
        {status.text}
      </div>
    </>
  );
};

export default ProductImageBadges;
