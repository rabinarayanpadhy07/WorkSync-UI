import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronDown,
  FolderPlus,
  Users
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Dashboard', active: true, path: '/home' },
  { icon: FolderPlus, label: 'Create Workspace', path: '/workspaces/create' },
  { icon: Users, label: 'Join Workspace', path: '/workspaces/join' },
];

export const Sidebar = ({ workspaces }) => {
  const navigate = useNavigate();
  const firstWorkspace = workspaces?.length > 0 ? workspaces[0] : null;

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="w-[280px] h-screen glass-panel flex flex-col text-slate-300"
    >
      {/* Workspace Header */}
      <div className="h-16 flex items-center px-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5"
           onClick={() => firstWorkspace && navigate(`/workspaces/${firstWorkspace._id}`)}>
        {firstWorkspace ? (
          <>
            <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold mr-3">
              {firstWorkspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold flex items-center truncate">
                {firstWorkspace.name} <ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
              </h2>
            </div>
          </>
        ) : (
          <div className="flex-1">
            <h2 className="text-white font-semibold flex items-center">
              WorkSync Dashboard
            </h2>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {/* Main Nav */}
        <div className="px-3 mb-6 space-y-1">
          {navItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ x: 4 }}
              onClick={() => navigate(item.path)}
              className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                item.active ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Info Message about Channels */}
        <div className="px-6 py-4 mt-8 bg-white/5 rounded-lg mx-3 border border-white/5">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Select a workspace from the dashboard to view its channels and direct messages.
          </p>
        </div>
      </div>
    </motion.aside>
  );
};
