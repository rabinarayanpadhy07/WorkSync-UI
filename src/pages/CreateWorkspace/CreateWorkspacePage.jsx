import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, HashIcon, Loader2, MessageSquareIcon, UsersIcon, VideoIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { useCreateWorkspace } from '@/hooks/apis/workspaces/useCreateWorkspace';
import { useAuth } from '@/hooks/context/useAuth';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const FEATURES = [
    { icon: HashIcon, label: 'Channels for every topic, team, or project' },
    { icon: MessageSquareIcon, label: 'Real-time messaging, threads, and mentions' },
    { icon: VideoIcon, label: 'Huddles with live transcripts and AI summaries' }
];

const WorkspacePreviewCard = ({ name, username }) => {
    const trimmed = name.trim();
    const initial = trimmed.charAt(0).toUpperCase();

    return (
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0e12] shadow-2xl shadow-black/40 overflow-hidden">
            {/* Fake workspace header */}
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5">
                <motion.div
                    key={initial || 'placeholder'}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold text-white"
                >
                    {initial || '?'}
                </motion.div>
                <p className="truncate text-sm font-semibold text-white">
                    {trimmed || 'Your workspace'}
                </p>
            </div>

            {/* Fake sidebar rows */}
            <div className="space-y-0.5 px-3 py-3">
                <div className="flex items-center gap-2 rounded-md bg-white/[0.06] px-2.5 py-1.5 text-sm text-slate-200">
                    <HashIcon className="size-3.5 text-slate-500" />
                    general
                </div>
                <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-slate-500">
                    <HashIcon className="size-3.5 text-slate-600" />
                    random
                </div>
            </div>

            {/* Fake member row */}
            <div className="flex items-center gap-2 border-t border-white/5 px-4 py-3">
                <div className="flex size-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-slate-300">
                    {username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <p className="text-xs text-slate-500">You&apos;ll be the first member — invite your team next.</p>
            </div>
        </div>
    );
};

export const CreateWorkspacePage = () => {
    const [workspaceName, setWorkspaceName] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isPending, createWorkspaceMutation } = useCreateWorkspace();
    const { auth } = useAuth();
    const currentPlan = auth?.user?.plan === 'Paid' ? 'Paid' : 'Normal';
    const isNameValid = workspaceName.trim().length >= 3;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!isNameValid) return;
        try {
            const data = await createWorkspaceMutation({ name: workspaceName.trim() });
            queryClient.invalidateQueries({ queryKey: ['fetchWorkspaces'] });
            navigate(`/workspaces/${data._id}`);
        } catch (err) {
            console.error('Failed to create workspace', err);
            toast.error('Unable to create workspace', {
                description: getApiErrorMessage(err, 'Please try again.')
            });
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-[#050506] text-slate-200 lg:flex-row">
            {/* Left / top panel: brand, live preview, value props */}
            <div className="relative flex w-full shrink-0 flex-col justify-between overflow-hidden border-b border-white/5 px-6 py-8 sm:px-10 lg:w-[46%] lg:border-b-0 lg:border-r lg:px-14 lg:py-12 xl:w-[42%]">
                <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-600/20 blur-[110px]" />
                <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-72 w-72 rounded-full bg-blue-600/15 blur-[110px]" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-lg font-bold text-white shadow-lg shadow-purple-500/20">
                        W
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">WorkSync</span>
                </div>

                <div className="relative z-10 mx-auto my-10 flex w-full flex-col items-center lg:my-0">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Live preview
                    </p>
                    <WorkspacePreviewCard name={workspaceName} username={auth?.user?.username} />
                </div>

                <ul className="relative z-10 hidden flex-col gap-4 lg:flex">
                    {FEATURES.map(({ icon: Icon, label }) => (
                        <li key={label} className="flex items-center gap-3 text-sm text-slate-400">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-purple-400">
                                <Icon className="size-4" />
                            </div>
                            {label}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right / bottom panel: the actual form */}
            <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-8">
                        {currentPlan === 'Paid' ? (
                            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                                ✨ Paid plan — unlimited workspaces
                            </span>
                        ) : (
                            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                                <UsersIcon className="size-3.5 text-slate-500" />
                                Normal plan — 1 workspace included
                            </span>
                        )}
                        <h1 className="text-3xl font-bold text-white">
                            Create your workspace
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Give your team a home. You can always change the name later.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <div className="ml-1 flex items-center justify-between">
                                <label htmlFor="workspace-name" className="text-sm font-medium text-slate-300">
                                    Workspace Name
                                </label>
                                <span className="text-xs text-slate-500">
                                    {workspaceName.length}/50
                                </span>
                            </div>
                            <input
                                id="workspace-name"
                                required
                                autoFocus
                                minLength={3}
                                maxLength={50}
                                placeholder="e.g. Acme Corp, Engineering Team"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                disabled={isPending}
                                className="w-full rounded-xl border border-white/10 bg-[#13151a] px-4 py-3.5 text-base text-white placeholder-slate-500 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                            />
                            {workspaceName.length > 0 && !isNameValid && (
                                <p className="ml-1 text-xs text-amber-400">
                                    Use at least 3 characters.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={isPending || !isNameValid}
                                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3.5 font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 size-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create workspace
                                        <ArrowRight className="ml-2 size-5" />
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/home')}
                                disabled={isPending}
                                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};
