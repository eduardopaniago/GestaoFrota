
import React from 'react';
import { Truck, Bell } from 'lucide-react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  pendingCount?: number;
  companyName: string;
}

const Header: React.FC<HeaderProps> = ({ currentView, pendingCount = 0, companyName }) => {
  const titles: Record<View, string> = {
    DASHBOARD: 'Dashboard & DRE',
    TRANSACTIONS: 'Gestão de Lançamentos',
    AI_ENTRY: 'Inteligência Artificial (Lançamento)',
    IMPORT: 'Importação de Dados (Excel)',
    CATEGORIES: 'Configurações de Categorias',
    FUEL: 'Controle de Combustível',
    REPORTS: 'Relatórios de Frota',
    TRUCKS: 'Gestão de Veículos',
    BUDGETS: 'Comparativo de Orçamentos',
    WORKSHOP: 'Oficina e Manutenção',
    CLIENT_QUOTES: 'Calculadora de Frete para Cliente',
    CLOUD_SYNC: 'Sincronização em Nuvem',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
            <Truck className="text-blue-600" size={24} />
        </div>
        <h1 className="text-lg font-semibold text-slate-800">{titles[currentView] || 'Módulo'}</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer group">
          <Bell className={`${pendingCount > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`} size={20} />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
              {pendingCount}
            </span>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <div className="text-sm font-bold text-slate-800 leading-none">{companyName}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">Status Operacional: OK</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-100">
          {companyName.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
