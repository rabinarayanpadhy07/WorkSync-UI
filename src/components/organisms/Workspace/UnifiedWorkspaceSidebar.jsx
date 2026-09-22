import { Home, HashIcon, SendHorizonalIcon, MessageSquareTextIcon, AlertTriangleIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';

import { WorkspacePanelHeader } from '@/components/molecules/Workspace/WorkspacePanelHeader';
import { WorkspacePanelSection } from '@/components/molecules/Workspace/WorkspacePanelSection';
import { SideBarItem } from '@/components/atoms/SideBarItem/SideBarItem';
import { UserItem } from '@/components/atoms/UserItem/UserItem';
import { UserButton } from '@/components/atoms/UserButton/UserButton';
import { WorkspaceSwitcher } from '@/components/organisms/Workspace/WorkspaceSwitcher';
import { useGetWorkspaceById } from '@/hooks/apis/workspaces/useGetWorkspaceById';
import { useCreateChannelModal } from '@/hooks/context/useCreateChannelModal';
import { useGetUnreadChannels } from '@/hooks/apis/read-receipts/useGetUnreadChannels';
import { useDrafts } from '@/hooks/apis/drafts/useDrafts';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/context/useAuth';
import { useCurrentWorkspace } from '@/hooks/context/useCurrentWorkspace';

export const UnifiedWorkspaceSidebar = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const { setOpenCreateChannelModal } = useCreateChannelModal();
    const { logout } = useAuth();
    const { setCurrentWorkspace } = useCurrentWorkspace();

    const { workspace, isFetching, isSuccess, error } = useGetWorkspaceById(workspaceId);
    const { unreadMap } = useGetUnreadChannels(workspaceId);
    const { drafts } = useDrafts(workspaceId);

    useEffect(() => {
        if (!isFetching && !isSuccess && error) {
            console.log('Error fetching workspace', error.status);
            if (error.status === 401 || error.status === 403) {
                logout();
                navigate('/auth/signin');
            }
        }
        
        if (workspace) {
            setCurrentWorkspace(workspace);
        }
    }, [workspace, setCurrentWorkspace, isSuccess, error, isFetching, logout, navigate]);

    if (isFetching) {
        return (
            <aside className="w-[280px] h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col p-4">
                <Skeleton className='h-10 w-full bg-white/10 rounded-md' />
                <div className='flex flex-col gap-y-2 mt-4'>
                    <Skeleton className='h-6 w-[80%] bg-white/5' />
                    <Skeleton className='h-6 w-[60%] bg-white/5' />
                    <Skeleton className='h-6 w-[70%] bg-white/5' />
                </div>
            </aside>
        );
    }

    if (!isSuccess) {
        return (
            <aside className='w-[280px] h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center justify-center text-white p-4'>
                <AlertTriangleIcon className='size-6 text-white mb-2' />
                <p>Something went wrong</p>
                <p className='text-center text-xs text-slate-400 mt-2'>
                    {getApiErrorMessage(error, 'We could not load this workspace right now.')}
                </p>
            </aside>
        );
    }

    return (
        <aside className="w-[280px] h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col text-slate-300">
            {/* Header / Workspace Switcher Area */}
            <div className="border-b border-white/5 relative group">
               <WorkspacePanelHeader workspace={workspace} />
            </div>

            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar flex flex-col">
                {/* Main Nav Items */}
                <div className="px-3 mb-6 space-y-1">
                    <div 
                        onClick={() => navigate('/home')}
                        className="flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5 text-slate-300 hover:text-white"
                    >
                        <Home className="w-4 h-4 mr-3" />
                        <span className="text-sm font-medium">Dashboard</span>
                    </div>
                    <SideBarItem 
                        label="Threads"
                        icon={MessageSquareTextIcon}
                        to={`/workspaces/${workspaceId}/threads`}
                        variant='default'
                    />
                    <SideBarItem
                        label="Drafts & Sends"
                        icon={SendHorizonalIcon}
                        to={`/workspaces/${workspaceId}/drafts`}
                        variant='default'
                        unreadCount={drafts.length}
                    />
                </div>

                {/* Channels Section */}
                <div className="mb-4">
                    <WorkspacePanelSection
                        label={'Channels'}
                        onIconClick={() => setOpenCreateChannelModal(true)}
                    >
                        {workspace?.channels?.map((channel) => (
                            <SideBarItem 
                                key={channel._id} 
                                icon={HashIcon} 
                                label={channel.name} 
                                id={channel._id} 
                                unreadCount={unreadMap?.[channel._id] || 0}
                            />
                        ))}
                    </WorkspacePanelSection>
                </div>

                {/* Direct Messages Section */}
                <div className="mb-4">
                    <WorkspacePanelSection
                        label="Direct messages"
                        onIconClick={() => {}}
                    >
                        {workspace?.members?.map((item) => {
                            const memberId = item.memberId;
                            if (!memberId) return null;
                            return <UserItem key={memberId._id} label={memberId.username} id={memberId._id} user={memberId} />;
                        })}
                    </WorkspacePanelSection>
                </div>

                {/* Bottom User Area */}
                <div className="mt-auto pt-4 px-4 pb-4 border-t border-white/5 flex items-center justify-between">
                    <UserButton />
                    {/* Floating workspace switcher to replace the old rail */}
                    <div className="opacity-70 hover:opacity-100 transition-opacity">
                        <WorkspaceSwitcher />
                    </div>
                </div>
            </div>
        </aside>
    );
};
