import { useQueryClient } from '@tanstack/react-query';
import { Building2Icon, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateWorkspace } from '@/hooks/apis/workspaces/useCreateWorkspace';
import { useCreateWorkspaceModal } from '@/hooks/context/useCreateWorkspaceModal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export const CreateWorkspaceModal = () => {

    const queryClient = useQueryClient();

    const { openCreateWorkspaceModal, setOpenCreateWorkspaceModal } = useCreateWorkspaceModal();

    const { isPending, createWorkspaceMutation } = useCreateWorkspace();

    const [workspaceName, setWorkspaceName] = useState('');

    const navigate = useNavigate();

    function handleClose() {
        if (isPending) return;
        setOpenCreateWorkspaceModal(false);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        if (workspaceName.trim().length < 3) return;

        try {
            const data = await createWorkspaceMutation({ name: workspaceName.trim() });
            navigate(`/workspaces/${data._id}`);
            queryClient.invalidateQueries({ queryKey: ['fetchWorkspaces'] });
            setWorkspaceName('');
            setOpenCreateWorkspaceModal(false);
        } catch (error) {
            toast.error('Unable to create workspace', {
                description: getApiErrorMessage(error, 'Please try again.')
            });
        }
    }

    return (
        <Dialog
            open={openCreateWorkspaceModal}
            onOpenChange={handleClose}
        >
            <DialogContent className="bg-[#13151a] border-white/10 text-slate-200 sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    {workspaceName.trim() ? (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(147,51,234,0.25)] transition-all">
                            <span className="text-xl font-bold text-white">
                                {workspaceName.trim().charAt(0).toUpperCase()}
                            </span>
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-3 border border-white/10 transition-all">
                            <Building2Icon className="size-6 text-purple-400" />
                        </div>
                    )}
                    <DialogTitle className="text-white text-xl">Create a new workspace</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Give your team a home. You can always change the name later.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            autoFocus
                            required
                            minLength={3}
                            maxLength={50}
                            disabled={isPending}
                            placeholder="e.g. Acme Corp, Engineering Team"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-50"
                        />
                        {workspaceName.length > 0 && workspaceName.trim().length < 3 && (
                            <p className="ml-1 text-xs text-amber-400">Use at least 3 characters.</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isPending || workspaceName.trim().length < 3}
                        className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                Create workspace
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
