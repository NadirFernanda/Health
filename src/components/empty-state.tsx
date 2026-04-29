import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} strokeWidth={1.5} className="text-[#0B3C74]" />
      </div>
      <p className="font-semibold text-gray-800 text-sm">{title}</p>
      <p className="text-gray-400 text-xs mt-1.5 leading-5 max-w-[240px]">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <a
            href={actionHref}
            className="mt-5 inline-flex items-center gap-1.5 bg-[#0B3C74] text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            {actionLabel}
          </a>
        ) : (
          <button
            onClick={onAction}
            className="mt-5 inline-flex items-center gap-1.5 bg-[#0B3C74] text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
