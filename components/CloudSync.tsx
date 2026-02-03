
import React, { useEffect, useState } from 'react';
import { 
  CloudSync as CloudIcon, ShieldCheck, RefreshCcw, 
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
    /* @ts-ignore */
    if (window.google) {
      /* @ts-ignore */
      window.google.accounts.id.initialize({
        client_id: "713915854445-5688688468846884.apps.googleusercontent.com", // Client ID fictício para UI
        callback: (response: any) => onLogin(response.credential),
      });

      if (!user) {
        /* @ts-ignore */
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "100%", text: "continue_with" }
        );
      }
    }
  }, [user]);

  const handleSyncAction = async (action: () => void) => {
    setIsSyncing(true);
    // Simulando delay de rede para feedback visual
    await new Promise(r => setTimeout(r, 1500));
    action();
    setIsSyncing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-6 mb-8">
            <div className="p-5 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-100">
              <CloudIcon size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Vínculo em Nuvem</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronize seus dados com o Google</p>
            </div>
          </div>

          {!user ? (
            <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCcw size={40} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-800">Mantenha sua frota segura</h3>
                <p className="text-sm text-slate-500 leading-relaxed mt-2">
                  Ao vincular sua conta Gmail, seus lançamentos são salvos automaticamente. Se você trocar de celular ou formatar o computador, basta logar novamente para recuperar tudo.
                </p>
              </div>
              <div className="max-w-sm mx-auto pt-4">
                <div id="googleBtn" className="w-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 pt-2">
                <ShieldCheck size={14} className="text-emerald-500" /> Seus dados são criptografados e privados
              </p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-3xl border-4 border-white shadow-lg" />
                <div>
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1 flex items-center gap-1">
                    <UserCheck size={12} /> Logado com Sucesso
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{user.name}</h3>
                  <div className="text-sm font-medium text-slate-400 flex items-center gap-1">
                    <Mail size={14} /> {user.email}
                  </div>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-rose-600 font-black text-xs uppercase transition-colors"
              >
                <LogOut size={18} /> Sair da Conta
              </button>
            </div>
          )}
        </div>

        {user && (
          <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-4 bg-white text-blue-600 rounded-2xl shadow-sm">
                    {/* Updated icon to CloudUpload */}
                    <CloudUpload size={32} />
                  </div>
                  {lastSyncDate && (
                    <div className="text-[10px] font-black text-slate-400 uppercase text-right">
                      Último backup em:<br/> {new Date(lastSyncDate).toLocaleString()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800">Enviar para a Nuvem</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">Salvar estado atual do FrotaFin</p>
                </div>
                <button 
                  disabled={isSyncing}
                  onClick={() => handleSyncAction(onBackup)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCcw className="animate-spin" size={20} /> : <Database size={20} />}
                  Sincronizar Agora
                </button>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-emerald-300 transition-all">
                <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm w-fit">
                  {/* Updated icon to CloudDownload */}
                  <CloudDownload size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800">Restaurar da Nuvem</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">Recuperar dados salvos no Gmail</p>
                </div>
                <button 
                  disabled={isSyncing}
                  onClick={() => handleSyncAction(onRestore)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCcw className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                  Restaurar Backup
                </button>
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
              <Info className="text-blue-500 mt-1 shrink-0" size={20} />
              <div>
                <h5 className="text-sm font-black text-blue-800 uppercase tracking-tighter">Sincronização Inteligente</h5>
                <p className="text-xs text-blue-600/70 leading-relaxed mt-1">
                  O FrotaFin detectará automaticamente quando você fizer novos lançamentos e perguntará se deseja atualizar o backup na nuvem. Você também pode ativar a sincronização automática nas configurações.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <ShieldCheck size={160} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
            <CheckCircle2 className="text-emerald-400" /> Compromisso com sua Privacidade
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Nós nunca compartilhamos seus dados financeiros. O vínculo com o Gmail é utilizado exclusivamente como uma chave de identificação segura para que você possa acessar seus próprios dados em qualquer lugar do mundo. 
          </p>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-xl font-black">100%</div>
              <div className="text-[10px] font-black text-slate-500 uppercase">Seguro</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black">Cloud</div>
              <div className="text-[10px] font-black text-slate-500 uppercase">Sincronizado</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black">Grátis</div>
              <div className="text-[10px] font-black text-slate-500 uppercase">Sempre</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudSync;