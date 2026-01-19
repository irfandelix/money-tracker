'use client';
import { useState, useEffect } from 'react';
import { addTransaction, getTransactions, logout } from './actions';

type TabType = 'HOME' | 'INPUT' | 'HISTORY' | 'JOB';
type InputType = 'IN' | 'OUT';
type HistoryType = 'DAILY' | 'MONTHLY';

export default function DarkMoneyTracker() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [inputType, setInputType] = useState<InputType>('IN');
  const [historyType, setHistoryType] = useState<HistoryType>('DAILY');
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ balance: 0, savings: 0, expenseThisMonth: 0 });
  const [time, setTime] = useState('');
  
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [requester, setRequester] = useState('');
  const [isGaji, setIsGaji] = useState(false);
  const [jobDeadline, setJobDeadline] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
      const timePart = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setTime(`${datePart} • ${timePart}`);
    };
    updateTime(); 
    const t = setInterval(updateTime, 1000);
    fetchData(); 
    return () => clearInterval(t);
  }, []);

  const fetchData = async () => {
    const res = await getTransactions();
    if (res.success) {
      setTransactions(res.data);
      let bal = 0, sav = 0, expMonth = 0;
      const currentMonth = new Date().getMonth();
      res.data.forEach((t: any) => {
        if(t.type === 'IN') { bal += t.amount; sav += t.savings; }
        else if(t.type === 'OUT') { 
          bal -= t.amount; 
          if (t.date && t.date.includes('/')) {
            const tMonth = parseInt(t.date.split('/')[1]) - 1; 
            if(tMonth === currentMonth) expMonth += t.amount;
          }
        }
      });
      setStats({ balance: bal, savings: sav, expenseThisMonth: expMonth });
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    let finalAmt = parseFloat(amount) || 0;
    let finalSav = 0;
    let type = 'REMINDER'; let cat = '-';

    if (activeTab === 'INPUT') {
      type = inputType;
      if (inputType === 'IN') {
        if (isGaji) { finalSav = finalAmt * 0.15; finalAmt -= finalSav; cat = 'Gaji'; } 
        else cat = 'Pemasukan';
      } else cat = 'Pengeluaran';
    } else if (activeTab === 'JOB') {
      if (addToCalendar && jobDeadline) generateICS(desc, jobDeadline);
    }

    await addTransaction({
      date: date || new Date().toISOString(),
      type, amount: finalAmt, savings: finalSav, desc, category: cat, deadline: jobDeadline, requester
    });
    
    await fetchData();
    setIsLoading(false);
    setAmount(''); setDesc(''); setDate(''); setIsGaji(false); setJobDeadline(''); setRequester(''); 
    alert('Tersimpan!');
  };

  const generateICS = (title: string, dStr: string) => {
    const d = new Date(dStr);
    const fmt = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15);
    const content = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${fmt(d)}Z\nDTEND:${fmt(new Date(d.getTime()+3600000))}Z\nSUMMARY:${title}\nBEGIN:VALARM\nTRIGGER:-PT1H\nACTION:DISPLAY\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(new Blob([content], {type:'text/calendar'}));
    link.download = `Job-${title}.ics`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleLogout = async () => { await logout(); window.location.reload(); };

  // --- VIEWS ---
  const HomeView = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-indigo-500/20">
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs uppercase font-bold">Saldo Tersedia</p>
          <h2 className="text-4xl font-bold mt-2">Rp {stats.balance.toLocaleString()}</h2>
          <div className="mt-4 inline-flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
            <span>🏦</span><span className="text-xs font-medium text-indigo-100">Tabungan: Rp {stats.savings.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-red-900/30">
          <p className="text-xs text-red-400 font-bold uppercase">Keluar Bulan Ini</p>
          <p className="text-lg font-bold text-red-400 mt-1">Rp {stats.expenseThisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-green-900/30">
           <p className="text-xs text-green-400 font-bold uppercase">Kondisi</p>
           <p className="text-lg font-bold text-green-400 mt-1">{stats.balance > 500000 ? 'Aman 👍' : 'Hemat! ⚠️'}</p>
        </div>
      </div>
      <div className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800">
         <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-200 text-sm">Job Terdekat</h3>
            <span className="text-xs bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded-full font-bold">Deadline</span>
         </div>
         {transactions.filter(t => t.type === 'REMINDER').slice(0,2).map((job, i) => (
           <div key={i} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
             <div>
               <span className="text-sm text-gray-300 font-bold block">{job.desc}</span>
               <span className="text-[10px] text-gray-500">Req: {job.requester}</span>
             </div>
             <span className="text-xs text-gray-500">{new Date(job.deadline).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</span>
           </div>
         ))}
      </div>
    </div>
  );

  const InputView = () => (
    <div className="h-full flex flex-col animate-fade-in max-w-lg mx-auto">
      <div className="bg-[#1e1e1e] p-1 rounded-xl flex mb-6 border border-gray-800 shrink-0">
        <button onClick={()=>setInputType('IN')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${inputType==='IN'?'bg-[#2a2a2a] text-green-400':'text-gray-500'}`}>Pemasukan</button>
        <button onClick={()=>setInputType('OUT')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${inputType==='OUT'?'bg-[#2a2a2a] text-red-400':'text-gray-500'}`}>Pengeluaran</button>
      </div>
      <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-5">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500"/>
        <div className="relative">
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold ${inputType==='IN'?'text-green-500':'text-red-500'}`}>Rp</span>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full pl-12 bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl font-bold text-xl outline-none focus:border-indigo-500" placeholder="0"/>
        </div>
        <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none" placeholder={inputType==='IN'?"Sumber Dana":"Keperluan"}/>
        {inputType === 'IN' && (
          <div className="flex items-center gap-3 bg-blue-900/20 p-4 rounded-xl border border-blue-900/50 cursor-pointer" onClick={()=>setIsGaji(!isGaji)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isGaji?'bg-blue-500 border-blue-500':'border-gray-500'}`}>{isGaji&&<span className="text-white text-xs">✓</span>}</div>
            <div><p className="font-bold text-blue-200 text-sm">Gaji Bulanan?</p><p className="text-xs text-blue-400/70">Potong 15% otomatis.</p></div>
          </div>
        )}
        <button disabled={isLoading} className={`w-full py-4 rounded-xl font-bold text-white mt-auto ${inputType==='IN'?'bg-green-700':'bg-red-700'}`}>{isLoading?'Menyimpan...':'Simpan'}</button>
      </form>
    </div>
  );

  const JobView = () => (
    <div className="h-full flex flex-col animate-fade-in max-w-2xl mx-auto">
       <form onSubmit={handleSave} className="space-y-4">
          <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500" placeholder="Nama Kegiatan"/>
          <input type="text" value={requester} onChange={e=>setRequester(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500" placeholder="Requester (Siapa yg minta)"/>
          <input type="datetime-local" value={jobDeadline} onChange={e=>setJobDeadline(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500 [color-scheme:dark]"/>
          <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={()=>setAddToCalendar(!addToCalendar)}>
             <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${addToCalendar?'bg-indigo-600 border-indigo-600':'border-gray-500'}`}>{addToCalendar&&<span className="text-white text-xs">✓</span>}</div>
             <span className="text-sm font-medium text-gray-300">Simpan ke Kalender HP?</span>
          </div>
          <button className="w-full bg-indigo-700 text-white py-4 rounded-xl font-bold">Simpan Tugas</button>
       </form>
       <div className="mt-8 flex-1 overflow-y-auto no-scrollbar pb-20 space-y-2">
         {transactions.filter(t => t.type === 'REMINDER').map((j, i) => (
           <div key={i} className="bg-[#1e1e1e] p-3 rounded-xl border border-gray-800 flex justify-between items-center">
             <div>
               <p className="text-sm font-bold text-gray-200">{j.desc}</p>
               <span className="text-[10px] bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/30">Req: {j.requester}</span>
             </div>
             <div className="text-right"><span className="text-xs text-gray-500 block">{new Date(j.deadline).toLocaleDateString()}</span><span className="text-xs font-bold text-gray-300">{new Date(j.deadline).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div>
           </div>
         ))}
       </div>
    </div>
  );

  const HistoryView = () => {
    let runBal = 0;
    const data = transactions.filter(t=>t.type!=='REMINDER').reverse().map(t=>{ if(t.type==='IN') runBal+=t.amount; if(t.type==='OUT') runBal-=t.amount; return {...t, bal:runBal}; }).reverse();
    return (
      <div className="h-full flex flex-col animate-fade-in">
        <div className="flex gap-2 mb-4 shrink-0">
          <button onClick={()=>setHistoryType('DAILY')} className={`px-4 py-2 rounded-full text-xs font-bold border transition ${historyType==='DAILY'?'bg-indigo-600 text-white border-indigo-600':'bg-[#1e1e1e] text-gray-500 border-gray-700'}`}>Harian</button>
        </div>
        <div className="flex-1 overflow-y-auto -mx-2 px-2 no-scrollbar space-y-3 pb-4">
          {data.map((t,i) => (
            <div key={i} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-sm">
               <div className="flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${t.type==='IN'?'bg-green-900/20 text-green-500':'bg-red-900/20 text-red-500'}`}>{t.type==='IN'?'↓':'↑'}</div>
                  <div><p className="font-bold text-gray-200 text-sm line-clamp-1">{t.desc}</p><p className="text-xs text-gray-500">{t.date}</p></div>
               </div>
               <div className="text-right">
                  <p className={`font-bold text-sm ${t.type==='IN'?'text-green-500':'text-red-500'}`}>{t.type==='IN'?'+':'-'} {t.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-600">Sisa: {t.bal.toLocaleString()}</p>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col md:flex-row font-sans text-gray-100 selection:bg-indigo-500/30">
      <aside className="hidden md:flex w-64 bg-[#1e1e1e] border-r border-gray-800 flex-col fixed h-full z-20">
         <div className="p-6 border-b border-gray-800"><h1 className="text-2xl font-extrabold text-indigo-500">MoneyApp.</h1></div>
         <nav className="flex-1 p-4 space-y-2">
            {[{id:'HOME',icon:'🏠',l:'Dashboard'},{id:'INPUT',icon:'📝',l:'Input'},{id:'HISTORY',icon:'📊',l:'Riwayat'},{id:'JOB',icon:'🔔',l:'Pekerjaan'}].map(m=>(
              <button key={m.id} onClick={()=>setActiveTab(m.id as TabType)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab===m.id?'bg-[#2a2a2a] text-indigo-400':'text-gray-500 hover:text-gray-300'}`}><span>{m.icon}</span>{m.l}</button>
            ))}
         </nav>
         <div className="p-4"><button onClick={handleLogout} className="w-full bg-red-900/20 text-red-500 py-2 rounded-lg text-xs font-bold border border-red-900/50 hover:bg-red-900/40">LOGOUT 🔒</button></div>
         <div className="p-6 border-t border-gray-800"><div className="text-sm font-mono font-bold text-gray-400 text-center">{time}</div></div>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden bg-[#1e1e1e] p-4 flex justify-between items-center shadow-md border-b border-gray-800 sticky top-0 z-10 shrink-0">
           <h1 className="font-bold text-lg text-gray-200">MoneyApp</h1>
           <div className="flex gap-2 items-center">
             <span className="text-[10px] font-bold text-gray-400 bg-[#2a2a2a] px-2 py-1 rounded border border-gray-700">{time}</span>
             <button onClick={handleLogout} className="text-[10px] bg-red-900/20 text-red-400 px-2 py-1 rounded border border-red-900/50">EXIT</button>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
           <div className="max-w-5xl mx-auto h-full pb-20 md:pb-0">
              {activeTab === 'HOME' && <HomeView />}
              {activeTab === 'INPUT' && <InputView />}
              {activeTab === 'HISTORY' && <HistoryView />}
              {activeTab === 'JOB' && <JobView />}
           </div>
        </div>
        <nav className="md:hidden bg-[#1e1e1e] border-t border-gray-800 flex justify-around p-3 pb-6 shrink-0 z-30">
           {[{id:'HOME',icon:'🏠',l:'Home'},{id:'INPUT',icon:'➕',l:'Input'},{id:'HISTORY',icon:'📜',l:'History'},{id:'JOB',icon:'🔔',l:'Job'}].map(m=>(
             <button key={m.id} onClick={()=>setActiveTab(m.id as TabType)} className={`flex flex-col items-center w-16 transition ${activeTab===m.id?'text-indigo-400 scale-110':'text-gray-600'}`}><span className="text-2xl mb-1">{m.icon}</span><span className="text-[10px] font-bold">{m.l}</span></button>
           ))}
        </nav>
      </main>
    </div>
  );
}