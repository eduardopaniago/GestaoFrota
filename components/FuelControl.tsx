
import React, { useState, useMemo, useEffect } from 'react';
import { Fuel, Plus, Trash2, Calendar, Gauge, Droplets, DollarSign, Download } from 'lucide-react';
import { FuelRecord, Truck } from '../types';

interface FuelControlProps {
  trucks: Truck[];
  fuelRecords: FuelRecord[];
  addFuelRecord: (record: Omit<FuelRecord, 'id'>) => void;
  deleteFuelRecord: (id: string) => void;
}

const FuelControl: React.FC<FuelControlProps> = ({ trucks, fuelRecords, addFuelRecord, deleteFuelRecord }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    truckId: '',
    mileage: '',
    liters: '',
    pricePerLiter: '',
    cost: '',
  });

  // Auto-calculate cost when liters or price per liter changes
  useEffect(() => {
    const l = parseFloat(formData.liters);
    const p = parseFloat(formData.pricePerLiter);
    if (!isNaN(l) && !isNaN(p)) {
      setFormData(prev => ({ ...prev, cost: (l * p).toFixed(2) }));
    }
  }, [formData.liters, formData.pricePerLiter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.truckId || !formData.mileage || !formData.liters || !formData.cost || !formData.pricePerLiter) return;

    addFuelRecord({
      date: formData.date,
      truckId: formData.truckId,
      mileage: parseFloat(formData.mileage),
      liters: parseFloat(formData.liters),
      pricePerLiter: parseFloat(formData.pricePerLiter),
      cost: parseFloat(formData.cost),
    });

    setFormData(prev => ({ ...prev, mileage: '', liters: '', pricePerLiter: '', cost: '' }));
  };

  const consumptionStats = useMemo(() => {
    const stats: Record<string, { totalKm: number, totalLiters: number, avg: number }> = {};
    
    trucks.forEach(truck => {
      const records = fuelRecords
        .filter(r => r.truckId === truck.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (records.length < 2) {
        stats[truck.id] = { totalKm: 0, totalLiters: 0, avg: 0 };
        return;
      }

      const kmTraveled = records[records.length - 1].mileage - records[0].mileage;
      const totalLiters = records.slice(1).reduce((acc, r) => acc + r.liters, 0);
      
      stats[truck.id] = {
        totalKm: kmTraveled,
        totalLiters: totalLiters,
        avg: totalLiters > 0 ? kmTraveled / totalLiters : 0
      };
    });
    return stats;
  }, [trucks, fuelRecords]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleExportCSV = () => {
    const headers = ['Data', 'Placa', 'KM Atual', 'Litros', 'Preco/L', 'Custo Total'];
    const rows = fuelRecords.map(rec => {
      const truck = trucks.find(t => t.id === rec.truckId);
      return [
        new Date(rec.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        truck?.plate || 'Excluido',
        rec.mileage.toString(),
        rec.liters.toFixed(2),
        rec.pricePerLiter.toFixed(3),
        rec.cost.toFixed(2)
      ];
    });

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Abastecimentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit sticky top-24">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Fuel className="text-blue-600" /> Registrar Abastecimento
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Calendar size={14}/> Data</label>
              <input type="date" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Caminhão</label>
              <select required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.truckId} onChange={e => setFormData({...formData, truckId: e.target.value})}>
                <option value="">Selecione...</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Gauge size={14}/> KM Atual do Veículo</label>
              <input type="number" step="0.1" required placeholder="Ex: 154000.5" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Droplets size={14}/> Qtd (Litros)</label>
                <input type="number" step="0.01" required placeholder="0,00" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.liters} onChange={e => setFormData({...formData, liters: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><DollarSign size={14}/> R$ por Litro</label>
                <input type="number" step="0.001" required placeholder="0,000" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.pricePerLiter} onChange={e => setFormData({...formData, pricePerLiter: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><DollarSign size={14}/> Custo Total (Automático)</label>
              <input type="number" step="0.01" required placeholder="0,00" className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 font-bold text-blue-600 outline-none" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition-all active:scale-95">Registrar</button>
          </form>
        </section>

        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700">Consumo Médio por Caminhão</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trucks.map(truck => (
                <div key={truck.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">{truck.plate}</span>
                    <span className="text-xs text-slate-500 font-medium">{truck.model}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-blue-600">
                      {consumptionStats[truck.id]?.avg > 0 ? consumptionStats[truck.id].avg.toFixed(2) : '--'}
                    </span>
                    <span className="text-sm font-bold text-slate-400 pb-1">KM/L</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Últimos Abastecimentos</h3>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                <Download size={14} /> Exportar CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase text-slate-400 bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-3 font-bold">Data</th>
                    <th className="px-6 py-3 font-bold">Caminhão</th>
                    <th className="px-6 py-3 font-bold">KM Atual</th>
                    <th className="px-6 py-3 font-bold">Litros / R$ L</th>
                    <th className="px-6 py-3 font-bold">Custo</th>
                    <th className="px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...fuelRecords].reverse().map(rec => {
                    const truck = trucks.find(t => t.id === rec.truckId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(rec.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        <td className="px-6 py-4 text-sm font-bold">{truck?.plate || 'Excluído'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{rec.mileage.toLocaleString()} km</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div>{rec.liters.toFixed(2)} L</div>
                          <div className="text-[10px] text-slate-400">{formatCurrency(rec.pricePerLiter)}/L</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-600">{formatCurrency(rec.cost)}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => deleteFuelRecord(rec.id)} className="text-slate-300 hover:text-rose-600 p-1 rounded-lg"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FuelControl;
