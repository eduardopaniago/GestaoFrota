
import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Clock, Info, ChevronDown, ChevronUp, 
  CheckCircle2, AlertCircle, Trash2, Database, FileText
} from 'lucide-react';
import { Category, Transaction, TransactionType, Truck as TruckType } from '../types';
import * as XLSX from 'xlsx';

interface ImportManagerProps {
  categories: Category[];
  trucks: TruckType[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

const ImportManager: React.FC<ImportManagerProps> = ({ categories, trucks, addTransaction }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(true);
  const [lastImportCount, setLastImportCount] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let importedCount = 0;

        data.forEach(row => {
          const dateValue = row.Data || row.Date || row.data || new Date();
          const executionDate = row.Execucao || row.execucao || dateValue;
          const description = row.Descricao || row.descricao || row.Description || '';
          const amount = parseFloat(row.Valor || row.valor || row.Amount || 0);
          const subCategory = row.Subcategoria || row.subcategoria || row.Cliente || row.Fornecedor || '';
          
          const catName = row.Categoria || row.categoria || '';
          const foundCategory = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          
          const truckPlate = row.Placa || row.placa || '';
          const foundTruck = trucks.find(t => t.plate.replace('-', '').toLowerCase() === truckPlate.replace('-', '').toLowerCase());

          let type = foundCategory?.type;
          if (!type) {
            const typeStr = (row.Tipo || row.tipo || '').toLowerCase();
            if (typeStr.includes('receita')) type = TransactionType.REVENUE;
            else if (typeStr.includes('fixo')) type = TransactionType.FIXED_COST;
            else type = TransactionType.VARIABLE_EXPENSE;
          }

          const isPaid = !(row.Status?.toString().toLowerCase().includes('pendente') || row.status?.toString().toLowerCase().includes('aberto'));

          if (amount !== 0) {
            addTransaction({
              date: new Date(dateValue).toISOString().split('T')[0],
              executionDate: new Date(executionDate).toISOString().split('T')[0],
              dueDate: row.Vencimento ? new Date(row.Vencimento).toISOString().split('T')[0] : undefined,
              isPaid,
              amount,
              description,
              subCategory,
              categoryId: foundCategory?.id || categories[0].id,
              type: type || TransactionType.VARIABLE_EXPENSE,
              truckId: foundTruck?.id,
            });
            importedCount++;
          }
        });

        setLastImportCount(importedCount);
        alert(`${importedCount} lançamentos importados com sucesso!`);
      } catch (error) {
        console.error(error);
        alert("Erro ao processar a planilha. Verifique o formato do arquivo.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-3xl">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Módulo de Importação</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Alimente seu sistema em segundos</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6 hover:border-emerald-400 transition-all group">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Arraste seu arquivo aqui ou clique abaixo</h3>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1">Suporta arquivos Excel (.xlsx, .xls) e CSV</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-sm flex items-center gap-3 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-95"
            >
              {isImporting ? <Clock className="animate-spin" size={20} /> : <Database size={20} />}
              {isImporting ? 'Processando Planilha...' : 'Selecionar Planilha'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div>
             <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} className="text-blue-500" /> Instruções de Preenchimento
              </h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h5 className="font-black text-slate-800 text-xs uppercase mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Colunas Obrigatórias
                  </h5>
                  <ul className="space-y-2">
                    {[
                      {h: 'Data', d: 'Data do evento (dd/mm/aaaa)'},
                      {h: 'Descricao', d: 'Nome do lançamento'},
                      {h: 'Valor', d: 'Quantia monetária (use ponto ou vírgula)'},
                      {h: 'Categoria', d: 'Deve coincidir com suas categorias cadastradas'}
                    ].map(item => (
                      <li key={item.h} className="flex justify-between items-center text-[11px]">
                        <span className="font-black text-slate-600 uppercase">{item.h}</span>
                        <span className="text-slate-400 font-bold">{item.d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h5 className="font-black text-slate-800 text-xs uppercase mb-3 flex items-center gap-2">
                    <AlertCircle size={14} className="text-blue-500" /> Colunas Opcionais
                  </h5>
                  <ul className="space-y-2">
                    {[
                      {h: 'Placa', d: 'Vincula automaticamente ao caminhão'},
                      {h: 'Status', d: 'Pago ou Pendente'},
                      {h: 'Cliente', d: 'Nome do cliente/fornecedor'},
                      {h: 'Vencimento', d: 'Data limite para pagamento'}
                    ].map(item => (
                      <li key={item.h} className="flex justify-between items-center text-[11px]">
                        <span className="font-black text-slate-600 uppercase">{item.h}</span>
                        <span className="text-slate-400 font-bold">{item.d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
             </div>
          </div>

          {lastImportCount !== null && (
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-between animate-in zoom-in-95">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-sm">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-800">Última Importação Finalizada</div>
                  <div className="text-xs font-bold text-emerald-600 uppercase">Sucesso: {lastImportCount} registros adicionados ao banco.</div>
                </div>
              </div>
              <button onClick={() => setLastImportCount(null)} className="text-emerald-400 hover:text-emerald-600 p-2">
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>
      </section>
      
      <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <FileText size={160} />
        </div>
        <h3 className="text-xl font-black mb-2 relative z-10">Dica Profissional</h3>
        <p className="text-blue-100 text-sm leading-relaxed max-w-lg relative z-10">
          Você pode exportar extratos de cartões de combustível ou frotas em formato Excel e simplesmente renomear os cabeçalhos das colunas para os padrões aceitos pelo FrotaFin. Isso automatiza 90% do seu trabalho administrativo!
        </p>
      </div>
    </div>
  );
};

export default ImportManager;
