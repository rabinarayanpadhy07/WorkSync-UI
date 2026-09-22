import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    deleteAdminMessageRequest,
    deleteAdminWorkspaceRequest,
    updateAdminUserRequest,
    updateAdminWorkspaceRequest
} from '@/apis/admin';
import { useAuth } from '@/hooks/context/useAuth';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export const useAdminDashboardMutations = () => {
    const { auth, setAuth } = useAuth();
    const queryClient = useQueryClient();

    const refreshAdminData = async (...keys) =>
        Promise.all(
            keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
        );

    const updateUserMutation = useMutation({
        mutationFn: updateAdminUserRequest,
        onSuccess: async (updatedUser) => {
            await refreshAdminData('admin-overview', 'admin-users', 'admin-audit-logs');

            if (updatedUser?._id === auth?.user?._id) {
                const nextUser = {
                    ...auth.user,
                    plan: updatedUser.plan ?? auth.user.plan,
                    isSuperAdmin: updatedUser.isSuperAdmin ?? auth.user.isSuperAdmin,
                    isActive: updatedUser.isActive ?? auth.user.isActive
                };

                setAuth((previous) => ({ ...previous, user: nextUser }));
            }

            toast.success('User updated successfully');
        },
        onError: (error) => {
            toast.error('Unable to update user', {
                description: getApiErrorMessage(error, 'Please try again.')
            });
        }
    });

    const updateWorkspaceMutation = useMutation({
        mutationFn: updateAdminWorkspaceRequest,
        onSuccess: async (workspace) => {
            await refreshAdminData('admin-overview', 'admin-workspaces', 'admin-audit-logs');
            toast.success(
                workspace?.isArchived
                    ? 'Workspace archived successfully'
                    : 'Workspace restored successfully'
            );
        },
        onError: (error) => {
            toast.error('Unable to update workspace', {
                description: getApiErrorMessage(error, 'Please try again.')
            });
        }
    });

    const deleteWorkspaceMutation = useMutation({
        mutationFn: deleteAdminWorkspaceRequest,
        onSuccess: async () => {
            await refreshAdminData(
                'admin-overview',
                'admin-workspaces',
                'admin-messages',
                'admin-audit-logs'
            );
            toast.success('Workspace deleted successfully');
        },
        onError: (error) => {
            toast.error('Unable to delete workspace', {
                description: getApiErrorMessage(error, 'Please try again.')
            });
        }
    });

    const deleteMessageMutation = useMutation({
        mutationFn: deleteAdminMessageRequest,
        onSuccess: async () => {
            await refreshAdminData('admin-overview', 'admin-messages', 'admin-audit-logs');
            toast.success('Message removed successfully');
        },
        onError: (error) => {
            toast.error('Unable to remove message', {
                description: getApiErrorMessage(error, 'Please try again.')
            });
        }
    });

    return {
        isDeletingMessage: deleteMessageMutation.isPending,
        isDeletingWorkspace: deleteWorkspaceMutation.isPending,
        isUpdatingUser: updateUserMutation.isPending,
        isUpdatingWorkspace: updateWorkspaceMutation.isPending,
        deleteMessage: (messageId) =>
            deleteMessageMutation.mutateAsync({ messageId }),
        deleteWorkspace: (workspaceId) =>
            deleteWorkspaceMutation.mutateAsync({ workspaceId }),
        toggleUserAdmin: (user) =>
            updateUserMutation.mutateAsync({
                userId: user._id,
                isSuperAdmin: !user.isSuperAdmin
            }),
        toggleUserPlan: (user) =>
            updateUserMutation.mutateAsync({
                userId: user._id,
                plan: user.plan === 'Paid' ? 'Normal' : 'Paid'
            }),
        toggleUserStatus: (user) =>
            updateUserMutation.mutateAsync({
                userId: user._id,
                isActive: !user.isActive
            }),
        toggleWorkspaceArchive: (workspace) =>
            updateWorkspaceMutation.mutateAsync({
                workspaceId: workspace._id,
                isArchived: !workspace.isArchived
            })
    };
};
