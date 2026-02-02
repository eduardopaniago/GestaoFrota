
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie } from 'recharts';
import { Truck, Transaction, TransactionType, Category, FuelRecord, MeasureUnit } from '../types';
import { MONTHS } from '../constants';
import { Calendar, Filter, PieChart as PieIcon, TrendingDown, TrendingUp, DollarSign, Gauge, Navigation, Info, Download } from 'lucide-react';

interface TruckReportsProps {
  trucks: Truck[];
  transactions: Transaction[];
  fuelRecords: FuelRecord[];
  categories: Category[];
}

const TruckReports: React.FC<TruckReportsProps> = ({ trucks, transactions, fuelRecords, categories }) => {
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [selectedTruckId, setSelectedTruckId] = useState<string | 'all'>('all');

  const years = useMemo(() => {
    const yearsSet = new Set([currentYear]);
    transactions.forEach(tx => yearsSet.add(new Date(tx.date).getUTCFullYear()));
    fuelRecords.forEach(fr => yearsSet.add(new Date(fr.date).getUTCFullYear()));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, fuelRecords, currentYear]);

  // Cálculo de Performance por Caminhão
  const truckPerformance = useMemo(() => {
    return trucks.map(truck => {
      const truckTxs = transactions.filter(tx => tx.truckId === truck.id && new Date(tx.date).getUTCFullYear() === filterYear);
      const truckFuel = fuelRecords.filter(fr => fr.truckId === truck.id && new Date(fr.date).getUTCFullYear() === filterYear);
      
      const revenue = truckTxs.filter(tx => tx.type === TransactionType.REVENUE).reduce((sum, tx) => sum + tx.amount, 0);
      const fixedCosts = truckTxs.filter(tx => tx.type === TransactionType.FIXED_COST).reduce((sum, tx) => sum + tx.amount, 0);
      
      // CORREÇÃO: Filtra para não somar as transações que já são oriundas de registros de combustível
      const variableExpenses = truckTxs
        .filter(tx => tx.type === TransactionType.VARIABLE_EXPENSE && !tx.fuelRecordId)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const fuelCosts = truckFuel.reduce((sum, fr) => sum + fr.cost, 0);
      
      const totalCosts = fixedCosts + variableExpenses + fuelCosts;
      const netResult = revenue - totalCosts;

      // Cálculo de KM Rodado (Odometria de Fretes)
      const totalKm = truckTxs.reduce((sum, tx) => {
        if (tx.endMileage && tx.startMileage) return sum + (tx.endMileage - tx.startMileage);
        return sum;
      }, 0);

      // Custo por KM
      const costPerKm = totalKm > 0 ? totalCosts / totalKm : 0;
      const revPerKm = totalKm > 0 ? revenue / totalKm : 0;

      // Agrupamento por Categorias para o PieChart
      const expenseByCategory: Record<string, number> = {};
      
      // Adiciona despesas normais (exceto as de combustível sincronizadas para não duplicar no gráfico)
      truckTxs.filter(tx => tx.type !== TransactionType.REVENUE && !tx.fuelRecordId).forEach(tx => {
        const cat = categories.find(c => c.id === tx.categoryId)?.name || 'Outros';
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + tx.amount;
      });
      
      // Adiciona o custo de combustível vindo diretamente dos registros de abastecimento
      if (fuelCosts > 0) {
        const fuelCatName = categories.find(c => c.name.toLowerCase().includes('combustível'))?.name || 'Combustível';
        expenseByCategory[fuelCatName] = (expenseByCategory[fuelCatName] || 0) + fuelCosts;
      }

      const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

      return {
        id: truck.id,
        plate: truck.plate,
        model: truck.model,
        revenue,
        fixed: fixedCosts,
        variable: variableExpenses,
        fuel: fuelCosts,
        totalCosts,
        netResult,
        totalKm,
        costPerKm,
        revPerKm,
        pieData
      };
    });
  }, [trucks, transactions, fuelRecords, filterYear, categories]);

  const sortedPerformance = useMemo(() => {
    return [...truckPerformance].sort((a, b) => b.netResult - a.netResult);
  }, [truckPerformance]);

  const selectedData = useMemo(() => {
    if (selectedTruckId === 'all') return null;
    return truckPerformance.find(t => t.id === selectedTruckId);
  }, [truckPerformance, selectedTruckId]);

  const fleetTotals = useMemo(() => {
    return truckPerformance.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      costs: acc.costs + curr.totalCosts,
      result: acc.result + curr.netResult
    }), { revenue: 0, costs: 0, result: 0 });
  }, [truckPerformance]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleExportCSV = () => {
    const headers = ['Placa', 'Modelo', 'Faturamento', 'Custos Fixos', 'Despesas Variaveis', 'Combustivel', 'Custo Total', 'Resultado Liquido', 'KM Rodados', 'Custo/KM'];
    const rows = sortedPerformance.map(p => [
      p.plate,
      p.model,
      p.revenue.toFixed(2),
      p.fixed.toFixed(2),
      p.variable.toFixed(2),
      p.fuel.toFixed(2),
      p.totalCosts.toFixed(2),
      p.netResult.toFixed(2),
      p.totalKm.toString(),
      p.costPerKm.toFixed(2)
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Ranking_Frota_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#2563eb', '#f43f5e', '#10b981', '#fb923c', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Filtros e Fleet Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Exercício Anual</label>
            <select className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-bold" value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="bg-blue-600 p-4 rounded-xl shadow-lg shadow-blue-100 text-white">
            <div className="text-[10px] font-black text-blue-200 uppercase">Resultado Frota ({filterYear})</div>
            <div className="text-2xl font-black">{formatCurrency(fleetTotals.result)}</div>
            <div className="text-[10px] text-blue-100 mt-1">Margem consolidada: {fleetTotals.revenue > 0 ? ((fleetTotals.result / fleetTotals.revenue) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <TrendingUp className="text-emerald-500" size={20} />
               <span className="text-[10px] font-black text-slate-400 uppercase">Faturamento Total</span>
             </div>
             <div className="text-xl font-bold text-slate-800">{formatCurrency(fleetTotals.revenue)}</div>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <TrendingDown className="text-rose-500" size={20} />
               <span className="text-[10px] font-black text-slate-400 uppercase">Despesa Operacional</span>
             </div>
             <div className="text-xl font-bold text-slate-800">{formatCurrency(fleetTotals.costs)}</div>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-start mb-2">
               <Navigation className="text-blue-500" size={20} />
               <span className="text-[10px] font-black text-slate-400 uppercase">Distância da Frota</span>
             </div>
             <div className="text-xl font-bold text-slate-800">{truckPerformance.reduce((a,b) => a + b.totalKm, 0).toLocaleString()} <span className="text-xs">KM</span></div>
           </div>
        </div>
      </div>

      {/* Tabela de Performance por Caminhão */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider">Ranking de Performance por Caminhão</h3>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all"
          >
            <Download size={14} /> Exportar Ranking
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase text-slate-500 bg-white border-b border-slate-100">
                <th className="px-6 py-4 font-black">Placa / Ativo</th>
                <th className="px-6 py-4 font-black text-right">Faturamento</th>
                <th className="px-6 py-4 font-black text-right">Custo Total</th>
                <th className="px-6 py-4 font-black text-right">Res. Líquido</th>
                <th className="px-6 py-4 font-black text-center">Custo p/ KM</th>
                <th className="px-6 py-4 font-black text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedPerformance.map(perf => (
                <tr key={perf.id} className={`hover:bg-blue-50/30 transition-colors ${selectedTruckId === perf.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-800">{perf.plate}</div>
                    <div className="text-[10px] text-slate-500">{perf.model}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">{formatCurrency(perf.revenue)}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-rose-500">{formatCurrency(perf.totalCosts)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className={`text-sm font-black ${perf.netResult >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {formatCurrency(perf.netResult)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-xs font-bold text-slate-700">{formatCurrency(perf.costPerKm)}<span className="text-[8px] text-slate-400 ml-0.5">/KM</span></div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedTruckId(selectedTruckId === perf.id ? 'all' : perf.id)}
                      className="text-[10px] font-black uppercase text-blue-600 hover:underline"
                    >
                      {selectedTruckId === perf.id ? 'Ocultar' : 'Ver Detalhes'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Visão Detalhada do Caminhão Selecionado */}
      {selectedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           <section className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-lg">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                 <Gauge size={24} />
               </div>
               <div>
                 <h4 className="text-lg font-black text-slate-800">Indicadores: {selectedData.plate}</h4>
                 <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Detalhamento Financeiro do Período</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Custo KM</div>
                  <div className="text-xl font-black text-slate-800">{formatCurrency(selectedData.costPerKm)}</div>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Receita KM</div>
                  <div className="text-xl font-black text-slate-800">{formatCurrency(selectedData.revPerKm)}</div>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Consumo Comb.</div>
                  <div className="text-xl font-black text-blue-600">{formatCurrency(selectedData.fuel)}</div>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Outras Despesas</div>
                  <div className="text-xl font-black text-rose-500">{formatCurrency(selectedData.fixed + selectedData.variable)}</div>
               </div>
             </div>

             <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                   <div className="text-[10px] font-black text-blue-600 uppercase">Resultado do Ativo</div>
                   <div className="text-2xl font-black text-blue-800">{formatCurrency(selectedData.netResult)}</div>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-black uppercase ${selectedData.netResult >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                   {selectedData.netResult >= 0 ? 'LUCRO' : 'PREJUÍZO'}
                </div>
             </div>
           </section>

           <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h4 className="font-black text-slate-700 text-xs uppercase mb-6 flex items-center gap-2">
                <PieIcon size={16} className="text-blue-500" /> Composição de Gastos
              </h4>
              <div className="flex-1 min-h-[300px] flex items-center justify-center">
                {selectedData.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {selectedData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 italic text-sm">Nenhum custo registrado para este veículo.</div>
                )}
              </div>
           </section>
        </div>
      )}

      {/* Comparativo Fleet General */}
      {selectedTruckId === 'all' && (
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-700 text-xs uppercase mb-6">Comparativo de Rentabilidade da Frota</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={truckPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="plate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={v => `R$ ${v/1000}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), '']} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Legend iconType="circle" />
                <Bar name="Receita" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Resultado Líquido" dataKey="netResult" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
};

export default TruckReports;
