
import React from 'react';
import { LayoutDashboard, Receipt, Settings, Truck, Fuel, BarChart3, Scale, Wrench, Calculator, FileSpreadsheet, Sparkles, CloudSync as CloudIcon } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isLoggedIn?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isLoggedIn }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard DRE', icon: LayoutDashboard },
    { id: 'TRANSACTIONS', label: 'Lançamentos', icon: Receipt },
    { id: 'AI_ENTRY', label: 'Lançamento IA', icon: Sparkles },
    { id: 'CLOUD_SYNC', label: 'Sincronizar Cloud', icon: CloudIcon, highlight: !isLoggedIn },
    { id: 'IMPORT', label: 'Importar Planilha', icon: FileSpreadsheet },
    { id: 'FUEL', label: 'Combustível', icon: Fuel },
    { id: 'WORKSHOP', label: 'Oficina / Manut.', icon: Wrench },
    { id: 'CLIENT_QUOTES', label: 'Calculadora Frete', icon: Calculator },
    { id: 'REPORTS', label: 'Relatórios Frotas', icon: BarChart3 },
    { id: 'TRUCKS', label: 'Caminhões', icon: Truck },
    { id: 'CATEGORIES', label: 'Categorias', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen hidden md:flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <Truck className="text-blue-400" size={32} />
        <span className="text-xl font-bold tracking-tight">Frota<span className="text-blue-400">Fin</span></span>
      </div>
      <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
              currentView === item.id 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
            {item.highlight && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          © 2024 FrotaFin v1.6
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
