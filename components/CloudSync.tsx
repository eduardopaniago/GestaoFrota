
import React, { useState } from 'react';
import { 
  Cloud as CloudIcon, ShieldCheck, RefreshCcw, 
  CloudUpload, CloudDownload, Key, Info, CheckCircle2,
  Database, Loader2, AlertTriangle, Smartphone, Copy, Check, Globe
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

  // Bucket público para o FrotaFin. Chaves dentro deste bucket são privadas ao conhecimento do usuário.
  const BUCKET_ID = "FrotaFin_Public_Vault_v1";

  const handleCopyKey = () => {
    if (!syncKey) return;
    navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackup = async () => {
    const cleanKey = syncKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (cleanKey.length < 6) {
      setError("A chave deve ter pelo menos 6 caracteres (apenas letras e números).");
      return;
    }

    setIsSyncing(true);
    setError(null);
    setStatusMsg("Conectando ao servidor de backup...");
    localStorage.setItem('frotafin_vault_key', cleanKey);

    try {
      // Usamos KVDB.io que permite PUT/GET direto em chaves personalizadas
      const response = await fetch(`https://kvdb.io/ANsc7Xy7Xz8Xz9Xz10Xz/${cleanKey}`, {
        method: 'POST', // KVDB usa POST para criar/atualizar o valor da chave
        body: JSON.stringify(allData)
      });

      if (!response.ok) {
        throw new Error(`Erro no servidor (${response.status}). Tente novamente mais tarde.`);
      }

      setStatusMsg("Backup concluído com sucesso!");
      localStorage.setItem('frotafin_last_sync', new Date().toISOString());
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      console.error("Erro no backup:", e);
      setError("Falha ao salvar. Verifique se você está conectado à internet ou tente uma chave diferente.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    const cleanKey = syncKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!cleanKey) {
      setError("Digite sua chave para recuperar os dados.");
      return;
    }

    if (!confirm("Isso irá substituir os dados atuais deste dispositivo pelos dados salvos na nuvem. Confirmar restauração?")) return;

    setIsSyncing(true);
    setError(null);
    setStatusMsg("Buscando dados no cofre virtual...");

    try {
      const response = await fetch(`https://kvdb.io/ANsc7Xy7Xz8Xz9Xz10Xz/${cleanKey}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Nenhum backup encontrado para esta chave. Verifique se digitou corretamente.");
        }
        throw new Error("Erro ao acessar o servidor. Tente novamente.");
      }

      const data = await response.json();
      
      // Validação básica se o dado é um objeto de estado do app
      if (!data.transactions || !data.trucks) {
        throw new Error("O arquivo na nuvem parece estar corrompido ou é inválido.");
      }

      onRestore(data);
      setStatusMsg("Dados restaurados com sucesso!");
      localStorage.setItem('frotafin_vault_key', cleanKey);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      console.error("Erro na restauração:", e);
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
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronização Instantânea por Chave</p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-600">
                <Key size={20} />
                <h3 className="font-black text-sm uppercase tracking-wider">Chave Única do Seu Negócio</h3>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-lg">
                <Globe size={12} /> Servidor Online
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Diferente de e-mail e senha, aqui você usa uma <strong>Chave Secreta</strong>. 
              Ao "Subir Dados", as informações deste aparelho ficam vinculadas a essa chave. 
              Ao "Baixar Dados" em outro aparelho usando a mesma chave, tudo é restaurado.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Crie sua chave (ex: transilva2024)"
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
            <AlertTriangle size={20} className="shrink-0" />
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
                <h4 className="text-base md:text-lg font-black text-slate-800">Sincronizar Celular → Nuvem</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Salva tudo na sua chave</p>
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
                <h4 className="text-base md:text-lg font-black text-slate-800">Sincronizar Nuvem → Celular</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Puxa o backup para este aparelho</p>
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
               <h4 className="font-black text-xs uppercase text-blue-400 mb-2">Sem Complicação</h4>
               <p className="text-xs text-slate-400 leading-relaxed">
                 Não precisa de login, senha ou configurações de API. Sua chave é o seu banco de dados. 
                 <strong> Dica:</strong> Use uma chave longa e difícil de adivinhar para maior segurança.
               </p>
            </div>

            <div className="p-6 bg-emerald-900 rounded-3xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShieldCheck size={100} />
               </div>
               <h4 className="font-black text-xs uppercase text-emerald-400 mb-2">Backup de Segurança</h4>
               <p className="text-xs text-emerald-100/60 leading-relaxed">
                 Perdeu o celular? Basta instalar o FrotaFin em um novo, digitar sua chave e clicar em <strong>Baixar Dados</strong>. 
                 Seu financeiro nunca mais será perdido.
               </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CloudSync;
