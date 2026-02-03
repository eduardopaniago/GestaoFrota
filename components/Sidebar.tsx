
import React from 'react';
import { LayoutDashboard, Receipt, Settings, Truck, Fuel, BarChart3, Wrench, Calculator, FileSpreadsheet, Sparkles, Cloud, X } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isLoggedIn?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isLoggedIn, isOpen, onClose }) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard DRE', icon: LayoutDashboard },
    { id: 'TRANSACTIONS', label: 'Lançamentos', icon: Receipt },
    { id: 'AI_ENTRY', label: 'Lançamento IA', icon: Sparkles },
    { id: 'CLOUD_SYNC', label: 'Sincronizar Cloud', icon: Cloud, highlight: !isLoggedIn },
    { id: 'IMPORT', label: 'Importar Planilha', icon: FileSpreadsheet },
    { id: 'FUEL', label: 'Combustível', icon: Fuel },
    { id: 'WORKSHOP', label: 'Oficina / Manut.', icon: Wrench },
    { id: 'CLIENT_QUOTES', label: 'Calculadora Frete', icon: Calculator },
    { id: 'REPORTS', label: 'Relatórios Frotas', icon: BarChart3 },
    { id: 'TRUCKS', label: 'Caminhões', icon: Truck },
    { id: 'CATEGORIES', label: 'Categorias', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Truck className="text-blue-400" size={32} />
            <span className="text-xl font-bold tracking-tight">Frota<span className="text-blue-400">Fin</span></span>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
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
    </>
  );
};

export default Sidebar;
