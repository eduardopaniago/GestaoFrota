
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Calendar, CheckCircle2, Clock, 
  Navigation, Weight, Box, Package, Gauge, Tag, ChevronDown, ChevronUp
} from 'lucide-react';
import { Category, Transaction, TransactionType, Truck as TruckType, MaintenanceOrder, CargoTypeCategory, MeasureUnit } from '../types';

interface TransactionFormProps {
  categories: Category[];
  cargoTypes: CargoTypeCategory[];
  trucks: TruckType[];
  transactions: Transaction[];
  maintenances: MaintenanceOrder[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  markAsPaid?: (id: string) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, cargoTypes, trucks, transactions, maintenances, addTransaction, deleteTransaction, markAsPaid }) => {
  const filteredCategories = useMemo(() => {
    return categories.filter(c => !c.name.toLowerCase().includes('combustível'));
  }, [categories]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    executionDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    isPaid: true,
    amount: '',
    description: '',
    subCategory: '',
    categoryId: filteredCategories[0]?.id || '',
    truckId: '',
    maintenanceId: '',
    startMileage: '',
    endMileage: '',
    weight: '',
    volume: '',
    cargoTypeId: '',
  });

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.id === formData.categoryId)) {
      setFormData(prev => ({ ...prev, categoryId: filteredCategories[0].id }));
    }
  }, [filteredCategories]);

  const selectedCategory = filteredCategories.find(c => c.id === formData.categoryId);
  const isFreight = selectedCategory?.name.toLowerCase().includes('frete');
  const selectedCargo = cargoTypes.find(ct => ct.id === formData.cargoTypeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.categoryId || !formData.date) return;

    addTransaction({
      date: formData.date,
      executionDate: formData.executionDate,
      dueDate: formData.dueDate || undefined,
      isPaid: formData.isPaid,
      amount: parseFloat(formData.amount),
      description: formData.description || selectedCategory?.name || '',
      subCategory: formData.subCategory,
      categoryId: formData.categoryId,
      type: selectedCategory?.type || TransactionType.VARIABLE_EXPENSE,
      truckId: formData.truckId || undefined,
      maintenanceId: formData.maintenanceId || undefined,
      startMileage: isFreight ? parseFloat(formData.startMileage) : undefined,
      endMileage: isFreight ? parseFloat(formData.endMileage) : undefined,
      weight: (isFreight && selectedCargo?.unit === MeasureUnit.WEIGHT) ? parseFloat(formData.weight) : undefined,
      volume: (isFreight && selectedCargo?.unit === MeasureUnit.VOLUME) ? parseFloat(formData.volume) : undefined,
      cargoTypeId: isFreight ? formData.cargoTypeId : undefined,
      cargoTypeLabel: isFreight ? selectedCargo?.name : undefined,
    });

    setFormData(prev => ({
      ...prev,
      amount: '',
      description: '',
      subCategory: '',
      truckId: '',
      maintenanceId: '',
      startMileage: '',
      endMileage: '',
      weight: '',
      volume: '',
      cargoTypeId: '',
      dueDate: '',
      isPaid: true
    }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="lg:col-span-1">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="text-blue-600" size={24} /> Novo Lançamento Manual
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Data de Execução (Ocorrência)</label>
                  <input type="date" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.executionDate} onChange={e => setFormData({...formData, executionDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Data para Receber/Pagar</label>
                  <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Status</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={formData.isPaid ? 'true' : 'false'} onChange={e => setFormData({...formData, isPaid: e.target.value === 'true'})}>
                    <option value="true">Pago / Recebido</option>
                    <option value="false">Pendente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Valor Total (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="0,00" 
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Categoria</label>
                  <select required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                  Sub-Categoria <span className="text-[8px] font-normal text-slate-400">({isFreight ? 'Cliente' : 'Fornec.'})</span>
                </label>
                <input 
                  type="text" 
                  placeholder={isFreight ? "Nome do Cliente" : "Fornecedor X"} 
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  value={formData.subCategory} 
                  onChange={e => setFormData({...formData, subCategory: e.target.value})} 
                />
              </div>

              {isFreight && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-2 mb-1 text-emerald-700 font-bold text-[10px] uppercase">
                    <Navigation size={14} /> Dados da Carga / Odometria
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Package size={12}/> Tipo de Carga</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" 
                      value={formData.cargoTypeId} 
                      onChange={e => setFormData({...formData, cargoTypeId: e.target.value})}
                    >
                      <option value="">Selecione o produto...</option>
                      {cargoTypes.map(ct => (
                        <option key={ct.id} value={ct.id}>{ct.name} ({ct.unit === MeasureUnit.WEIGHT ? 'Peso' : 'Volume'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Gauge size={12}/> KM Inicial</label>
                      <input type="number" step="0.1" placeholder="0,0" className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" value={formData.startMileage} onChange={e => setFormData({...formData, startMileage: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Gauge size={12}/> KM Final</label>
                      <input type="number" step="0.1" placeholder="0,0" className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" value={formData.endMileage} onChange={e => setFormData({...formData, endMileage: e.target.value})} />
                    </div>

                    {selectedCargo?.unit === MeasureUnit.WEIGHT && (
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Weight size={12}/> Peso (Toneladas)</label>
                        <input type="number" step="0.001" placeholder="Informe o peso em Toneladas" className="w-full px-3 py-2 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                      </div>
                    )}

                    {selectedCargo?.unit === MeasureUnit.VOLUME && (
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Box size={12}/> Volume (m³)</label>
                        <input type="number" step="0.01" placeholder="Informe o volume em m³" className="w-full px-3 py-2 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white" value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Veículo Relacionado</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={formData.truckId} onChange={e => setFormData({...formData, truckId: e.target.value})}>
                  <option value="">Nenhum / Administrativo</option>
                  {trucks.map(truck => <option key={truck.id} value={truck.id}>{truck.plate} - {truck.model}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-lg shadow-lg shadow-blue-100 transition-all active:scale-95">
                Confirmar Lançamento
              </button>
            </form>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Histórico de Fluxo</h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4 font-black">Execução / Venc.</th>
                    <th className="px-6 py-4 font-black">Lançamento / Status</th>
                    <th className="px-6 py-4 font-black">Categoria</th>
                    <th className="px-6 py-4 font-black text-right">Valor</th>
                    <th className="px-6 py-4 font-black text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...transactions].reverse().map(tx => {
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const truck = trucks.find(t => t.id === tx.truckId);
                    
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs whitespace-nowrap">
                          <div className="font-bold text-slate-700">{new Date(tx.executionDate).toLocaleDateString()}</div>
                          {tx.dueDate && (
                            <div className={`text-[9px] font-black uppercase mt-1 ${!tx.isPaid ? 'text-orange-500' : 'text-slate-400'}`}>
                              {tx.type === TransactionType.REVENUE ? 'Receber:' : 'Pagar:'} {new Date(tx.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            {tx.description}
                            {tx.isPaid ? (
                              <CheckCircle2 size={12} className="text-emerald-500" />
                            ) : (
                              <Clock size={12} className="text-orange-500" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {tx.subCategory && <span className="text-[9px] text-slate-500 font-medium bg-slate-100 px-1 py-0.5 rounded">{tx.subCategory}</span>}
                            {truck && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{truck.plate}</span>}
                            {!tx.isPaid && markAsPaid && (
                              <button onClick={() => markAsPaid(tx.id)} className="text-[9px] font-black text-emerald-600 hover:underline">Liquidar agora</button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                            tx.type === TransactionType.REVENUE ? 'bg-emerald-100 text-emerald-700' : 
                            tx.type === TransactionType.FIXED_COST ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {cat?.name || 'S/ Categoria'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-black text-right whitespace-nowrap ${tx.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.type !== TransactionType.REVENUE && '- '}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => deleteTransaction(tx.id)} className="text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
