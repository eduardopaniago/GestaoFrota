
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Wrench, CheckCircle2, Clock, AlertCircle, Calendar, Truck as TruckIcon, FileText, ChevronRight, DollarSign, Store, Tag, PackagePlus, ListFilter } from 'lucide-react';
import { MaintenanceOrder, MaintenanceStatus, Truck, Transaction, Category, TransactionType } from '../types';

interface WorkshopManagerProps {
  trucks: Truck[];
  maintenances: MaintenanceOrder[];
  transactions: Transaction[];
  categories: Category[];
  addMaintenance: (order: Omit<MaintenanceOrder, 'id'>) => void;
  updateMaintenance: (order: MaintenanceOrder) => void;
  deleteMaintenance: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

const WorkshopManager: React.FC<WorkshopManagerProps> = ({ 
  trucks, maintenances, transactions, categories, addMaintenance, updateMaintenance, deleteMaintenance, addTransaction, deleteTransaction
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<MaintenanceOrder | null>(null);
  const [addingItemToOrderId, setAddingItemToOrderId] = useState<string | null>(null);
  
  // OS Principal Form
  const [formData, setFormData] = useState({
    truckId: '',
    title: '',
    description: '',
    type: 'PREVENTIVA' as 'PREVENTIVA' | 'CORRETIVA',
    dateStarted: new Date().toISOString().split('T')[0],
  });

  // Novo Item Form
  const [newItem, setNewItem] = useState({
    description: '',
    amount: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [finishNotes, setFinishNotes] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.truckId || !formData.title) return;
    addMaintenance({
      ...formData,
      status: MaintenanceStatus.PENDING,
    });
    setFormData({ truckId: '', title: '', description: '', type: 'PREVENTIVA', dateStarted: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const handleFinish = (order: MaintenanceOrder) => {
    updateMaintenance({
      ...order,
      status: MaintenanceStatus.COMPLETED,
      dateFinished: new Date().toISOString().split('T')[0],
      resultNotes: finishNotes
    });
    setFinishNotes('');
    setEditingOrder(null);
  };

  const handleAddItem = (order: MaintenanceOrder) => {
    if (!newItem.description || !newItem.amount) return;

    const maintenanceCategory = categories.find(c => c.name.toLowerCase().includes('manutenção')) || categories[0];

    // Added missing executionDate and isPaid properties to satisfy the Transaction interface
    addTransaction({
      date: newItem.date,
      executionDate: newItem.date,
      isPaid: true,
      amount: parseFloat(newItem.amount),
      description: newItem.description,
      subCategory: newItem.supplier,
      categoryId: maintenanceCategory.id,
      type: TransactionType.VARIABLE_EXPENSE,
      truckId: order.truckId,
      maintenanceId: order.id
    });

    setNewItem({
      description: '',
      amount: '',
      supplier: '',
      date: new Date().toISOString().split('T')[0],
    });
    setAddingItemToOrderId(null);
  };

  const getOrderCosts = (orderId: string) => {
    const relatedTxs = transactions.filter(tx => tx.maintenanceId === orderId);
    return {
      total: relatedTxs.reduce((sum, tx) => sum + tx.amount, 0),
      items: relatedTxs
    };
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const statusMap = {
    [MaintenanceStatus.PENDING]: { label: 'Pendente', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
    [MaintenanceStatus.IN_PROGRESS]: { label: 'Executando', color: 'bg-blue-100 text-blue-700', icon: Clock },
    [MaintenanceStatus.COMPLETED]: { label: 'Concluída', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Wrench className="text-blue-600" /> Ordens de Serviço (OS)
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          {showForm ? 'Fechar' : <><Plus size={18} /> Abrir Nova OS</>}
        </button>
      </div>

      {showForm && (
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Caminhão</label>
              <select required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={formData.truckId} onChange={e => setFormData({...formData, truckId: e.target.value})}>
                <option value="">Selecione...</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Título do Serviço</label>
              <input required placeholder="Ex: Revisão 50k KM" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Tipo</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                <option value="PREVENTIVA">Preventiva</option>
                <option value="CORRETIVA">Corretiva</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-sm transition-all">
                Abrir Manutenção
              </button>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">O que precisa ser feito?</label>
              <textarea placeholder="Descreva os problemas relatados ou o check-list de manutenção..." className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </form>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6">
        {maintenances.slice().reverse().map(order => {
          const truck = trucks.find(t => t.id === order.truckId);
          const StatusIcon = statusMap[order.status].icon;
          const costs = getOrderCosts(order.id);

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-200 transition-all group">
              <div className="p-6 flex flex-wrap md:flex-nowrap gap-8 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${order.type === 'PREVENTIVA' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                      {order.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${statusMap[order.status].color}`}>
                      <StatusIcon size={10} /> {statusMap[order.status].label}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 truncate">{order.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"><TruckIcon size={14}/> {truck?.plate || '---'}</div>
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"><Calendar size={14}/> {new Date(order.dateStarted).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="mt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Diagnóstico Inicial</div>
                    <p className="text-sm text-slate-600 leading-relaxed italic">"{order.description || 'Nenhuma descrição informada.'}"</p>
                  </div>

                  {/* Lista de Itens Vinculados */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ListFilter size={12} /> Itens e Peças Utilizadas
                      </div>
                      {order.status !== MaintenanceStatus.COMPLETED && (
                        <button 
                          onClick={() => setAddingItemToOrderId(addingItemToOrderId === order.id ? null : order.id)}
                          className="text-xs font-black text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all"
                        >
                          <Plus size={14} /> Adicionar Item
                        </button>
                      )}
                    </div>
                    
                    {addingItemToOrderId === order.id && (
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-2">
                            <input 
                              placeholder="Descrição do item/peça" 
                              className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={newItem.description}
                              onChange={e => setNewItem({...newItem, description: e.target.value})}
                            />
                          </div>
                          <div>
                            <input 
                              type="number" 
                              placeholder="Valor R$" 
                              className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={newItem.amount}
                              onChange={e => setNewItem({...newItem, amount: e.target.value})}
                            />
                          </div>
                          <div>
                            <input 
                              placeholder="Fornecedor" 
                              className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={newItem.supplier}
                              onChange={e => setNewItem({...newItem, supplier: e.target.value})}
                            />
                          </div>
                          <div className="md:col-span-2">
                             <input 
                              type="date"
                              className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={newItem.date}
                              onChange={e => setNewItem({...newItem, date: e.target.value})}
                            />
                          </div>
                          <div className="md:col-span-2 flex gap-2">
                            <button 
                              onClick={() => handleAddItem(order)}
                              className="flex-1 bg-blue-600 text-white font-black text-xs py-2 rounded-lg hover:bg-blue-700 transition-all"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => setAddingItemToOrderId(null)}
                              className="px-4 bg-white text-slate-500 font-bold text-xs py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {costs.items.length > 0 ? (
                        costs.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 group/item hover:border-blue-100 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover/item:text-blue-500 transition-colors">
                                <Tag size={14} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-700">{item.description}</div>
                                <div className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                                  <Store size={10} /> {item.subCategory || 'Não informado'} • <Calendar size={10} /> {new Date(item.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-black text-slate-800">{formatCurrency(item.amount)}</div>
                              <button 
                                onClick={() => deleteTransaction(item.id)}
                                className="text-slate-200 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-xs text-slate-400 border-2 border-dashed border-slate-50 rounded-xl">
                          Nenhum item lançado ainda.
                        </div>
                      )}
                    </div>
                  </div>

                  {order.status === MaintenanceStatus.COMPLETED && order.resultNotes && (
                    <div className="mt-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <div className="text-[10px] font-black text-emerald-600 uppercase mb-1 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Conclusão dos Serviços
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{order.resultNotes}</p>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-64 space-y-4">
                  <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <DollarSign size={64} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Custo Acumulado</div>
                      <div className="text-2xl font-black text-blue-400">{formatCurrency(costs.total)}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-bold">{costs.items.length} itens registrados</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {order.status !== MaintenanceStatus.COMPLETED ? (
                      <button 
                        onClick={() => setEditingOrder(editingOrder?.id === order.id ? null : order)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Finalizar Ordem
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateMaintenance({...order, status: MaintenanceStatus.IN_PROGRESS})}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Clock size={16} /> Reabrir Serviço
                      </button>
                    )}
                    <button 
                      onClick={() => deleteMaintenance(order.id)}
                      className="w-full py-2 text-slate-400 hover:text-rose-600 text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} /> Excluir OS Permanentemente
                    </button>
                  </div>
                </div>
              </div>

              {editingOrder?.id === order.id && (
                <div className="px-6 pb-6 border-t border-slate-100 bg-blue-50/20 p-6 animate-in slide-in-from-bottom-2">
                  <h4 className="text-xs font-black text-blue-700 uppercase mb-3 flex items-center gap-1">
                    <FileText size={14} /> Relatório de Conclusão de Manutenção
                  </h4>
                  <textarea 
                    placeholder="Descreva detalhadamente o que foi realizado, peças principais e qualquer observação para o histórico do veículo..."
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4 bg-white shadow-inner"
                    rows={4}
                    value={finishNotes}
                    onChange={e => setFinishNotes(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                     <button onClick={() => setEditingOrder(null)} className="px-6 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                     <button onClick={() => handleFinish(order)} className="px-8 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Confirmar e Encerrar OS</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {maintenances.length === 0 && (
          <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
               <Wrench size={40} />
             </div>
             <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Aguardando Ordens de Serviço</p>
             <p className="text-sm text-slate-400 mt-2">Clique em "Abrir Nova OS" para iniciar a gestão.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkshopManager;
