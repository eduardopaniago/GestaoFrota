
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, 
  AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, Calendar, Download, 
  BarChart3, Activity, ArrowUpRight, ArrowDownRight, Clock, Landmark
} from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { MONTHS } from '../constants';

interface DREDashboardProps {
  transactions: Transaction[];
  categories: Category[];
}

const DREDashboard: React.FC<DREDashboardProps> = ({ transactions, categories }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(currentMonth);

  const years = useMemo(() => {
    const yearsSet = new Set([currentYear]);
    transactions.forEach(tx => yearsSet.add(new Date(tx.date).getUTCFullYear()));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      const yearMatch = d.getUTCFullYear() === filterYear;
      const monthMatch = filterMonth === 'all' || d.getUTCMonth() === filterMonth;
      return yearMatch && monthMatch;
    });
  }, [transactions, filterYear, filterMonth]);

  const dre = useMemo(() => {
    // Apenas dados realizados (pagos)
    const realizedData = filteredData.filter(tx => tx.isPaid);
    // Dados pendentes
    const pendingData = filteredData.filter(tx => !tx.isPaid);

    const revenue = realizedData.filter(tx => tx.type === TransactionType.REVENUE).reduce((sum, tx) => sum + tx.amount, 0);
    const fixedCosts = realizedData.filter(tx => tx.type === TransactionType.FIXED_COST).reduce((sum, tx) => sum + tx.amount, 0);
    const variableExpenses = realizedData.filter(tx => tx.type === TransactionType.VARIABLE_EXPENSE).reduce((sum, tx) => sum + tx.amount, 0);

    const pendingRevenue = pendingData.filter(tx => tx.type === TransactionType.REVENUE).reduce((sum, tx) => sum + tx.amount, 0);
    const pendingExpenses = pendingData.filter(tx => tx.type !== TransactionType.REVENUE).reduce((sum, tx) => sum + tx.amount, 0);

    const grossProfit = revenue - fixedCosts;
    const netProfit = grossProfit - variableExpenses;

    return {
      revenue,
      fixedCosts,
      grossProfit,
      variableExpenses,
      netProfit,
      pendingRevenue,
      pendingExpenses,
      profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0
    };
  }, [filteredData]);

  // Dados para o gráfico de tendência (mensal) - Apenas Realizados para o Lucro
  const monthlyTrendData = useMemo(() => {
    return MONTHS.map((monthName, index) => {
      const monthTxs = transactions.filter(tx => {
        const d = new Date(tx.date);
        return d.getUTCFullYear() === filterYear && d.getUTCMonth() === index;
      });

      const rev = monthTxs.filter(tx => tx.type === TransactionType.REVENUE && tx.isPaid).reduce((sum, tx) => sum + tx.amount, 0);
      const exp = monthTxs.filter(tx => tx.type !== TransactionType.REVENUE && tx.isPaid).reduce((sum, tx) => sum + tx.amount, 0);
      const profit = rev - exp;

      return {
        name: monthName.substring(0, 3),
        Receitas: rev,
        Despesas: exp,
        Lucro: profit
      };
    });
  }, [transactions, filterYear]);

  const chartData = [
    { name: 'Receita Realizada', valor: dre.revenue, color: '#10b981' },
    { name: 'Custos Fixos', valor: dre.fixedCosts, color: '#64748b' },
    { name: 'Desp. Variáveis', valor: dre.variableExpenses, color: '#f43f5e' },
    { name: 'Lucro Líquido', valor: dre.netProfit, color: dre.netProfit >= 0 ? '#2563eb' : '#fb923c' },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleExportCSV = () => {
    const periodStr = filterMonth === 'all' ? `Ano_${filterYear}` : `${MONTHS[filterMonth]}_${filterYear}`;
    const rows = [
      ['RELATORIO DRE - FROTAFIN'],
      ['Periodo', periodStr],
      ['Data de Exportacao', new Date().toLocaleDateString()],
      [''],
      ['Descricao', 'Valor'],
      ['RECEITA BRUTA REALIZADA', dre.revenue.toFixed(2)],
      ['(-) CUSTOS FIXOS REALIZADOS', dre.fixedCosts.toFixed(2)],
      ['(=) LUCRO BRUTO REALIZADO', dre.grossProfit.toFixed(2)],
      ['(-) DESPESAS VARIAVEIS REALIZADAS', dre.variableExpenses.toFixed(2)],
      ['(=) LUCRO / PREJUIZO LIQUIDO', dre.netProfit.toFixed(2)],
      ['Margem de Lucro (%)', dre.profitMargin.toFixed(2) + '%'],
      [''],
      ['PENDENCIAS (NAO INCLUSAS NO LUCRO)'],
      ['A RECEBER', dre.pendingRevenue.toFixed(2)],
      ['A PAGAR', dre.pendingExpenses.toFixed(2)],
      [''],
      ['DETALHAMENTO POR CATEGORIA (REALIZADO)'],
    ];

    categories.forEach(cat => {
      const total = filteredData.filter(tx => tx.categoryId === cat.id && tx.isPaid).reduce((s, t) => s + t.amount, 0);
      if (total > 0) {
        rows.push([cat.name, total.toFixed(2)]);
      }
    });

    const csvContent = "\uFEFF" + rows.map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `DRE_Realizado_${periodStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500 pb-20">
      {/* Filtros Estratégicos */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
            <Calendar size={16} className="text-blue-500" /> Parâmetros de Visão
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setFilterMonth('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${filterMonth === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Ano Inteiro
            </button>
            <select 
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase outline-none transition-all ${filterMonth !== 'all' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-slate-500'}`}
              value={filterMonth === 'all' ? '' : filterMonth}
              onChange={(e) => setFilterMonth(e.target.value === '' ? 'all' : parseInt(e.target.value))}
            >
              <option value="" disabled>Selecionar Mês</option>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <select 
            className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-xs font-black uppercase"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-slate-200"
        >
          <Download size={16} /> Exportar Relatório
        </button>
      </div>

      {/* Cards de Pendências Financeiras (O que não entrou no Lucro) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-emerald-100 flex items-center justify-between group hover:border-emerald-300 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Landmark size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a Receber</div>
              <div className="text-2xl font-black text-emerald-700">{formatCurrency(dre.pendingRevenue)}</div>
            </div>
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-emerald-400 uppercase text-right">
            Lançamentos<br/>não liquidados
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-rose-100 flex items-center justify-between group hover:border-rose-300 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</div>
              <div className="text-2xl font-black text-rose-700">{formatCurrency(dre.pendingExpenses)}</div>
            </div>
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-rose-400 uppercase text-right">
            Contas<br/>aguardando pgto
          </div>
        </div>
      </div>

      {/* Cards de Resumo Realizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Receita Realizada', val: dre.revenue, icon: TrendingUp, color: 'emerald', sub: 'Dinheiro em caixa' },
          { label: 'Custos Fixos (Pg)', val: dre.fixedCosts, icon: Wallet, color: 'slate', sub: 'Despesas liquidadas' },
          { label: 'Desp. Var. (Pg)', val: dre.variableExpenses, icon: TrendingDown, color: 'rose', sub: 'Pagamentos realizados' },
          { label: 'Lucro Líquido Real', val: dre.netProfit, icon: Activity, color: dre.netProfit >= 0 ? 'blue' : 'orange', sub: `Margem: ${dre.profitMargin.toFixed(1)}%` },
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 bg-${card.color}-50 text-${card.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center text-[10px] font-black uppercase px-2 py-1 rounded-lg ${dre.netProfit >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {dre.netProfit >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} OK
              </div>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(card.val)}</div>
            <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Dashboards Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* DRE Tabela Detalhada */}
        <section className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">DRE Realizado (Caixa)</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{filterMonth === 'all' ? 'Exercício Anual' : MONTHS[filterMonth]} {filterYear}</p>
            </div>
            <PieChart size={20} className="text-blue-500" />
          </div>
          <div className="p-8 flex-1 space-y-5">
            <div className="flex justify-between items-center group">
              <span className="text-slate-500 text-xs font-black uppercase tracking-tighter group-hover:text-blue-600 transition-colors">1. Receita Bruta Realizada</span>
              <span className="text-emerald-600 font-black text-lg">{formatCurrency(dre.revenue)}</span>
            </div>
            <div className="flex justify-between items-center pl-4 border-l-2 border-slate-100">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">(-) Custos Fixos Pagos</span>
              <span className="text-slate-600 font-bold text-sm">{formatCurrency(dre.fixedCosts)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-800 text-xs font-black uppercase tracking-tighter">2. Lucro Bruto Realizado</span>
              <span className={`font-black ${dre.grossProfit >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                {formatCurrency(dre.grossProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center pl-4 border-l-2 border-slate-100">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">(-) Despesas Var. Pagas</span>
              <span className="text-slate-600 font-bold text-sm">{formatCurrency(dre.variableExpenses)}</span>
            </div>
            
            <div className="pt-4 mt-2 space-y-2 border-t border-slate-100">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase italic">A Receber (Pendentes)</span>
                <span className="text-emerald-500 text-xs font-bold">{formatCurrency(dre.pendingRevenue)}</span>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase italic">A Pagar (Pendentes)</span>
                <span className="text-rose-500 text-xs font-bold">{formatCurrency(dre.pendingExpenses)}</span>
              </div>
            </div>

            <div className="pt-4 mt-2">
              <div className={`flex justify-between items-center p-5 rounded-3xl ${dre.netProfit >= 0 ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-rose-600 shadow-lg shadow-rose-100'}`}>
                <span className="text-white text-xs font-black uppercase tracking-widest">Lucro Líquido Real</span>
                <span className="text-white font-black text-xl">{formatCurrency(dre.netProfit)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Gráficos de Visualização */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gráfico de Tendência Mensal */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-500" /> Histórico de Caixa ({filterYear})
              </h3>
              <div className="flex gap-4 text-[10px] font-black uppercase text-slate-400">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receitas Realizadas</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Despesas Pagas</div>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px'}}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="Receitas" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                  <Area type="monotone" dataKey="Despesas" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Comparativo de Estrutura de Custos Pagos */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
              <PieChart size={16} className="text-blue-500" /> Estrutura Realizada
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="valor" radius={[0, 10, 10, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DREDashboard;
