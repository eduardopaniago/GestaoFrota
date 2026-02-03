
import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, Navigation, Weight, Percent, TrendingUp, Info, FileText, Share2, Box, Truck as TruckIcon, CheckCircle2, Ruler, ArrowRightLeft } from 'lucide-react';
import { CargoTypeCategory, MeasureUnit, Truck, Transaction, Category, TransactionType, View } from '../types';

interface ClientQuoteManagerProps {
  cargoTypes: CargoTypeCategory[];
  trucks: Truck[];
  categories: Category[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  setView: (view: View) => void;
}

const ClientQuoteManager: React.FC<ClientQuoteManagerProps> = ({ cargoTypes, trucks, categories, addTransaction, setView }) => {
  const [calcMode, setCalcMode] = useState<'TON' | 'M3'>('TON');
  
  const [formData, setFormData] = useState({
    clientName: '',
    truckId: '',
    fuelPrice: '',
    distance: '',
    loadAmount: '',
    unitPrice: '', // Preço por Ton ou Preço por KM/m³
    otherExpenses: '',
  });

  const [saved, setSaved] = useState(false);

  const calculations = useMemo(() => {
    const fuelPrice = parseFloat(formData.fuelPrice) || 0;
    const distance = parseFloat(formData.distance) || 0;
    const loadAmount = parseFloat(formData.loadAmount) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const otherExpenses = parseFloat(formData.otherExpenses) || 0;

    // Cálculo do Faturamento Bruto (Novas Fórmulas)
    let suggestedFreight = 0;
    if (calcMode === 'M3') {
      // Fórmula m³: KM * M³ * VALOR DO KM
      suggestedFreight = distance * loadAmount * unitPrice;
    } else {
      // Fórmula Tonelada: Valor da Tonelada * Quantidade
      suggestedFreight = unitPrice * loadAmount;
    }

    // Cálculo de Custos
    const consumptionKmPerLiter = 2.0;
    const litersNeeded = distance / consumptionKmPerLiter;
    const fuelCost = litersNeeded * fuelPrice;
    const totalCost = fuelCost + otherExpenses;

    // Resultados de Rentabilidade
    const profitAmount = suggestedFreight - totalCost;
    const profitMargin = suggestedFreight > 0 ? (profitAmount / suggestedFreight) * 100 : 0;
    
    const costPerKm = distance > 0 ? totalCost / distance : 0;
    const revenuePerKm = distance > 0 ? suggestedFreight / distance : 0;

    return {
      litersNeeded,
      fuelCost,
      totalCost,
      suggestedFreight,
      profitAmount,
      profitMargin,
      costPerKm,
      revenuePerKm,
      distance,
      loadAmount,
      unitPrice
    };
  }, [formData, calcMode]);

  const handleSaveAsFreight = () => {
    if (!formData.truckId || !formData.distance || !formData.loadAmount || !formData.unitPrice) {
      alert("Preencha os dados do veículo, distância, carga e preço unitário.");
      return;
    }

    const freightCategory = categories.find(c => c.name.toLowerCase().includes('frete')) || categories[0];
    const todayStr = new Date().toISOString().split('T')[0];

    addTransaction({
      date: todayStr,
      executionDate: todayStr,
      isPaid: true,
      amount: calculations.suggestedFreight,
      description: `Frete: ${formData.clientName || 'Cliente Direto'} (${calcMode === 'TON' ? 'Por Ton' : 'Por m³'})`,
      subCategory: formData.clientName,
      categoryId: freightCategory.id,
      type: TransactionType.REVENUE,
      truckId: formData.truckId,
      weight: calcMode === 'TON' ? parseFloat(formData.loadAmount) : undefined,
      volume: calcMode === 'M3' ? parseFloat(formData.loadAmount) : undefined,
      startMileage: 0, 
      endMileage: parseFloat(formData.distance)
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setView('TRANSACTIONS');
    }, 2000);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Seletor de Modo de Cálculo */}
      <div className="flex bg-white p-2 rounded-2xl border border-slate-200 w-fit mx-auto shadow-sm gap-2">
        <button 
          onClick={() => setCalcMode('TON')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${calcMode === 'TON' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Weight size={18} /> POR TONELADA
        </button>
        <button 
          onClick={() => setCalcMode('M3')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${calcMode === 'M3' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Box size={18} /> POR METRO CÚBICO (m³)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${calcMode === 'TON' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <Calculator size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Parâmetros do Cálculo</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Fórmula: {calcMode === 'TON' ? 'Peso * Valor Tonelada' : 'Distância * Volume * Valor KM/m³'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Cliente / Destinatário</label>
                <input 
                  type="text"
                  placeholder="Nome do cliente"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Caminhão Alocado</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                  value={formData.truckId}
                  onChange={e => setFormData({...formData, truckId: e.target.value})}
                >
                  <option value="">Selecione o veículo...</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <DollarSign size={10} /> Diesel (R$/L)
                </label>
                <input 
                  type="number"
                  step="0.001"
                  placeholder="5.89"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.fuelPrice}
                  onChange={e => setFormData({...formData, fuelPrice: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <Navigation size={10} /> Distância (KM)
                </label>
                <input 
                  type="number"
                  placeholder="450"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.distance}
                  onChange={e => setFormData({...formData, distance: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                  {calcMode === 'TON' ? <Weight size={10} /> : <Box size={10} />}
                  Qtd ({calcMode === 'TON' ? 'Ton' : 'm³'})
                </label>
                <input 
                  type="number"
                  placeholder={calcMode === 'TON' ? "Ex: 32" : "Ex: 18"}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.loadAmount}
                  onChange={e => setFormData({...formData, loadAmount: e.target.value})}
                />
              </div>
              <div>
                <label className={`block text-[10px] font-black uppercase mb-1 flex items-center gap-1 ${calcMode === 'TON' ? 'text-blue-600' : 'text-indigo-600'}`}>
                   {calcMode === 'TON' ? <DollarSign size={10} /> : <Ruler size={10} />}
                   {calcMode === 'TON' ? 'Valor por Tonelada' : 'Valor do KM por m³'}
                </label>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 outline-none text-sm font-black ${calcMode === 'TON' ? 'border-blue-50 focus:border-blue-500' : 'border-indigo-50 focus:border-indigo-500'}`}
                  value={formData.unitPrice}
                  onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Outros Custos Operacionais (R$)</label>
              <input 
                type="number"
                placeholder="Pedágios, estadias, etc..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.otherExpenses}
                onChange={e => setFormData({...formData, otherExpenses: e.target.value})}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <Info className="text-blue-500 mt-0.5 shrink-0" size={16} />
            <div className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase">
              <strong>Média Padrão:</strong> 2,0 KM/L. <br/>
              <strong>Faturamento Bruto:</strong> {calcMode === 'TON' ? 'Quantidade Ton * Preço Ton' : 'Distância * Volume * Valor KM/m³'}.
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className={`${calcMode === 'TON' ? 'bg-slate-900' : 'bg-slate-900'} text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              {calcMode === 'TON' ? <Weight size={160} /> : <Box size={160} />}
            </div>

            <div className="relative z-10">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6">Faturamento Bruto Calculado</h3>
              <div className="text-5xl font-black mb-2">
                {formatCurrency(calculations.suggestedFreight)}
              </div>
              <div className="flex items-center gap-4 text-slate-400 text-sm font-bold">
                 <span>Lucro Previsto: <span className={calculations.profitAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(calculations.profitAmount)}</span></span>
                 <span>•</span>
                 <span>Margem: {calculations.profitMargin.toFixed(1)}%</span>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Custo Total da Viagem</div>
                  <div className="text-lg font-bold">{formatCurrency(calculations.totalCost)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Combustível Necessário</div>
                  <div className="text-lg font-bold">{calculations.litersNeeded.toFixed(1)} L</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
               <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Performance Financeira</div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold">Custo por KM</span>
                    <span className="text-sm font-black text-slate-700">{formatCurrency(calculations.costPerKm)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold">Receita por KM</span>
                    <span className="text-sm font-black text-blue-600">{formatCurrency(calculations.revenuePerKm)}</span>
                  </div>
               </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-center">
               <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Resumo da Carga</div>
               <div className="text-xl font-black text-slate-800">
                 {formData.loadAmount || '0'} {calcMode === 'TON' ? 'Toneladas' : 'm³'}
               </div>
               <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                 Distância: {formData.distance || '0'} KM
               </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleSaveAsFreight}
              disabled={saved}
              className={`flex-1 ${saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100`}
            >
              {saved ? (
                <><CheckCircle2 size={20} /> Frete Lançado!</>
              ) : (
                <><TruckIcon size={20} /> Confirmar e Lançar Frete</>
              )}
            </button>
            <button className="px-6 bg-white border border-slate-200 hover:border-blue-500 text-slate-500 hover:text-blue-500 rounded-2xl transition-all shadow-sm flex items-center justify-center">
               <Share2 size={20} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ClientQuoteManager;
