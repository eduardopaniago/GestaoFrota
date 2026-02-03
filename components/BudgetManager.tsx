
import React, { useState } from 'react';
import { Plus, Trash2, Scale, ChevronRight, Check, X, DollarSign, Calendar, FileText, Store, Trophy, Search, Loader2, ExternalLink, Sparkles, ShoppingBag, Zap, Info } from 'lucide-react';
import { BudgetRequest, BudgetOption } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AISuggestion {
  title: string;
  price: number;
  link: string;
  source: string;
}

interface BudgetManagerProps {
  budgets: BudgetRequest[];
  addBudgetRequest: (req: Omit<BudgetRequest, 'id' | 'options'>) => void;
  deleteBudgetRequest: (id: string) => void;
  addOptionToRequest: (requestId: string, option: Omit<BudgetOption, 'id' | 'isSelected'>) => void;
  deleteOptionFromRequest: (requestId: string, optionId: string) => void;
  selectOption: (requestId: string, optionId: string) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ 
  budgets, 
  addBudgetRequest, 
  deleteBudgetRequest, 
  addOptionToRequest, 
  deleteOptionFromRequest,
  selectOption 
}) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  // Estados para nova solicitação de orçamento (Cabeçalho)
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqProduct, setNewReqProduct] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  
  // Estados para a cotação individual do fornecedor
  const [searchQuery, setSearchQuery] = useState('');
  const [newOptSupplier, setNewOptSupplier] = useState('');
  const [newOptAmount, setNewOptAmount] = useState('');
  const [newOptDetails, setNewOptDetails] = useState('');

  // Estados para Busca AI
  const [isSearching, setIsSearching] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  const activeRequest = budgets.find(b => b.id === selectedRequestId);

  // Ao selecionar um orçamento, resetamos a busca individual para o produto principal dele
  const handleSelectRequest = (id: string) => {
    setSelectedRequestId(id);
    const req = budgets.find(b => b.id === id);
    if (req) {
      setSearchQuery(req.productName);
      setAiSuggestions([]);
    }
  };

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqTitle || !newReqProduct) return;
    addBudgetRequest({
      title: newReqTitle,
      productName: newReqProduct,
      description: newReqDesc,
      date: new Date().toISOString()
    });
    setNewReqTitle('');
    setNewReqProduct('');
    setNewReqDesc('');
  };

  const handleSearchAI = async () => {
    const term = searchQuery || activeRequest?.productName;
    if (!term) return;
    
    setIsSearching(true);
    setAiSuggestions([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Pesquise os 3 melhores preços atuais para o produto exato "${term}" nos sites Mercado Livre Brasil e Shopee Brasil. 
      Retorne uma lista formatada estritamente como JSON com os seguintes campos: title (nome exato do produto), price (valor numérico apenas), link (url direta), source (Mercado Livre ou Shopee). 
      Foque em resultados reais do Brasil.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAiSuggestions(parsed);
        }
      } catch (e) {
        console.error("Erro ao processar JSON da IA", e);
      }
    } catch (error) {
      console.error("Erro na busca AI:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const useAISuggestion = (suggestion: AISuggestion) => {
    setNewOptSupplier(suggestion.source);
    setNewOptAmount(suggestion.price.toString());
    setNewOptDetails(`Produto: ${suggestion.title}\nLink: ${suggestion.link}`);
    setAiSuggestions([]);
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId || !newOptSupplier || !newOptAmount) return;
    addOptionToRequest(selectedRequestId, {
      supplier: newOptSupplier,
      amount: parseFloat(newOptAmount),
      details: newOptDetails,
      date: new Date().toISOString()
    });
    setNewOptSupplier('');
    setNewOptAmount('');
    setNewOptDetails('');
    setAiSuggestions([]);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getLowestPriceOptionId = (options: BudgetOption[]) => {
    if (options.length === 0) return null;
    return options.reduce((prev, curr) => prev.amount < curr.amount ? prev : curr).id;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Lista de Solicitações */}
        <div className="lg:col-span-1 space-y-4">
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="text-blue-600" size={20} /> Solicitar Cotação
            </h2>
            <form onSubmit={handleAddRequest} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Título do Serviço</label>
                <input 
                  placeholder="Ex: Troca de Pneus Dianteiros"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={newReqTitle}
                  onChange={e => setNewReqTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Produto Principal</label>
                <div className="relative">
                  <ShoppingBag className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                    placeholder="Ex: Pneu 295/80 R22.5"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50/50"
                    value={newReqProduct}
                    onChange={e => setNewReqProduct(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-slate-100">
                Iniciar Orçamento
              </button>
            </form>
          </section>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Histórico de Cotações</h3>
            {budgets.length === 0 && <p className="text-slate-400 italic text-sm px-2 py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">Nenhuma cotação ativa.</p>}
            {[...budgets].reverse().map(req => (
              <div 
                key={req.id} 
                onClick={() => handleSelectRequest(req.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center group ${
                  selectedRequestId === req.id 
                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100' 
                    : 'bg-white border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="min-w-0">
                  <div className={`font-bold truncate text-sm ${selectedRequestId === req.id ? 'text-white' : 'text-slate-700'}`}>
                    {req.title}
                  </div>
                  <div className={`text-[10px] font-bold truncate flex items-center gap-1 mt-0.5 ${selectedRequestId === req.id ? 'text-blue-100' : 'text-slate-400'}`}>
                    <ShoppingBag size={10} /> {req.productName}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); deleteBudgetRequest(req.id); if(selectedRequestId === req.id) setSelectedRequestId(null); }}
                    className={`p-2 rounded-lg transition-colors ${selectedRequestId === req.id ? 'text-blue-200 hover:bg-white/10' : 'text-slate-300 hover:text-rose-600'}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} className={selectedRequestId === req.id ? 'text-white' : 'text-slate-300'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lado Direito: Comparativo Individualizado */}
        <div className="lg:col-span-2 space-y-6">
          {activeRequest ? (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Scale size={120} />
                </div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{activeRequest.title}</h2>
                    <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-xl w-fit mt-3 border border-blue-100">
                       <ShoppingBag size={18} /> {activeRequest.productName}
                    </div>
                  </div>
                  <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Status: Em Análise
                  </div>
                </div>

                {/* Área de Pesquisa IA Individualizada para CADA entrada */}
                <div className="mt-10 pt-10 border-t border-slate-100 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pesquisa Individual por Produto (Melhores Preços)</label>
                      <div className="relative group">
                        <input 
                          type="text"
                          placeholder="Digite o nome específico para buscar na internet..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-blue-50 bg-blue-50/20 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-3 top-3.5 text-blue-400" size={18} />
                      </div>
                    </div>
                    <button 
                      onClick={handleSearchAI}
                      disabled={isSearching}
                      className="h-[46px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isSearching ? 'Buscando...' : 'Sugerir Preços (IA)'}
                    </button>
                  </div>

                  {/* Resultados da Busca IA */}
                  {aiSuggestions.length > 0 && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in slide-in-from-top-4">
                      {aiSuggestions.map((sug, i) => (
                        <div key={i} className="bg-emerald-50/30 border-2 border-emerald-100 p-4 rounded-2xl flex flex-col justify-between group hover:border-emerald-500 transition-all">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{sug.source}</span>
                               <a href={sug.link} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-blue-600"><ExternalLink size={14} /></a>
                            </div>
                            <div className="text-xs font-bold text-slate-700 line-clamp-2 leading-relaxed">{sug.title}</div>
                            <div className="text-xl font-black text-emerald-700 mt-2">{formatCurrency(sug.price)}</div>
                          </div>
                          <button 
                            onClick={() => useAISuggestion(sug)}
                            className="mt-4 w-full py-2 bg-white text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            Usar esta Sugestão
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulário de Inserção de Cotação de Fornecedor */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-4">Novo Registro de Cotação Individual</div>
                    <form onSubmit={handleAddOption} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <input 
                          placeholder="Fornecedor / Loja"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                          value={newOptSupplier}
                          onChange={e => setNewOptSupplier(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="Valor R$"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={newOptAmount}
                          onChange={e => setNewOptAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div className="md:row-span-2">
                        <textarea 
                          placeholder="Detalhes (Entrega, Frete, Garantia)"
                          className="w-full h-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                          value={newOptDetails}
                          onChange={e => setNewOptDetails(e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl transition-all text-sm shadow-md">
                          Salvar Cotação Individual
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Grid de Resultados das Cotações Salvas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRequest.options.map(opt => {
                  const isLowest = opt.id === getLowestPriceOptionId(activeRequest.options);
                  return (
                    <div 
                      key={opt.id} 
                      className={`relative bg-white p-6 rounded-2xl border-2 transition-all ${
                        opt.isSelected 
                          ? 'border-emerald-500 bg-emerald-50/30' 
                          : isLowest ? 'border-blue-200 shadow-xl shadow-blue-50/50' : 'border-slate-100'
                      }`}
                    >
                      {isLowest && !opt.isSelected && (
                        <div className="absolute -top-3 left-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Trophy size={10} /> MELHOR CUSTO-BENEFÍCIO
                        </div>
                      )}
                      {opt.isSelected && (
                        <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Check size={10} /> OPÇÃO ESCOLHIDA
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase mb-1">
                             <Store size={14} /> Fornecedor
                          </div>
                          <h4 className="font-black text-xl text-slate-800 uppercase">
                            {opt.supplier}
                          </h4>
                        </div>
                        <button 
                          onClick={() => deleteOptionFromRequest(activeRequest.id, opt.id)}
                          className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-8">
                         <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Observações da Cotação</div>
                         <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{opt.details || 'Nenhuma especificação detalhada.'}</p>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <div className="text-3xl font-black text-slate-900">
                          {formatCurrency(opt.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Preço Unitário</div>
                      </div>

                      <button 
                        onClick={() => selectOption(activeRequest.id, opt.id)}
                        className={`w-full font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                          opt.isSelected 
                            ? 'bg-emerald-600 text-white shadow-emerald-100 shadow-xl' 
                            : 'bg-slate-900 text-white hover:bg-black'
                        }`}
                      >
                        {opt.isSelected ? <><CheckCircle2 size={18} /> Aprovado para Compra</> : 'Aprovar este Orçamento'}
                      </button>
                    </div>
                  );
                })}
                {activeRequest.options.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                       <Scale size={32} />
                    </div>
                    <p className="font-bold">Aguardando cotações de fornecedores.</p>
                    <p className="text-sm mt-1">Utilize a busca IA acima para obter referências de mercado.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center">
              <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Scale size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Gestão Inteligente de Compras</h3>
              <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                Selecione uma solicitação lateral para comparar preços entre fornecedores locais e sugestões automatizadas do Mercado Livre e Shopee.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar apenas para tipagem/ícone que faltava no escopo anterior
const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default BudgetManager;
