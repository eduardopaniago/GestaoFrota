
import React, { useEffect, useState } from 'react';
import { 
  Cloud as CloudIcon, ShieldCheck, RefreshCcw, 
  CloudUpload, CloudDownload, LogOut, Mail, Info, CheckCircle2,
  Database, UserCheck
} from 'lucide-react';
import { UserProfile } from '../types';

interface CloudSyncProps {
  user: UserProfile | null;
  onLogin: (credential: string) => void;
  onLogout: () => void;
  onBackup: () => void;
  onRestore: () => void;
  lastSyncDate?: string;
}

const CloudSync: React.FC<CloudSyncProps> = ({ user, onLogin, onLogout, onBackup, onRestore, lastSyncDate }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Safety check for window.google
    const initializeGoogle = () => {
      /* @ts-ignore */
      if (window.google && window.google.accounts) {
        /* @ts-ignore */
        window.google.accounts.id.initialize({
          client_id: "713915854445-5688688468846884.apps.googleusercontent.com",
          callback: (response: any) => onLogin(response.credential),
        });

        if (!user) {
          const btnContainer = document.getElementById("googleBtn");
          if (btnContainer) {
            /* @ts-ignore */
            window.google.accounts.id.renderButton(
              btnContainer,
              { theme: "outline", size: "large", width: "100%", text: "continue_with" }
            );
          }
        }
      }
    };

    // Retry initialization if google is not yet defined
    const timer = setInterval(() => {
      /* @ts-ignore */
      if (window.google) {
        initializeGoogle();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [user]);

  const handleSyncAction = async (action: () => void) => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500));
    action();
    setIsSyncing(false);
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
              <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Vínculo em Nuvem</h2>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronize seus dados com o Google</p>
            </div>
          </div>

          {!user ? (
            <div className="bg-white p-6 md:p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCcw size={32} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg md:text-xl font-black text-slate-800">Mantenha sua frota segura</h3>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed mt-2">
                  Ao vincular sua conta Gmail, seus lançamentos são salvos automaticamente. Perfeito para troca de aparelhos ou backup.
                </p>
              </div>
              
              <div className="max-w-sm mx-auto pt-4 min-h-[50px] flex items-center justify-center">
                <div id="googleBtn" className="w-full"></div>
              </div>

              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 pt-2">
                <ShieldCheck size={14} className="text-emerald-500" /> Segurança Nível Google Identity
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 md:gap-5">
                <img src={user.picture} alt={user.name} className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl border-4 border-white shadow-lg" />
                <div>
                  <div className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1 flex items-center gap-1">
                    <UserCheck size={12} /> Logado com Sucesso
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800">{user.name}</h3>
                  <div className="text-xs md:text-sm font-medium text-slate-400 flex items-center gap-1">
                    <Mail size={14} /> {user.email}
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-slate-400 hover:text-rose-600 font-black text-[10px] md:text-xs uppercase transition-colors"
              >
                <LogOut size={18} /> Sair da Conta
              </button>
            </div>
          )}
        </div>

        {user && (
          <div className="p-6 md:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-4 bg-white text-blue-600 rounded-2xl shadow-sm">
                    <CloudUpload size={24} />
                  </div>
                  {lastSyncDate && (
                    <div className="text-[9px] font-black text-slate-400 uppercase text-right leading-tight">
                      Último backup:<br/> {new Date(lastSyncDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-black text-slate-800">Enviar para Nuvem</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Salvar estado atual</p>
                </div>
                <button 
                  disabled={isSyncing}
                  onClick={() => handleSyncAction(onBackup)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCcw className="animate-spin" size={20} /> : <Database size={20} />}
                  Sincronizar
                </button>
              </div>

              <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-emerald-300 transition-all">
                <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm w-fit">
                  <CloudDownload size={24} />
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-black text-slate-800">Restaurar da Nuvem</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Recuperar dados salvos</p>
                </div>
                <button 
                  disabled={isSyncing}
                  onClick={() => handleSyncAction(onRestore)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCcw className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                  Restaurar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CloudSync;
