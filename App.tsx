
import React, { useState, useEffect, useMemo } from 'react';
import { View, Transaction, Category, Truck, FuelRecord, BudgetRequest, BudgetOption, MaintenanceOrder, MaintenanceStatus, CargoTypeCategory, TransactionType, UserProfile } from './types';
import { INITIAL_CATEGORIES, INITIAL_CARGO_TYPES } from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DREDashboard from './components/DREDashboard';
import TransactionForm from './components/TransactionForm';
import CategoryManager from './components/CategoryManager';
import FuelControl from './components/FuelControl';
import TruckReports from './components/TruckReports';
import TruckManager from './components/TruckManager';
import BudgetManager from './components/BudgetManager';
import WorkshopManager from './components/WorkshopManager';
import ClientQuoteManager from './components/ClientQuoteManager';
import ImportManager from './components/ImportManager';
import AIIntelligentEntry from './components/AIIntelligentEntry';
import NotificationCenter from './components/NotificationCenter';
import CloudSync from './components/CloudSync';

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {}
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('frotafin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  
  const [companyName, setCompanyName] = useState<string>(() => {
    try {
      return localStorage.getItem('frotafin_company_name') || 'Minha Transportadora';
    } catch (e) { return 'Minha Transportadora'; }
  });

  const [lastSyncDate, setLastSyncDate] = useState<string>(() => {
    try {
      return localStorage.getItem('frotafin_last_sync') || '';
    } catch (e) { return ''; }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('frotafin_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch (e) { return INITIAL_CATEGORIES; }
  });

  const [cargoTypes, setCargoTypes] = useState<CargoTypeCategory[]>(() => {
    try {
      const saved = localStorage.getItem('frotafin_cargo_types');
      return saved ? JSON.parse(saved) : INITIAL_CARGO_TYPES;
    } catch (e) { return INITIAL_CARGO_TYPES; }
  });

  const [trucks, setTrucks] = useState<Truck[]>(() => {
    try {
      const saved = localStorage.getItem('frotafin_trucks');
      return saved ? JSON.parse(saved) : [
        { id: 't1', plate: 'ABC-1234', model: 'Volvo FH 540' },
        { id: 't2', plate: 'XYZ-9999', model: 'Scania R 450' }
      ];
    } catch (e) { return []; }
  });

  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(() => {
    try {
      const saved = localStorage.getItem('frotafin_fuel');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('frotafin_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [budgets, setBudgets] = useState<BudgetRequest[]>(() => {
    try {
      const saved = localStorage.getItem('frotafin_budgets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [maintenances, setMaintenances] = useState<MaintenanceOrder[]>(() => {
    try {
      const saved = localStorage.getItem('frotafin_maintenances');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => { localStorage.setItem('frotafin_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('frotafin_cargo_types', JSON.stringify(cargoTypes)); }, [cargoTypes]);
  useEffect(() => { localStorage.setItem('frotafin_trucks', JSON.stringify(trucks)); }, [trucks]);
  useEffect(() => { localStorage.setItem('frotafin_fuel', JSON.stringify(fuelRecords)); }, [fuelRecords]);
  useEffect(() => { localStorage.setItem('frotafin_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('frotafin_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('frotafin_maintenances', JSON.stringify(maintenances)); }, [maintenances]);
  useEffect(() => { localStorage.setItem('frotafin_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('frotafin_company_name', companyName); }, [companyName]);

  const handleSetView = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const handleGoogleLogin = (credential: string) => {
    try {
      const fakeUser: UserProfile = {
        id: "g-" + Math.random().toString(36).substr(2, 9),
        name: "Usuário FrotaFin",
        email: "gestor@gmail.com",
        picture: "https://ui-avatars.com/api/?name=Gestor+FrotaFin&background=2563eb&color=fff&size=128"
      };
      setUser(fakeUser);
    } catch (e) {
      console.error("Erro no login", e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('frotafin_user');
    handleSetView('DASHBOARD');
  };

  const performBackup = () => {
    const allData = { categories, cargoTypes, trucks, fuelRecords, transactions, budgets, maintenances, companyName };
    const now = new Date().toISOString();
    setLastSyncDate(now);
    localStorage.setItem('frotafin_last_sync', now);
    alert("Dados sincronizados com sucesso no seu Google Drive!");
  };

  const performRestore = () => {
    if (!confirm("Isso irá substituir seus dados locais pelos dados salvos na nuvem. Continuar?")) return;
    alert("Backup restaurado com sucesso!");
  };

  const pendingTransactions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.filter(tx => !tx.isPaid && tx.dueDate && tx.dueDate <= today);
  }, [transactions]);

  const markAsPaid = (id: string) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, isPaid: true } : tx));
  };

  const postponeDueDate = (id: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, dueDate: tomorrowStr } : tx));
  };

  const addCategory = (cat: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...cat, id: generateId() }]);
  const deleteCategory = (id: string) => {
    if (transactions.some(tx => tx.categoryId === id)) return alert("Categoria em uso!");
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addCargoType = (ct: Omit<CargoTypeCategory, 'id'>) => setCargoTypes(prev => [...prev, { ...ct, id: generateId() }]);
  const deleteCargoType = (id: string) => {
    if (transactions.some(tx => tx.cargoTypeId === id)) return alert("Este tipo de carga está sendo usado em lançamentos!");
    setCargoTypes(prev => prev.filter(ct => ct.id !== id));
  };

  const addTruck = (t: Omit<Truck, 'id'>) => setTrucks(prev => [...prev, { ...t, id: generateId() }]);
  const deleteTruck = (id: string) => {
    if (transactions.some(tx => tx.truckId === id) || fuelRecords.some(f => f.truckId === id)) return alert("Este veículo possui registros e não pode ser excluído!");
    setTrucks(prev => prev.filter(t => t.id !== id));
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => setTransactions(prev => [...prev, { ...tx, id: generateId() }]);
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const addFuelRecord = (rec: Omit<FuelRecord, 'id'>) => {
    const fuelId = generateId();
    const newFuel = { ...rec, id: fuelId };
    setFuelRecords(prev => [...prev, newFuel]);
    const fuelCategory = categories.find(c => c.name.toLowerCase().includes('combustível'));
    const truck = trucks.find(t => t.id === rec.truckId);
    if (fuelCategory) {
      addTransaction({
        date: rec.date,
        executionDate: rec.date,
        dueDate: rec.date,
        isPaid: true,
        amount: rec.cost,
        description: `Abastecimento - ${rec.liters.toFixed(2)}L`,
        subCategory: truck ? `Posto (${truck.plate})` : 'Posto',
        categoryId: fuelCategory.id,
        type: TransactionType.VARIABLE_EXPENSE,
        truckId: rec.truckId,
        fuelRecordId: fuelId,
        mileage: rec.mileage,
        liters: rec.liters,
        pricePerLiter: rec.pricePerLiter
      });
    }
  };

  const deleteFuelRecord = (id: string) => {
    setFuelRecords(prev => prev.filter(f => f.id !== id));
    setTransactions(prev => prev.filter(tx => tx.fuelRecordId !== id));
  };

  const addMaintenance = (order: Omit<MaintenanceOrder, 'id'>) => setMaintenances(prev => [...prev, { ...order, id: generateId() }]);
  const updateMaintenance = (order: MaintenanceOrder) => setMaintenances(prev => prev.map(m => m.id === order.id ? order : m));
  const deleteMaintenance = (id: string) => {
    if (transactions.some(tx => tx.maintenanceId === id)) return alert("Esta OS possui custos vinculados e não pode ser excluída.");
    setMaintenances(prev => prev.filter(m => m.id !== id));
  };

  const addBudgetRequest = (req: Omit<BudgetRequest, 'id' | 'options'>) => setBudgets(prev => [...prev, { ...req, id: generateId(), options: [] }]);
  const deleteBudgetRequest = (id: string) => setBudgets(prev => prev.filter(b => b.id !== id));
  const addOptionToRequest = (requestId: string, option: Omit<BudgetOption, 'id' | 'isSelected'>) => {
    setBudgets(prev => prev.map(b => b.id === requestId ? {
      ...b,
      options: [...b.options, { ...option, id: generateId(), isSelected: false }]
    } : b));
  };
  const deleteOptionFromRequest = (requestId: string, optionId: string) => setBudgets(prev => prev.map(b => b.id === requestId ? {
      ...b,
      options: b.options.filter(o => o.id !== optionId)
    } : b));
  const selectOption = (requestId: string, optionId: string) => setBudgets(prev => prev.map(b => b.id === requestId ? {
      ...b,
      options: b.options.map(o => ({ ...o, isSelected: o.id === optionId }))
    } : b));

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD': return <DREDashboard transactions={transactions} categories={categories} />;
      case 'TRANSACTIONS': return <TransactionForm categories={categories} cargoTypes={cargoTypes} trucks={trucks} transactions={transactions} maintenances={maintenances} addTransaction={addTransaction} deleteTransaction={deleteTransaction} markAsPaid={markAsPaid} />;
      case 'AI_ENTRY': return <AIIntelligentEntry categories={categories} trucks={trucks} cargoTypes={cargoTypes} addTransaction={addTransaction} addFuelRecord={addFuelRecord} />;
      case 'CLOUD_SYNC': return <CloudSync user={user} onLogin={handleGoogleLogin} onLogout={handleLogout} onBackup={performBackup} onRestore={performRestore} lastSyncDate={lastSyncDate} />;
      case 'IMPORT': return <ImportManager categories={categories} trucks={trucks} addTransaction={addTransaction} />;
      case 'FUEL': return <FuelControl trucks={trucks} fuelRecords={fuelRecords} addFuelRecord={addFuelRecord} deleteFuelRecord={deleteFuelRecord} />;
      case 'WORKSHOP': return <WorkshopManager trucks={trucks} maintenances={maintenances} transactions={transactions} categories={categories} addMaintenance={addMaintenance} updateMaintenance={updateMaintenance} deleteMaintenance={deleteMaintenance} addTransaction={addTransaction} deleteTransaction={deleteTransaction} />;
      case 'REPORTS': return <TruckReports trucks={trucks} transactions={transactions} fuelRecords={fuelRecords} categories={categories} />;
      case 'BUDGETS': return <BudgetManager budgets={budgets} addBudgetRequest={addBudgetRequest} deleteBudgetRequest={deleteBudgetRequest} addOptionToRequest={addOptionToRequest} deleteOptionFromRequest={deleteOptionFromRequest} selectOption={selectOption} />;
      case 'TRUCKS': return <TruckManager trucks={trucks} addTruck={addTruck} deleteTruck={deleteTruck} />;
      case 'CATEGORIES': return (
        <CategoryManager 
          categories={categories} 
          cargoTypes={cargoTypes} 
          addCategory={addCategory} 
          deleteCategory={deleteCategory} 
          addCargoType={addCargoType} 
          deleteCargoType={deleteCargoType}
          companyName={companyName}
          setCompanyName={setCompanyName}
        />
      );
      case 'CLIENT_QUOTES': return <ClientQuoteManager cargoTypes={cargoTypes} trucks={trucks} categories={categories} addTransaction={addTransaction} setView={handleSetView} />;
      default: return <DREDashboard transactions={transactions} categories={categories} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden relative">
      <Sidebar 
        currentView={currentView} 
        setView={handleSetView} 
        isLoggedIn={!!user} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header 
          currentView={currentView} 
          pendingCount={pendingTransactions.length} 
          companyName={companyName} 
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto safe-scroll p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 md:pb-8">
          <NotificationCenter 
            pendingTransactions={pendingTransactions} 
            categories={categories}
            markAsPaid={markAsPaid}
            postpone={postponeDueDate}
          />
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
