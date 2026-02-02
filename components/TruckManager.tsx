
import React, { useState } from 'react';
import { Plus, Trash2, Truck } from 'lucide-react';
import { Truck as TruckType } from '../types';

interface TruckManagerProps {
  trucks: TruckType[];
  addTruck: (truck: Omit<TruckType, 'id'>) => void;
  deleteTruck: (id: string) => void;
}

const TruckManager: React.FC<TruckManagerProps> = ({ trucks, addTruck, deleteTruck }) => {
  const [formData, setFormData] = useState({ plate: '', model: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate.trim() || !formData.model.trim()) return;
    addTruck(formData);
    setFormData({ plate: '', model: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
           <Truck className="text-blue-600" /> Cadastrar Novo Veículo
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Placa (ex: ABC-1234)"
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.plate}
            onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
          />
          <input
            type="text"
            placeholder="Modelo (ex: Volvo FH 540)"
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.model}
            onChange={e => setFormData({ ...formData, model: e.target.value })}
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
            <Plus size={20} /> Adicionar
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trucks.map(truck => (
          <div key={truck.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group">
            <div>
              <div className="text-xl font-black text-slate-800">{truck.plate}</div>
              <div className="text-sm font-medium text-slate-500">{truck.model}</div>
            </div>
            <button onClick={() => deleteTruck(truck.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        {trucks.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 italic">
            Nenhum veículo cadastrado na frota.
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckManager;
