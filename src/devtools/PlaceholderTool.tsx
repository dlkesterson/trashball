type Props = {
  name: string;
  hint?: string;
};

export default function PlaceholderTool({ name, hint }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center space-y-3">
        <div className="text-xs text-slate-500 uppercase tracking-wide">Dev Tool</div>
        <div className="text-3xl font-bold text-cyan-300">{name}</div>
        <div className="text-sm text-slate-400 max-w-md mx-auto px-6">
          Scaffold ready. Wire the detailed UI and logic when you are ready to iterate on {name}.
        </div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
    </div>
  );
}
