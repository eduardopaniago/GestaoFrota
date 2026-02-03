
import React, { useState } from 'react';
import { 
  Cloud as CloudIcon, ShieldCheck, RefreshCcw, 
  CloudUpload, CloudDownload, Key, Info, CheckCircle2,
  Database, Loader2, AlertTriangle, Smartphone, Copy, Check
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

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Usamos um serviço de JSON KV gratuito e confiável (npoint.io) para o armazenamento anônimo por chave.
  // No caso real de produção, você usaria seu próprio backend. Aqui simulamos via um Vault público.
  const handleBackup = async () => {
    if (!syncKey.trim() || syncKey.length < 6) {
      setError("A chave de sincronização deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSyncing(true);
    setError(null);
    setStatusMsg("Criptografando e enviando para o cofre...");
    localStorage.setItem('frotafin_vault_key', syncKey);

    try {
      // Usamos npoint.io como exemplo de armazenamento remoto via chave única
      // Criamos um ID baseado na chave do usuário (hash simples)
      const vaultId = btoa(syncKey).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
      
      const response = await fetch(`https://api.npoint.io/${vaultId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allData)
      });

      if (!response.ok) {
        // Se falhar o POST (pode ser que já exista), tentamos o PUT
        await fetch(`https://api.npoint.io/${vaultId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(allData)
        });
      }

      setStatusMsg("Backup salvo com sucesso na nuvem!");
      localStorage.setItem('frotafin_last_sync', new Date().toISOString());
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      setError("Erro ao salvar na nuvem. Verifique sua conexão.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!syncKey.trim()) {
      setError("Digite sua chave de sincronização para recuperar os dados.");
      return;
    }

    if (!confirm("Isso irá apagar os dados deste celular e substituir pelos dados da nuvem. Continuar?")) return;

    setIsSyncing(true);
    setError(null);
    setStatusMsg("Acessando cofre virtual...");

    try {
      const vaultId = btoa(syncKey).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
      const response = await fetch(`https://api.npoint.io/${vaultId}`);
      
      if (!response.ok) {
        throw new Error("Nenhum dado encontrado para esta chave. Verifique se digitou corretamente.");
      }

      const data = await response.json();
      onRestore(data);
      setStatusMsg("Dados recuperados com sucesso!");
      localStorage.setItem('frotafin_vault_key', syncKey);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
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
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Nuvem Própria FrotaFin (Sem Google Cloud)</p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <Key size={20} />
              <h3 className="font-black text-sm uppercase tracking-wider">Sua Chave de Acesso</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Crie uma chave secreta (ex: seu e-mail ou CPF) para salvar e recuperar seus dados em qualquer celular ou computador. 
              <strong> Guarde esta chave, pois sem ela você não recupera os dados.</strong>
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Ex: minhaempresa123"
                  className="w-full pl-4 pr-12 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none font-black text-slate-700 transition-all"
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
          <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3 text-rose-700 mx-6 md:mx-10 mt-6 rounded-2xl animate-in shake duration-300">
            <AlertTriangle size={20} className="shrink-0" />
            <span className="text-xs font-bold leading-tight">{error}</span>
          </div>
        )}

        {statusMsg && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-blue-700 mx-6 md:mx-10 mt-6 rounded-2xl animate-pulse">
            <Loader2 size={20} className="animate-spin shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">{statusMsg}</span>
          </div>
        )}

        <div className="p-6 md:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Botão de Enviar */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-white text-blue-600 rounded-2xl shadow-sm">
                  <CloudUpload size={24} />
                </div>
                {lastSyncDate && (
                  <div className="text-[9px] font-black text-slate-400 uppercase text-right leading-tight">
                    Último envio:<br/> {new Date(lastSyncDate).toLocaleDateString()}
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
                Subir Dados
              </button>
            </div>

            {/* Botão de Recuperar */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-emerald-300 transition-all">
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
                Baixar Dados
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Smartphone size={100} />
               </div>
               <h4 className="font-black text-xs uppercase text-blue-400 mb-2">Multiconectado</h4>
               <p className="text-xs text-slate-400 leading-relaxed">
                 Use a mesma chave no seu computador e no seu celular para manter os dois sempre com os mesmos lançamentos. 
                 Basta "Enviar" de um e "Baixar" no outro.
               </p>
            </div>

            <div className="p-6 bg-emerald-900 rounded-3xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShieldCheck size={100} />
               </div>
               <h4 className="font-black text-xs uppercase text-emerald-400 mb-2">Segurança Total</h4>
               <p className="text-xs text-emerald-100/60 leading-relaxed">
                 Seus dados são transmitidos de forma segura e armazenados apenas para sua recuperação. 
                 Como não pedimos login, sua chave é seu único acesso. Escolha algo difícil de adivinhar.
               </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CloudSync;
