import React from 'react';
import { ViewState, UserRole } from '../types';
import {
  LayoutDashboard, FileText, BookOpen, Clock, BrainCircuit,
  Gamepad2, LogOut, Flame, PanelLeftClose, PanelLeftOpen,
  GraduationCap, Users
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: UserRole;
  user?: { name: string; avatarUrl?: string };
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  collapsed,
  onToggleCollapse,
  userRole = 'student',
  user,
}) => {
  const NavItem = ({
    view,
    icon: Icon,
    label,
  }: {
    view: ViewState;
    icon: any;
    label: string;
  }) => {
    const active = currentView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-300 font-medium group relative overflow-hidden
          ${active
            ? 'bg-gradient-to-r from-discord-panel to-discord-panel/80 text-white shadow-lg shadow-discord-accent/20 border border-discord-accent/30'
            : 'text-discord-textMuted hover:bg-gradient-to-r hover:from-discord-hover hover:to-discord-hover/80 hover:text-white hover:scale-105 border border-transparent'
          }`}
        title={collapsed ? label : undefined}
      >
        {active && (
          <div className="absolute inset-0 bg-gradient-to-r from-discord-accent/10 to-purple-500/10 rounded-xl" />
        )}
        <Icon
          size={20}
          className={`transition-all duration-300 relative z-10 flex-shrink-0 ${active
              ? 'text-discord-accent drop-shadow-sm'
              : 'text-discord-textMuted group-hover:text-white group-hover:scale-110'
            }`}
        />
        {!collapsed && (
          <>
            <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">
              {label}
            </span>
            {active && (
              <div className="absolute right-2 w-2 h-2 bg-discord-accent rounded-full animate-pulse" />
            )}
          </>
        )}
      </button>
    );
  };

  const studentNav = (
    <>
      <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
      <NavItem view="summarizer" icon={FileText} label="Summarizer" />
      <NavItem view="notes" icon={BookOpen} label="My Notes" />
      <NavItem view="studentClassrooms" icon={Users} label="Classrooms" />
      <NavItem view="feed" icon={Flame} label="Learning Feed" />
      <NavItem view="quiz" icon={Gamepad2} label="Quiz Arena" />
      <NavItem view="routine" icon={Clock} label="Routine" />
      <NavItem view="focus" icon={BrainCircuit} label="Focus Mode" />
    </>
  );

  const teacherNav = (
    <>
      <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
      <NavItem view="classrooms" icon={GraduationCap} label="My Classrooms" />
      <NavItem view="notes" icon={BookOpen} label="My Notes" />
      <NavItem view="routine" icon={Clock} label="Routine" />
      <NavItem view="focus" icon={BrainCircuit} label="Focus Mode" />
    </>
  );

  return (
    <div
      className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-[#111214] to-[#0a0b0c] flex flex-col h-screen fixed left-0 top-0 border-r border-white/10 z-50 backdrop-blur-sm transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div
        className={`flex items-center border-b border-white/5 bg-[#111214]/50 transition-all duration-300 ${collapsed ? 'p-4 justify-center' : 'px-5 py-5 justify-between'}`}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-discord-accent to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-discord-accent/30 hover:shadow-discord-accent/50 transition-all duration-300 hover:scale-110 group">
                <BrainCircuit className="text-white group-hover:rotate-12 transition-transform duration-300" size={18} />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight hover:text-discord-accent transition-colors duration-300 cursor-default ml-3">
                Procastify
              </h1>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-8 h-8 text-discord-textMuted hover:text-white hover:bg-discord-hover rounded-lg transition-all duration-300 group"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-discord-accent to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-discord-accent/30 hover:shadow-discord-accent/50 transition-all duration-300 hover:scale-110 group">
            <BrainCircuit className="text-white group-hover:rotate-12 transition-transform duration-300" size={24} />
          </div>
        )}
      </div>

      {/* Expand button (collapsed only) */}
      {collapsed && (
        <div className="px-4 pt-4 flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-10 h-10 text-discord-textMuted hover:text-white hover:bg-discord-hover rounded-lg transition-all duration-300 group"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {userRole === 'teacher' ? teacherNav : studentNav}
      </nav>

      {/* Bottom section */}
      <div className={`${collapsed ? 'p-3 mb-4' : 'px-4 pb-4 mx-1 mb-2'} border-t border-white/10 mt-auto pt-3`}>

        {/* User Profile */}
        {user && (
          <div className={`flex items-center ${collapsed ? 'justify-center mb-3' : 'gap-3 mb-3 px-2'}`}>
            {user.avatarUrl ? (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-discord-accent/30 flex-shrink-0">
                <img
                  src={user.avatarUrl}
                  alt={`${user.name}'s avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-discord-accent/20 border-2 border-discord-accent/30 flex items-center justify-center flex-shrink-0">
                <span className="text-discord-accent text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-discord-textMuted capitalize">{userRole}</p>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <ThemeToggle collapsed={collapsed} />

        {/* Logout */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 font-medium group border border-transparent hover:border-red-500/20`}
          title={collapsed ? 'Log Out' : undefined}
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
          {!collapsed && (
            <span className="group-hover:translate-x-1 transition-transform duration-300">Log Out</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
