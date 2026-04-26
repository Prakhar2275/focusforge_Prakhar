export default function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const px = size === 'sm' ? 24 : size === 'lg' ? 64 : 40;
  const bw = size === 'sm' ? 2 : 3;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div style={{ width: px, height: px }} className="relative">
        <div
          style={{ width: px, height: px, borderWidth: bw, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#f5c518' }}
          className="rounded-full animate-spin"
        />
      </div>
      {text && <p className="text-white/50 text-sm">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-[#070710] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 relative mx-auto mb-6">
          <div
            className="w-16 h-16 rounded-full animate-spin"
            style={{ borderWidth: 3, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)', borderTopColor: '#f5c518' }}
          />
        </div>
        <p className="text-xl font-bold text-gradient">FocusForge</p>
        <p className="text-white/40 text-sm mt-1">Loading your workspace...</p>
      </div>
    </div>
  );
}
