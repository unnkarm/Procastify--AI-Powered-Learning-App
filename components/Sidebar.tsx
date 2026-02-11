import React from "react";
import { ViewState } from "../types";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Clock,
  BrainCircuit,
  Gamepad2,
  LogOut,
  Flame,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MoreHorizontal,
} from "lucide-react";

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  userName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileToggle,
}) => {
  // Handle navigation + auto-close mobile drawer
  const handleNav = (view: ViewState) => {
    onNavigate(view);
    if (mobileOpen) onMobileToggle();
  };

  // --- Desktop NavItem (supports collapsed mode) ---
  const DesktopNavItem = ({
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
        onClick={() => handleNav(view)}
        className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-4"} py-3 rounded-xl transition-all duration-300 font-medium group relative overflow-hidden flex-1 max-h-16
          ${active
            ? "bg-gradient-to-r from-discord-panel to-discord-panel/80 text-white shadow-lg shadow-discord-accent/20 border border-discord-accent/30"
            : "text-discord-textMuted hover:bg-gradient-to-r hover:from-discord-hover hover:to-discord-hover/80 hover:text-white hover:scale-105"
          }`}
        title={collapsed ? label : undefined}
      >
        {active && (
          <div className="absolute inset-0 bg-gradient-to-r from-discord-accent/10 to-purple-500/10 rounded-xl"></div>
        )}
        <Icon
          size={20}
          className={`transition-all duration-300 relative z-10 flex-shrink-0 ${active
            ? "text-discord-accent drop-shadow-sm"
            : "text-discord-textMuted group-hover:text-white group-hover:scale-110"
            }`}
        />
        {!collapsed && (
          <>
            <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">
              {label}
            </span>
            {active && (
              <div className="absolute right-2 w-2 h-2 bg-discord-accent rounded-full animate-pulse"></div>
            )}
          </>
        )}
      </button>
    );
  };

  // --- Mobile NavItem (always expanded, touch-optimized) ---
  const MobileNavItem = ({
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
        onClick={() => handleNav(view)}
        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors duration-200 font-medium group relative touch-manipulation active:scale-[0.97]
          ${active
            ? "bg-discord-accent/15 text-white"
            : "text-discord-textMuted hover:bg-white/5 hover:text-white active:bg-white/10"
          }`}
      >
        {/* Active indicator bar */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-discord-accent rounded-r-full" />
        )}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${active
            ? "bg-discord-accent/20 shadow-lg shadow-discord-accent/10"
            : "bg-white/5 group-hover:bg-white/10"
            }`}
        >
          <Icon
            size={18}
            className={`transition-all duration-200 ${active
              ? "text-discord-accent"
              : "text-discord-textMuted group-hover:text-white"
              }`}
          />
        </div>
        <span
          className={`text-[15px] tracking-wide ${active ? "font-semibold" : "font-medium"
            }`}
        >
          {label}
        </span>
        {active && (
          <div className="ml-auto w-2 h-2 bg-discord-accent rounded-full animate-pulse"></div>
        )}
      </button>
    );
  };

  // Navigation items config
  const NAV_ITEMS: { view: ViewState; icon: any; label: string }[] = [
    { view: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { view: "summarizer", icon: FileText, label: "Summarizer" },
    { view: "notes", icon: BookOpen, label: "My Notes" },
    { view: "feed", icon: Flame, label: "Learning Feed" },
    { view: "quiz", icon: Gamepad2, label: "Quiz Arena" },
    { view: "routine", icon: Clock, label: "Routine" },
    { view: "focus", icon: BrainCircuit, label: "Focus Mode" },
  ];

  // Bottom bar shows only the most important items
  const BOTTOM_BAR_ITEMS: { view: ViewState; icon: any; label: string }[] = [
    { view: "dashboard", icon: LayoutDashboard, label: "Home" },
    { view: "notes", icon: BookOpen, label: "Notes" },
    { view: "focus", icon: BrainCircuit, label: "Focus" },
    { view: "quiz", icon: Gamepad2, label: "Quiz" },
  ];

  return (
    <>
      {/* ====== MOBILE OVERLAY (backdrop) ====== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileToggle}
          aria-hidden="true"
        />
      )}

      {/* ====== MOBILE SLIDE-IN DRAWER ====== */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-72
          bg-gradient-to-b from-[#111214] to-[#0a0b0c]
          border-r border-white/10
          flex flex-col
          transition-transform duration-300 ease-in-out
          md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-discord-accent to-purple-600 flex items-center justify-center shadow-lg shadow-discord-accent/30">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Procastify
            </h1>
          </div>
          <button
            onClick={onMobileToggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-discord-textMuted hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto mobile-drawer-scroll">
          {NAV_ITEMS.map((item) => (
            <MobileNavItem
              key={item.view}
              view={item.view}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        {/* Mobile Logout */}
        <div className="p-4 border-t border-white/10 mobile-safe-bottom">
          <button
            onClick={() => {
              onLogout();
              if (mobileOpen) onMobileToggle();
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors touch-manipulation active:scale-[0.97]"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <span className="text-[15px] font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ====== DESKTOP SIDEBAR (persistent, collapsible) ====== */}
      <div
        className={`hidden md:flex ${collapsed ? "w-20" : "w-64"
          } bg-gradient-to-b from-[#111214] to-[#0a0b0c] flex-col h-screen fixed left-0 top-0 border-r border-white/10 z-50 backdrop-blur-sm transition-all duration-300 ease-in-out`}
      >
        {/* Desktop Header */}
        <div
          className={`flex items-center border-b border-white/5 bg-[#111214]/50 transition-all duration-300 ${collapsed ? "p-4 justify-center" : "px-5 py-5 justify-between"
            }`}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-discord-accent to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-discord-accent/30 hover:shadow-discord-accent/50 transition-all duration-300 hover:scale-110 group">
                  <BrainCircuit
                    className="text-white group-hover:rotate-12 transition-transform duration-300"
                    size={18}
                  />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight hover:text-discord-accent transition-colors duration-300 cursor-default ml-3 font-display">
                  Procastify
                </h1>
              </div>
              <button
                onClick={onToggleCollapse}
                className="flex items-center justify-center w-10 h-10 text-discord-textMuted hover:text-white hover:bg-discord-hover rounded-lg transition-all duration-300 group"
                title="Collapse sidebar"
              >
                <PanelLeftClose
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
            </>
          ) : (
            <div
              className="w-10 h-10 bg-gradient-to-br from-discord-accent to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-discord-accent/30 hover:shadow-discord-accent/50 transition-all duration-300 hover:scale-110 group cursor-pointer"
              onClick={onToggleCollapse}
              title="Expand sidebar"
            >
              <BrainCircuit
                className="text-white group-hover:rotate-12 transition-transform duration-300"
                size={24}
              />
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col justify-evenly gap-1 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map((item) => (
            <DesktopNavItem
              key={item.view}
              view={item.view}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        {/* Desktop Logout */}
        <div
          className={`${collapsed ? "p-3 mb-4" : "p-4 mx-4 mb-4"
            } border-t border-white/10 mt-auto`}
        >
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-4"
              } py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 font-medium group hover:scale-105 border border-transparent hover:border-red-500/20`}
            title={collapsed ? "Log Out" : undefined}
          >
            <LogOut
              size={20}
              className="group-hover:rotate-12 transition-transform duration-300 flex-shrink-0"
            />
            {!collapsed && (
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                Log Out
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ====== MOBILE BOTTOM TAB BAR ====== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111214]/95 backdrop-blur-xl border-t border-white/10 mobile-safe-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {BOTTOM_BAR_ITEMS.map((item) => {
            const active = currentView === item.view;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl min-w-[60px] transition-all duration-200 touch-manipulation active:scale-90
                  ${active ? "text-discord-accent" : "text-white/40 hover:text-white/60"}`}
              >
                <div className={`relative p-1 rounded-lg transition-all duration-200 ${active ? "bg-discord-accent/15" : ""}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-discord-accent rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] leading-tight ${active ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More button — opens drawer */}
          <button
            onClick={onMobileToggle}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl min-w-[60px] transition-all duration-200 touch-manipulation active:scale-90
              ${mobileOpen ? "text-discord-accent" : "text-white/40 hover:text-white/60"}`}
          >
            <div className={`relative p-1 rounded-lg transition-all duration-200 ${mobileOpen ? "bg-discord-accent/15" : ""}`}>
              <MoreHorizontal size={20} strokeWidth={1.8} />
            </div>
            <span className={`text-[10px] leading-tight font-medium`}>More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
