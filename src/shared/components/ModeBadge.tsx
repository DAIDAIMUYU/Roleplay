import { useAuth } from "../../features/auth";

const labels: Record<string, { text: string; className: string }> = {
  guest_demo: {
    text: "Demo",
    className: "bg-amber-light text-amber-700",
  },
  authenticated: {
    text: "已登录",
    className: "bg-emerald-light text-emerald-700",
  },
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  user: "User",
};

export function ModeBadge() {
  const { mode, role, isGuestOrDemo } = useAuth();
  const modeInfo = labels[mode] ?? labels.guest_demo;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${modeInfo.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {isGuestOrDemo ? modeInfo.text : roleLabels[role ?? ""] ?? modeInfo.text}
    </span>
  );
}
