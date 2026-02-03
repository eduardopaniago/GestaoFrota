
import React, { useState, useEffect } from 'react';
import { Github, Save, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Globe, Database, Loader2, ArrowDownCircle, ArrowUpCircle, Key, Lock } from 'lucide-react';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

interface GitHubSyncProps {
  appData: any;
  onRestore: (data: any) => void;
}

const GitHubSync: React.FC<GitHubSyncProps> = ({ appData, onRestore }) => {
  const [config, setConfig] = useState<GitHubConfig>(() => {
    const saved = localStorage.getItem('frotafin_github_config');
    return saved ? JSON.parse(saved) : {
      token: '',
      owner: 'eduardopaniago',
      repo: 'GestaoFrota',
      branch: 'main',
      path: 'database.json'
    };
  });

  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(!config.token);

  useEffect(() => {
    localStorage.setItem('frotafin_github_config', JSON.stringify(config));
  }, [config]);

  const pushToGitHub = async () => {
    if (!config.token) {
      setShowTokenInput(true);
      return alert("Você precisa de um Personal Access Token para sincronizar.");
    }

    setStatus('syncing');
    setMessage('Codificando dados e contatando GitHub...');

    try {
      // 1. Verificar se o arquivo já existe para pegar o SHA
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
      const getRes = await fetch(url, {
        headers: { 'Authorization': `token ${config.token}` }
      });
      
      let sha = "";
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      // 2. Preparar conteúdo (Base64)
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(appData, null, 2))));

      // 3. Enviar (PUT)
      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Sincronização FrotaFin: ${new Date().toLocaleString()}`,
          content: content,
          branch: config.branch,
          sha: sha || undefined
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(errData.message || "Falha na sincronização.");
      }

      setStatus('success');
      setMessage('Projeto sincronizado com sucesso no GitHub!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || "Erro inesperado.");
    }
  };

  const pullFromGitHub = async () => {
    if (!config.token) return alert("Configure o token primeiro.");
    if (!confirm("Isso apagará seus dados locais atuais. Continuar?")) return;

    setStatus('syncing');
    setMessage('Baixando banco de dados do GitHub...');

    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}?ref=${config.branch}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `token ${config.token}` }
      });

      if (!res.ok) throw new Error("Arquivo database.json não encontrado no repositório.");

      const data = await res.json();
      const decodedContent = decodeURIComponent(escape(atob(data.content)));
      const parsedData = JSON.parse(decodedContent);

      onRestore(parsedData);
      setStatus('success');
      setMessage('Banco de dados restaurado do repositório!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || "Erro ao baixar dados.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-3xl">
              <Github size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sync Repository</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{config.owner}/{config.repo}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="text-xs font-black uppercase text-blue-600 hover:underline"
          >
            {showTokenInput ? 'Fechar Ajustes' : 'Configurar Token'}
          </button>
        </div>

        <div className="p-10 space-y-8">
          {showTokenInput && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Key size={14} className="text-blue-500" /> Segurança (GitHub PAT)
              </div>
              <p className="text-xs text-slate-500">Para gravar no repositório, você precisa de um token com permissão <code className="bg-slate-200 px-1 rounded">repo</code>.</p>
              <input 
                type="password"
                placeholder="ghp_seu_token_aqui"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none font-mono text-sm"
                value={config.token}
                onChange={e => setConfig({...config, token: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Caminho do Banco</label>
                  <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" value={config.path} readOnly />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Branch Alvo</label>
                  <input className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" value={config.branch} readOnly />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={pushToGitHub}
              disabled={status === 'syncing'}
              className="flex flex-col items-center justify-center p-10 bg-slate-900 hover:bg-black text-white rounded-3xl shadow-xl transition-all active:scale-95 disabled:opacity-50 group"
            >
              <ArrowUpCircle size={48} className="mb-4 text-emerald-400 group-hover:animate-bounce" />
              <span className="text-lg font-black uppercase">Fazer Backup</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Commit Local -> Repositório</span>
            </button>

            <button 
              onClick={pullFromGitHub}
              disabled={status === 'syncing'}
              className="flex flex-col items-center justify-center p-10 bg-white border-2 border-slate-900 text-slate-900 rounded-3xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 group"
            >
              <ArrowDownCircle size={48} className="mb-4 text-blue-600 group-hover:animate-bounce" />
              <span className="text-lg font-black uppercase">Restaurar Nuvem</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Pull Repositório -> Local</span>
            </button>
          </div>

          {status !== 'idle' && (
            <div className={`p-6 flex items-center justify-center gap-4 rounded-2xl animate-in zoom-in-95 ${
              status === 'syncing' ? 'bg-blue-50 text-blue-600' :
              status === 'success' ? 'bg-emerald-50 text-emerald-700' :
              'bg-rose-50 text-rose-700'
            }`}>
              {status === 'syncing' && <Loader2 size={24} className="animate-spin" />}
              {status === 'success' && <CheckCircle2 size={24} />}
              {status === 'error' && <AlertCircle size={24} />}
              <p className="font-black text-sm uppercase tracking-widest leading-none">{message}</p>
            </div>
          )}

          <div className="flex items-start gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <ShieldCheck size={24} className="text-slate-500 shrink-0" />
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase mb-1">Por que sincronizar com GitHub?</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Ao contrário de bancos de dados tradicionais, o GitHub mantém um histórico (commits) de todas as suas alterações. Você pode ver exatamente como suas finanças estavam em qualquer data anterior.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
          <Globe size={160} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
             <RefreshCw className="text-blue-400" /> Sincronização em Duas Vias
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Você pode usar múltiplos dispositivos (celular e PC). Ao terminar no PC, faça um **Backup**. Ao abrir no celular, faça um **Restaurar**. Seus arquivos estarão sempre sincronizados através da pasta segura no seu repositório privado ou público.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GitHubSync;
