
import React, { useEffect, useState, useRef } from 'react';
import { 
  Cloud as CloudIcon, ShieldCheck, RefreshCcw, 
  CloudUpload, CloudDownload, LogOut, Mail, Info, CheckCircle2,
  Database, UserCheck, Loader2, AlertTriangle, ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types';

interface CloudSyncProps {
  user: UserProfile | null;
  allData: any; // Recebe o estado completo para backup
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onRestore: (data: any) => void;
  lastSyncDate?: string;
}

const CloudSync: React.FC<CloudSyncProps> = ({ user, allData, onLogin, onLogout, onRestore, lastSyncDate }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const tokenClientRef = useRef<any>(null);
  const accessTokenRef = useRef<string | null>(localStorage.getItem('frotafin_access_token'));

  // Configuração do Google Identity Services
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      /* @ts-ignore */
      tokenClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: "713915854445-5688688468846884.apps.googleusercontent.com", // Substituir por um Client ID válido do console.cloud.google.com
        scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
        callback: (response: any) => {
          if (response.error !== undefined) {
            setError("Falha na autorização: " + response.error);
            return;
          }
          accessTokenRef.current = response.access_token;
          localStorage.setItem('frotafin_access_token', response.access_token);
          fetchUserProfile(response.access_token);
        },
      });
    };
    document.body.appendChild(script);
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const info = await resp.json();
      onLogin({
        id: info.sub,
        name: info.name,
        email: info.email,
        picture: info.picture
      });
      setStatusMsg("Conectado ao Gmail com sucesso!");
    } catch (e) {
      setError("Erro ao obter perfil do usuário.");
    }
  };

  const handleConnect = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    }
  };

  const findOrCreateSpreadsheet = async () => {
    const token = accessTokenRef.current;
    if (!token) throw new Error("Não autorizado");

    // Tenta encontrar uma planilha existente com o nome específico
    // Usamos o Drive API v3 para listar
    setStatusMsg("Buscando planilha no Drive...");
    const listResp = await fetch('https://www.googleapis.com/drive/v3/files?q=name%3D%27FrotaFin_Database%27%20and%20mimeType%3D%27application/vnd.google-apps.spreadsheet%27', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listResp.json();

    if (listData.files && listData.files.length > 0) {
      return listData.files[0].id;
    }

    // Cria nova se não existir
    setStatusMsg("Criando nova planilha de backup...");
    const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: { title: 'FrotaFin_Database' }
      })
    });
    const createData = await createResp.json();
    return createData.spreadsheetId;
  };

  const handleBackup = async () => {
    if (!user) return handleConnect();
    setIsSyncing(true);
    setError(null);
    try {
      const sheetId = await findOrCreateSpreadsheet();
      setStatusMsg("Salvando dados...");
      
      const dataString = JSON.stringify(allData);
      
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${accessTokenRef.current}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[dataString]]
        })
      });

      setStatusMsg("Backup concluído com sucesso!");
      localStorage.setItem('frotafin_last_sync', new Date().toISOString());
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      setError("Erro no backup: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!user) return handleConnect();
    if (!confirm("Isso irá substituir TODOS os seus dados locais pelos da planilha. Deseja continuar?")) return;
    
    setIsSyncing(true);
    setError(null);
    try {
      const sheetId = await findOrCreateSpreadsheet();
      setStatusMsg("Baixando dados...");

      const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1`, {
        headers: { Authorization: `Bearer ${accessTokenRef.current}` }
      });
      const data = await resp.json();

      if (data.values && data.values[0] && data.values[0][0]) {
        const parsedData = JSON.parse(data.values[0][0]);
        onRestore(parsedData);
        setStatusMsg("Dados restaurados com sucesso!");
      } else {
        setError("Nenhum dado de backup encontrado na planilha.");
      }
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e: any) {
      setError("Erro na restauração: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogoutAction = () => {
    localStorage.removeItem('frotafin_access_token');
    accessTokenRef.current = null;
    onLogout();
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
              <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Sincronização Gmail</h2>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Seus dados guardados no Google Sheets</p>
            </div>
          </div>

          {!user ? (
            <div className="bg-white p-6 md:p-10 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCcw size={32} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg md:text-xl font-black text-slate-800">Conecte sua conta</h3>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed mt-2">
                  Utilizamos o Google Sheets como seu banco de dados na nuvem. Seus dados nunca saem da sua conta Google.
                </p>
              </div>
              
              <button 
                onClick={handleConnect}
                className="mx-auto flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-2xl font-black uppercase text-sm transition-all shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Logar com Google / Gmail
              </button>

              <div className="flex flex-col items-center gap-2 pt-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" /> Google API v4 Integration
                </p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[9px] text-blue-500 hover:underline uppercase font-bold flex items-center gap-1">
                  Documentação de Faturamento e Uso <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="relative">
                  <img src={user.picture} alt={user.name} className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl border-4 border-white shadow-lg" />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-5 h-5 rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
                <div>
                  <div className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1 flex items-center gap-1">
                    <UserCheck size={12} /> Sessão Ativa via OAuth2
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800">{user.name}</h3>
                  <div className="text-xs md:text-sm font-medium text-slate-400 flex items-center gap-1">
                    <Mail size={14} /> {user.email}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleLogoutAction}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-slate-400 hover:text-rose-600 font-black text-[10px] md:text-xs uppercase transition-colors"
              >
                <LogOut size={18} /> Desconectar Gmail
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3 text-rose-700 mx-10 mt-6 rounded-2xl">
            <AlertTriangle size={20} />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        {statusMsg && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-blue-700 mx-10 mt-6 rounded-2xl animate-pulse">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider">{statusMsg}</span>
          </div>
        )}

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
                  <h4 className="text-base md:text-lg font-black text-slate-800">Enviar para Google Sheets</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Gera backup na planilha</p>
                </div>
                <button 
                  disabled={isSyncing}
                  onClick={handleBackup}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                  Fazer Backup Agora
                </button>
              </div>

              <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 space-y-6 group hover:border-emerald-300 transition-all">
                <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm w-fit">
                  <CloudDownload size={24} />
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-black text-slate-800">Baixar da Planilha</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Restaura seus dados do Sheets</p>
                </div>
                <button 
                  disabled={isSyncing}
                  onClick={handleRestore}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                  Restaurar Tudo
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Database size={100} />
               </div>
               <h4 className="font-black text-xs uppercase text-blue-400 mb-2">Estrutura Técnica</h4>
               <p className="text-xs text-slate-400 leading-relaxed">
                 O sistema gerencia automaticamente uma planilha chamada <strong className="text-white">FrotaFin_Database</strong> no seu Google Drive. 
                 Não apague ou renomeie esta planilha para manter a integridade das sincronizações. 
                 A primeira linha da planilha contém todo o estado do seu negócio.
               </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CloudSync;
