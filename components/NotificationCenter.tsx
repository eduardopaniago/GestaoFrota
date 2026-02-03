
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Bell, BellRing, Mail, Send, BellOff } from 'lucide-react';
import { Transaction, Category, TransactionType } from '../types';

interface NotificationCenterProps {
  pendingTransactions: Transaction[];
  categories: Category[];
  markAsPaid: (id: string) => void;
  postpone: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ pendingTransactions, categories, markAsPaid, postpone }) => {
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Verifica permissão de forma segura após a montagem do componente
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(window.Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !("Notification" in window)) {
      console.warn("Este dispositivo não suporta notificações nativas.");
      return;
    }
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (err) {
      console.error("Erro ao solicitar permissão de notificação:", err);
    }
  };

  const sendBrowserNotification = (tx: Transaction) => {
    if (typeof window === 'undefined' || !("Notification" in window)) return;

    if (notificationPermission !== 'granted') {
      requestPermission();
      return;
    }

    const title = tx.type === TransactionType.REVENUE ? 'Recebimento Pendente' : 'Pagamento Pendente';
    const amountStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount);
    const body = `${tx.description} - ${amountStr} vence hoje!`;
    
    try {
      new window.Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/552/552791.png',
      });
    } catch (err) {
      console.error("Falha ao disparar notificação:", err);
    }
  };

  const simulateEmailSend = (tx: Transaction) => {
    const amountStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount);
    const subject = encodeURIComponent(`Lembrete de ${tx.type === TransactionType.REVENUE ? 'Recebimento' : 'Pagamento'}: ${tx.description}`);
    const body = encodeURIComponent(`Olá,\n\nEste é um lembrete automático do FrotaFin.\n\nA transação "${tx.description}" no valor de ${amountStr} tem o vencimento agendado para ${new Date(tx.dueDate!).toLocaleDateString()}.\n\nPor favor, verifique o status no sistema.`);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    
    setSentEmails(prev => new Set(prev).add(tx.id));
    setTimeout(() => {
      setSentEmails(prev => {
        const next = new Set(prev);
        next.delete(tx.id);
        return next;
      });
    }, 3000);
  };

  const notifyAll = () => {
    if (typeof window !== 'undefined' && "Notification" in window && notificationPermission === 'granted') {
      pendingTransactions.forEach(tx => sendBrowserNotification(tx));
    } else {
      requestPermission();
    }
  };

  if (pendingTransactions.length === 0) return null;

  const hasNotificationSupport = typeof window !== 'undefined' && "Notification" in window;

  return (
    <div className="mb-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2">
          <AlertCircle size={20} className="text-orange-600" />
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Alertas Financeiros</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Vencimentos para hoje ou atrasados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hasNotificationSupport ? (
            <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-lg">Notificações não suportadas</span>
          ) : notificationPermission !== 'granted' ? (
            <button 
              onClick={requestPermission}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-all border border-blue-100"
            >
              <BellOff size={14} /> Ativar Notificações
            </button>
          ) : (
            <button 
              onClick={notifyAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100 transition-all border border-emerald-100"
            >
              <BellRing size={14} /> Notificar Tudo
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingTransactions.map(tx => {
          const isRevenue = tx.type === TransactionType.REVENUE;
          const isOverdue = new Date(tx.dueDate!) < new Date(new Date().toISOString().split('T')[0]);
          const isEmailSent = sentEmails.has(tx.id);

          return (
            <div key={tx.id} className={`p-5 rounded-2xl border-2 bg-white flex flex-col justify-between shadow-xl shadow-slate-100 transition-all hover:scale-[1.02] ${isRevenue ? 'border-emerald-100 hover:border-emerald-300' : 'border-rose-100 hover:border-rose-300'} relative overflow-hidden`}>
              {isOverdue && (
                <div className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                  Atrasado
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-start mb-3">
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isRevenue ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isRevenue ? 'A Receber' : 'A Pagar'}
                   </span>
                   <div className="flex items-center gap-1">
                      {hasNotificationSupport && (
                        <button 
                          onClick={() => sendBrowserNotification(tx)}
                          title="Notificar Desktop"
                          className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Bell size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => simulateEmailSend(tx)}
                        title="Lembrete Email"
                        className={`p-1.5 rounded-lg transition-all ${isEmailSent ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                      >
                        {isEmailSent ? <Send size={14} className="animate-bounce" /> : <Mail size={14} />}
                      </button>
                   </div>
                </div>

                <h4 className="font-black text-slate-800 text-lg leading-tight truncate pr-8">{tx.description}</h4>
                <div className="text-xs font-bold text-slate-400 mt-1">Vencimento: {new Date(tx.dueDate!).toLocaleDateString()}</div>
                
                <div className={`text-2xl font-black mt-3 ${isRevenue ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                </div>
              </div>

              <div className="flex gap-2 mt-5 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => markAsPaid(tx.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-100"
                >
                  <CheckCircle2 size={12} /> Liquidar
                </button>
                <button 
                  onClick={() => postpone(tx.id)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <Clock size={12} /> Adiar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationCenter;
