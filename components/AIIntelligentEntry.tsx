
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Loader2, CheckCircle2, AlertCircle, Send, 
  Truck as TruckIcon, Fuel, Package, User, Gauge, 
  DollarSign, Calendar, ArrowRight, Info, MessageSquare,
  Mic, MicOff, Volume2, Edit3
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Truck, CargoTypeCategory, TransactionType, MeasureUnit, FuelRecord, Transaction } from '../types';

interface AIIntelligentEntryProps {
  categories: Category[];
  trucks: Truck[];
  cargoTypes: CargoTypeCategory[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  addFuelRecord: (rec: Omit<FuelRecord, 'id'>) => void;
}

interface AIParsedData {
  isComplete: boolean;
  aiFeedback?: string;
  type?: 'fuel' | 'freight' | 'general';
  amount?: number;
  description?: string;
  date?: string;
  truckPlate?: string;
  mileage?: number;
  liters?: number;
  pricePerLiter?: number;
  client?: string;
  cargoTypeName?: string;
  startKm?: number;
  endKm?: number;
  weight?: number;
  volume?: number;
  categoryName?: string;
}

const AIIntelligentEntry: React.FC<AIIntelligentEntryProps> = ({ categories, trucks, cargoTypes, addTransaction, addFuelRecord }) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<AIParsedData | null>(null);
  const [editableData, setEditableData] = useState<AIParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [conversationContext, setConversationContext] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Inicializa Web Speech API se disponível
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputText(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const analyzeText = async () => {
    if (!inputText.trim()) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccess(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const fullPrompt = conversationContext 
        ? `Contexto anterior: ${conversationContext}\nNova informação do usuário: ${inputText}`
        : inputText;

      const systemPrompt = `Você é um assistente de gestão de frotas. 
      Sua tarefa é converter texto natural em dados estruturados JSON.
      
      Categorias: ${categories.map(c => c.name).join(', ')}
      Caminhões (placas): ${trucks.map(t => t.plate).join(', ')}
      Cargas: ${cargoTypes.map(ct => ct.name).join(', ')}
      
      REGRAS CRÍTICAS:
      1. Se o usuário fornecer informações parciais, tente extrair o máximo.
      2. Se faltarem dados essenciais (Valor, Placa, Categoria, ou KM em caso de combustível), defina "isComplete" como false.
      3. No campo "aiFeedback", escreva uma pergunta amigável e curta pedindo o que falta.
      4. Se tudo estiver presente, defina "isComplete" as true.
      5. Formato de data: YYYY-MM-DD. Hoje é ${new Date().toISOString().split('T')[0]}.
      RETORNE APENAS JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isComplete: { type: Type.BOOLEAN },
              aiFeedback: { type: Type.STRING },
              type: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              description: { type: Type.STRING },
              date: { type: Type.STRING },
              truckPlate: { type: Type.STRING },
              mileage: { type: Type.NUMBER },
              liters: { type: Type.NUMBER },
              pricePerLiter: { type: Type.NUMBER },
              client: { type: Type.STRING },
              cargoTypeName: { type: Type.STRING },
              startKm: { type: Type.NUMBER },
              endKm: { type: Type.NUMBER },
              weight: { type: Type.NUMBER },
              volume: { type: Type.NUMBER },
              categoryName: { type: Type.STRING }
            },
            required: ["isComplete"]
          }
        },
      });

      const result = JSON.parse(response.text || '{}');
      setParsedData(result);
      if (result.isComplete) {
        setEditableData(result);
      }
      
      if (!result.isComplete) {
        setConversationContext(JSON.stringify(result));
        setInputText(''); 
      }
    } catch (err) {
      console.error(err);
      setError("Houve um problema técnico na análise. Tente descrever o lançamento de outra forma.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!editableData) return;

    const truck = trucks.find(t => t.plate.replace('-', '').toLowerCase() === editableData.truckPlate?.replace('-', '').toLowerCase());
    const category = categories.find(c => c.name.toLowerCase() === editableData.categoryName?.toLowerCase());
    const cargoType = cargoTypes.find(ct => ct.name.toLowerCase() === editableData.cargoTypeName?.toLowerCase());

    if (editableData.type === 'fuel') {
      addFuelRecord({
        date: editableData.date || new Date().toISOString().split('T')[0],
        truckId: truck?.id || trucks[0]?.id,
        mileage: editableData.mileage || 0,
        liters: editableData.liters || 0,
        pricePerLiter: editableData.pricePerLiter || 0,
        cost: editableData.amount || (editableData.liters! * editableData.pricePerLiter!) || 0
      });
    } else {
      const type = editableData.type === 'freight' ? TransactionType.REVENUE : (category?.type || TransactionType.VARIABLE_EXPENSE);
      const finalCategoryId = editableData.type === 'freight' 
        ? categories.find(c => c.name.toLowerCase().includes('frete'))?.id || categories[0].id
        : category?.id || categories[0].id;

      addTransaction({
        date: new Date().toISOString().split('T')[0],
        executionDate: editableData.date || new Date().toISOString().split('T')[0],
        isPaid: true,
        amount: editableData.amount || 0,
        description: editableData.description || (editableData.type === 'freight' ? `Frete: ${editableData.client}` : 'Lançamento IA'),
        subCategory: editableData.client,
        categoryId: finalCategoryId,
        type: type,
        truckId: truck?.id,
        startMileage: editableData.startKm,
        endMileage: editableData.endKm,
        weight: editableData.weight,
        volume: editableData.volume,
        cargoTypeId: cargoType?.id,
        cargoTypeLabel: cargoType?.name
      });
    }

    setSuccess(true);
    setParsedData(null);
    setEditableData(null);
    setInputText('');
    setConversationContext('');
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleCancel = () => {
    setParsedData(null);
    setEditableData(null);
    setConversationContext('');
    setInputText('');
  };

  const updateField = (field: keyof AIParsedData, value: any) => {
    if (!editableData) return;
    setEditableData({ ...editableData, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600 text-white rounded-3xl shadow-lg shadow-blue-100">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Lançamento Inteligente</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">IA e Comando de Voz</p>
              </div>
            </div>
            
            <button
              onClick={toggleRecording}
              className={`p-4 rounded-full transition-all flex items-center gap-2 group ${
                isRecording 
                ? 'bg-rose-100 text-rose-600 animate-pulse' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
              title={isRecording ? "Parar Gravação" : "Ativar Voz"}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
              <span className={`text-xs font-black uppercase ${isRecording ? 'block' : 'hidden group-hover:block'}`}>
                {isRecording ? 'Gravando...' : 'Falar'}
              </span>
            </button>
          </div>

          {parsedData && !parsedData.isComplete && (
            <div className="mb-6 animate-in slide-in-from-left-4">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className="text-blue-800 font-bold text-sm leading-relaxed">
                    {parsedData.aiFeedback || "Entendi parte das informações, mas preciso de mais detalhes."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 relative">
            <textarea
              ref={textareaRef}
              className={`w-full p-6 rounded-3xl border-2 outline-none text-slate-700 font-medium text-lg min-h-[140px] shadow-inner transition-all resize-none ${
                isRecording ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder={parsedData && !parsedData.isComplete ? 'Fale ou digite o detalhe faltante...' : 'Ex: "Abasteci 50 litros a 5,89 placa ABC-1234..."'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAnalyzing}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyzeText(); } }}
            />
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                <Info size={14} className="text-blue-500" /> 
                {conversationContext ? "Modo: Completando Lançamento" : "Fale naturalmente seus gastos e ganhos"}
              </div>
              <div className="flex gap-2">
                {conversationContext && (
                  <button onClick={handleCancel} className="px-6 py-4 text-slate-400 font-bold uppercase text-xs hover:text-rose-600 transition-colors">
                    Cancelar
                  </button>
                )}
                <button
                  onClick={analyzeText}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-sm flex items-center gap-3 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  {isAnalyzing ? 'Analisando...' : (conversationContext ? 'Enviar Resposta' : 'Analisar Dados')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-8 bg-rose-50 border-b border-rose-100 flex items-center gap-4 text-rose-700">
            <AlertCircle size={24} />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-8 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-emerald-700">
            <div className="flex items-center gap-4">
              <CheckCircle2 size={24} />
              <p className="font-bold text-sm">Lançamento salvo com sucesso!</p>
            </div>
          </div>
        )}

        {editableData && (
          <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-500 bg-slate-50/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Edit3 size={14} className="text-blue-500" /> Revise e corrija os dados se necessário
              </h3>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase rounded-full">
                Modo Edição Ativo
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card Financeiro */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-blue-600">
                  {editableData.type === 'fuel' ? <Fuel size={24} /> : editableData.type === 'freight' ? <TruckIcon size={24} /> : <DollarSign size={24} />}
                  <span className="font-black text-xs uppercase tracking-widest">Informações Básicas</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Descrição</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={editableData.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Valor Total (R$)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-lg font-black text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      value={editableData.amount || 0}
                      onChange={(e) => updateField('amount', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Data</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={editableData.date || ''}
                      onChange={(e) => updateField('date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card Veículo */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <TruckIcon size={24} />
                  <span className="font-black text-xs uppercase tracking-widest">Veículo e Contexto</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Placa do Caminhão</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-black text-blue-600 uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={editableData.truckPlate || ''}
                      onChange={(e) => updateField('truckPlate', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Categoria</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={editableData.categoryName || ''}
                      onChange={(e) => updateField('categoryName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Cliente / Terceiro</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={editableData.client || ''}
                      onChange={(e) => updateField('client', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card Técnico */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-emerald-600">
                  <Gauge size={24} />
                  <span className="font-black text-xs uppercase tracking-widest">Dados Técnicos</span>
                </div>
                <div className="space-y-4">
                  {editableData.type === 'fuel' ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Litros</label>
                        <input 
                          type="number" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={editableData.liters || 0}
                          onChange={(e) => updateField('liters', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">KM Odômetro</label>
                        <input 
                          type="number" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={editableData.mileage || 0}
                          onChange={(e) => updateField('mileage', parseFloat(e.target.value))}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tipo de Carga</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={editableData.cargoTypeName || ''}
                          onChange={(e) => updateField('cargoTypeName', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Peso (Ton)</label>
                          <input 
                            type="number" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={editableData.weight || 0}
                            onChange={(e) => updateField('weight', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">KM Início</label>
                          <input 
                            type="number" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={editableData.startKm || 0}
                            onChange={(e) => updateField('startKm', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-100 active:scale-95"
              >
                <CheckCircle2 size={20} /> Salvar Lançamento Corrigido
              </button>
              <button
                onClick={handleCancel}
                className="px-8 bg-white text-slate-400 hover:text-rose-600 font-bold py-5 rounded-2xl border border-slate-200 transition-all active:scale-95"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <Volume2 size={120} />
          </div>
          <h3 className="text-xl font-black mb-4 relative z-10 flex items-center gap-2">
            <Mic size={20} className="text-blue-400" /> Comando de Voz
          </h3>
          <p className="text-slate-400 text-sm mb-6 relative z-10">Use o microfone para descrever o evento. A IA preencherá o formulário para você revisar.</p>
          <ul className="space-y-3 relative z-10">
            <li className="text-sm bg-white/5 p-4 rounded-xl border border-white/10 italic">
              "Gastei 450 reais com troca de óleo no Volvo placa ABC-1234"
            </li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <User size={24} />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">Revisão Humana</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Mesmo que a IA erre algum detalhe ou placa, você pode editar todos os campos manualmente antes de salvar definitivamente. Segurança total nos seus dados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIIntelligentEntry;
