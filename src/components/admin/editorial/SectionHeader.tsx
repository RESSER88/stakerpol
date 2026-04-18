interface Props {
  number: string;
  title: string;
  action?: React.ReactNode;
}

const SectionHeader = ({ number, title, action }: Props) => (
  <div className="flex items-end justify-between gap-4 border-b border-editorial-line pb-3 mb-4">
    <div className="flex items-baseline gap-3">
      <span className="text-xs font-bold tracking-[0.2em] text-editorial-accent">
        {number}
      </span>
      <h2 className="font-editorial text-lg text-editorial-ink tracking-tight">
        {title}
      </h2>
    </div>
    {action}
  </div>
);

export default SectionHeader;
