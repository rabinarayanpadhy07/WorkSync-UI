/**
 * Shared empty-state visual for list/feed-style views (threads, drafts,
 * conversations). Matches the app's dark-glass card language rather than
 * plain centered text, so every "nothing here yet" moment looks consistent.
 */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {Icon && (
            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-purple-400">
                <Icon className="size-6" />
            </div>
        )}
        <p className="text-base font-semibold text-slate-200">{title}</p>
        {description && (
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
    </div>
);
