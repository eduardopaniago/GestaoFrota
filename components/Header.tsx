
import React from 'react';
import { Truck, Bell, Menu } from 'lucide-react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  pendingCount?: number;
  companyName: string;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, pendingCount = 0, companyName, onToggleSidebar }) => {
  const titles: Record<View, string> = {
    DASHBOARD: 'Dashboard & DRE',
    TRANSACTIONS: 'Gestão de Lançamentos',
    AI_ENTRY: 'Lançamento IA',
    IMPORT: 'Importação de Dados',
    CATEGORIES: 'Configurações',
    FUEL: 'Controle de Combustível',
    REPORTS: 'Relatórios de Frota',
    TRUCKS: 'Gestão de Veículos',
    BUDGETS: 'Orçamentos',
    WORKSHOP: 'Manutenção',
    CLIENT_QUOTES: 'Cálculo de Frete',
    CLOUD_SYNC: 'Nuvem',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
        >
          <Truck size={24} />
          <div className="w-px h-4 bg-slate-200" />
          <Menu size={20} className="text-slate-400" />
        </button>
        <h1 className="text-base md:text-lg font-bold text-slate-800 truncate max-w-[150px] md:max-w-none">
          {titles[currentView] || 'Módulo'}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative cursor-pointer group p-2">
          <Bell className={`${pendingCount > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`} size={20} />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 bg-orange-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
              {pendingCount}
            </span>
          )}
        </div>
        
        <div className="hidden sm:flex flex-col items-end">
          <div className="text-sm font-bold text-slate-800 leading-none">{companyName}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">Operacional: OK</div>
        </div>

        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-lg shadow-blue-100 border-2 border-white">
          {companyName.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
