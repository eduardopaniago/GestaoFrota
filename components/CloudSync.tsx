
import React, { useState } from 'react';
import { 
  Cloud as CloudIcon, ShieldCheck, RefreshCcw, 
  CloudUpload, CloudDownload, Key, Info, CheckCircle2,
  Database, Loader2, AlertTriangle, Smartphone, Copy, Check, Globe, ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../types';

interface CloudSyncProps {
  user: UserProfile | null;
  allData: any;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onRestore: (data: any) => void;
  lastSyncDate?: string;
}

const CloudSync: React.FC<CloudSyncProps> = ({ allData, onRestore, lastSyncDate }) => {
  const [syncKey, setSyncKey] = useState<string>(localStorage.getItem('frotafin_vault_key') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ID do Cofre Mestre do FrotaFin no Pantry Cloud
  const PANTRY_ID = "d6e87396-e179-4a0b-9d62-10f54070743b";

  const handleCopyKey = () => {
    if (!syncKey) return;
    navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackup = async () => {
    // Limpa a chave: apenas letras e números, sem espaços
    const cleanKey = syncKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (cleanKey.length < 6) {
      setError("A chave deve ter pelo menos 6 caracteres (letras e números).");
      return;
    }

    setIsSyncing(true);
    setError(null);
    setStatusMsg("Preparando dados para o cofre...");
    localStorage.setItem('frotafin_vault_key', cleanKey);

    try {
      // O Pantry usa POST para criar ou substituir o conteúdo de um "Basket" (Gaveta)
      const response = await fetch(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${cleanKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(allData)
      });

      if (!response.ok) {
        throw new Error(`Erro no servidor de nuvem. Código: ${response.status}`);
      }

      setStatusMsg("Dados salvos com sucesso na nuvem!");
      localStorage.setItem('frotafin_last_sync', new Date().toISOString());
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      console.error("Erro no backup Pantry:", e);
      setError("Não foi possível salvar na nuvem. Verifique sua internet ou tente uma chave diferente.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    const cleanKey = syncKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!cleanKey) {
      setError("Digite sua chave secreta para baixar os dados.");
      return;
    }

    if (!confirm("Atenção: Os dados atuais deste aparelho serão APAGADOS e substituídos pelos da nuvem. Deseja continuar?")) return;

    setIsSyncing(true);
    setError(null);
    setStatusMsg("Buscando sua gaveta no cofre...");

    try {
      const response = await fetch(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${cleanKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Nenhum dado encontrado para esta chave. Verifique se digitou corretamente ou se já fez um backup antes.");
        }
        throw new Error("O servidor de nuvem está temporariamente ocupado. Tente em instantes.");
      }

      const data = await response.json();
      
      // Validação mínima para garantir que o arquivo baixado é do FrotaFin
      if (!data || (!data.transactions && !data.trucks)) {
        throw new Error("O arquivo recuperado não parece ser um backup válido do FrotaFin.");
      }

      onRestore(data);
      setStatusMsg("Dados recuperados com sucesso!");
      localStorage.setItem('frotafin_vault_key', cleanKey);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      console.error("Erro na restauração Pantry:", e);
      setError(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 md:gap-6 mb-8">
            <div className="p-4 md:p-5 bg-blue-600 text-white rounded-2xl md:rounded-3xl shadow-xl shadow-blue-100">
              <CloudIcon size={32} className="md:w-10 md:h-10" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Cofre de Sincronização</h2>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Serviço de Backup Instantâneo</p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-600">
                <Key size={20} />
                <h3 className="font-black text-sm uppercase tracking-wider">Chave de Acesso Única</h3>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-lg">
                <Globe size={12} /> Status: Conectado
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Crie uma palavra ou código único (ex: <strong>suaempresa2024</strong>) para salvar seus dados. 
              Para ver os mesmos dados em outro celular, basta digitar a <strong>mesma chave</strong> lá e clicar em baixar.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Digite sua chave secreta..."
                  className="w-full pl-4 pr-12 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none font-black text-slate-700 transition-all uppercase"
                  value={syncKey}
                  onChange={(e) => setSyncKey(e.target.value)}
                />
                <button 
                  onClick={handleCopyKey}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-blue-500 transition-colors"
                >
                  {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3 text-rose-700 mx-4 md:mx-10 mt-6 rounded-2xl animate-in shake duration-300">
            <ShieldAlert size={20} className="shrink-0" />
            <span className="text-xs font-bold leading-tight">{error}</span>
          </div>
        )}

        {statusMsg && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-blue-700 mx-4 md:mx-10 mt-6 rounded-2xl animate-pulse">
            <Loader2 size={20} className="animate-spin shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">{statusMsg}</span>
          </div>
        )}

        <div className="p-6 md:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Botão de Enviar */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-white text-blue-600 rounded-2xl shadow-sm">
                  <CloudUpload size={24} />
                </div>
                {lastSyncDate && (
                  <div className="text-[9px] font-black text-slate-400 uppercase text-right leading-tight">
                    Sincronizado em:<br/> {new Date(lastSyncDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-base md:text-lg font-black text-slate-800">Enviar para Nuvem</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Salva os dados deste celular online</p>
              </div>
              <button 
                disabled={isSyncing}
                onClick={handleBackup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 active:scale-95"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                Subir Dados Agora
              </button>
            </div>

            {/* Botão de Recuperar */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-emerald-300 transition-all shadow-sm hover:shadow-md">
              <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm w-fit">
                <CloudDownload size={24} />
              </div>
              <div>
                <h4 className="text-base md:text-lg font-black text-slate-800">Baixar da Nuvem</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Recupera dados em outro aparelho</p>
              </div>
              <button 
                disabled={isSyncing}
                onClick={handleRestore}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-95"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                Baixar Dados Agora
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Smartphone size={100} />
               </div>
               <h4 className="font-black text-xs uppercase text-blue-400 mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Segurança</h4>
               <p className="text-xs text-slate-400 leading-relaxed">
                 Sua chave funciona como sua "conta". Recomendamos usar uma combinação de letras e números para garantir que ninguém mais acesse seus dados por acidente.
               </p>
            </div>

            <div className="p-6 bg-blue-900 rounded-3xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <RefreshCcw size={100} />
               </div>
               <h4 className="font-black text-xs uppercase text-blue-300 mb-2 flex items-center gap-2"><Info size={14}/> Backup Automático?</h4>
               <p className="text-xs text-blue-100/60 leading-relaxed">
                 O sistema não envia dados sozinho para economizar bateria. Sempre que fizer muitos lançamentos, lembre-se de vir aqui e clicar em <strong>Subir Dados</strong>.
               </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CloudSync;
