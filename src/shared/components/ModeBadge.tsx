import { useAuth } from "../../features/auth";

const labels: Record<string, { text: string; className: string }> = {
  guest_demo: {
    text: "本地模式",
    className: "bg-amber-light text-amber-700",
  },
  authenticated: {
    text: "云端同步",
    className: "bg-emerald-light text-emerald-700",
  },
};

export function ModeBadge() {
  const { mode } = useAuth();
  const modeInfo = labels[mode] ?? labels.guest_demo;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${modeInfo.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {modeInfo.text}
    </span>
  );
}
