import React from 'react';
import { 
  HomeIcon, 
  DocumentPlusIcon, 
  Cog6ToothIcon, 
  BeakerIcon 
} from '@heroicons/react/24/outline';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
        : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export const AppShell: React.FC<AppShellProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F5F7]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white/60 backdrop-blur-xl flex flex-col justify-between pt-8 pb-6 px-4">
        <div>
          <div className="flex items-center space-x-2 px-4 mb-10">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">
              Op
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900">OpenCSPaper</span>
          </div>

          <nav className="space-y-1">
            <NavItem 
              icon={HomeIcon} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => onTabChange('dashboard')} 
            />
            <NavItem 
              icon={DocumentPlusIcon} 
              label="New Review" 
              active={activeTab === 'new'} 
              onClick={() => onTabChange('new')} 
            />
            <NavItem 
              icon={Cog6ToothIcon} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => onTabChange('settings')} 
            />
          </nav>
        </div>

        <div className="px-4">
          <div className="bg-gray-100/50 rounded-xl p-4 border border-gray-200/50">
            <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-2">
              <BeakerIcon className="w-4 h-4" />
              <span>Model Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-700">Gemini 2.5 Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full relative">
        <div className="max-w-6xl mx-auto p-8 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
};