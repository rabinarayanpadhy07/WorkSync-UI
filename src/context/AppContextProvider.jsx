import combineContext from '@/utils/combineContext';
import { AuthContextProvider } from './AuthContext';
import { CreateChannelContextProvider } from './CreateChannelContext';
import { CreateWorkspaceContextProvider } from './CreateWorkspaceContext';
import { SocketContextProvider } from './SocketContext';
import { UserSettingsModalContextProvider } from './UserSettingsModalContext';
import { WorkspaceContextProvider } from './WorkspaceContext';
import { WorkspacePreferencesModalContextProvider } from './WorkspacePreferencesModalContext';

export const AppContextProvider = combineContext(
    AuthContextProvider,
    WorkspaceContextProvider,
    SocketContextProvider,

    CreateWorkspaceContextProvider,
    UserSettingsModalContextProvider,
    WorkspacePreferencesModalContextProvider,
    CreateChannelContextProvider
);
