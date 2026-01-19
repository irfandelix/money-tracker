'use client';
import { useState, useEffect } from 'react';
import { addTransaction, getTransactions } from './actions';

// --- TIPE DATA ---
type TabType = 'HOME' | 'INPUT' | 'HISTORY' | 'JOB';
type InputType = 'IN' | 'OUT';
type HistoryType = 'DAILY' | 'MONTHLY';

export default function DarkMoneyTracker() {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');
  const [inputType, setInputType] = useState<InputType>('IN');
  const [historyType, setHistoryType] = useState<HistoryType>('DAILY');
  
  // --- STATE DATA ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ balance: 0, savings: 0, expenseThisMonth: 0 });
  const [time, setTime] = useState('');
  
  // --- STATE FORM INPUT ---
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [requester, setRequester] = useState('');
  const [isGaji, setIsGaji] = useState(false);
  const [jobDeadline, setJobDeadline] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load Data & Jam
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

  // --- LOGIC: AMBIL DATA ---
  const fetchData = async () => {
    const res = await getTransactions();
    if (res.success) {
      setTransactions(res.data);
      let bal = 0, sav = 0, expMonth = 0;
      const currentMonth = new Date().getMonth();
      
      res.data.forEach((t: any) => {
        if(t.type === 'IN') { 
          bal += t.amount; 
          sav += t.savings; 
        } else if(t.type === 'OUT') { 
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

  // --- LOGIC: SIMPAN DATA ---
  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    let finalAmt = parseFloat(amount) || 0;
    let finalSav = 0;
    let type = 'REMINDER'; 
    let cat = '-';

    if (activeTab === 'INPUT') {
      type = inputType;
      if (inputType === 'IN') {
        if (isGaji) {
          finalSav = finalAmt * 0.15;
          finalAmt -= finalSav;
          cat = 'Gaji';
        } else cat = 'Pemasukan';
      } else {
        cat = 'Pengeluaran';
      }
    } else if (activeTab === 'JOB') {
      if (addToCalendar && jobDeadline) generateICS(desc, jobDeadline);
    }

    await addTransaction({
      date: date || new Date().toISOString(),
      type, amount: finalAmt, savings: finalSav, desc, category: cat, deadline: jobDeadline, requester
    });
    
    await fetchData();
    setIsLoading(false);
    setAmount(''); setDesc(''); setDate(''); setIsGaji(false); 
    setJobDeadline(''); setRequester(''); 
    alert('Data Berhasil Disimpan!');
  };

  const generateICS = (title: string, dStr: string) => {
    const d = new Date(dStr);
    const fmt = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15);
    const content = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${fmt(d)}Z\nDTEND:${fmt(new Date(d.getTime()+3600000))}Z\nSUMMARY:${title}\nBEGIN:VALARM\nTRIGGER:-PT1H\nACTION:DISPLAY\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(new Blob([content], {type:'text/calendar'}));
    link.download = `Job-${title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- KOMPONEN UI (DARK THEME) ---

  // 1. DASHBOARD
  const HomeView = () => (
    <div className="space-y-4 animate-fade-in">
      {/* Saldo Utama - Gradient Gelap Mewah */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-indigo-500/20">
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold">Saldo Tersedia</p>
          <h2 className="text-4xl font-bold mt-2">Rp {stats.balance.toLocaleString()}</h2>
          <div className="mt-4 inline-flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
            <span className="text-lg">🏦</span>
            <span className="text-xs font-medium text-indigo-100">Tabungan Aman: Rp {stats.savings.toLocaleString()}</span>
          </div>
        </div>
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/30 rounded-full blur-[50px] -mr-10 -mt-10"></div>
      </div>
      
      {/* Statistik Mini */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-red-900/30 shadow-sm">
          <p className="text-xs text-red-400 font-bold uppercase">Keluar Bulan Ini</p>
          <p className="text-lg font-bold text-red-400 mt-1">Rp {stats.expenseThisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-green-900/30 shadow-sm">
           <p className="text-xs text-green-400 font-bold uppercase">Kondisi Keuangan</p>
           <p className="text-lg font-bold text-green-400 mt-1">{stats.balance > 500000 ? 'Sehat 👍' : 'Hemat Dulu! ⚠️'}</p>
        </div>
      </div>

      {/* Widget Deadline */}
      <div className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 shadow-sm">
         <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-200 text-sm">Pekerjaan Terdekat</h3>
            <span className="text-xs bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 px-2 py-1 rounded-full font-bold">Job</span>
         </div>
         {transactions.filter(t => t.type === 'REMINDER').length > 0 ? (
           transactions.filter(t => t.type === 'REMINDER').slice(0,2).map((job, i) => (
             <div key={i} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
               <div>
                 <span className="text-sm text-gray-300 font-bold block">{job.desc}</span>
                 <span className="text-[10px] text-gray-500">Req: {job.requester}</span>
               </div>
               <span className="text-xs text-gray-500">{new Date(job.deadline).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</span>
             </div>
           ))
         ) : (
           <p className="text-sm text-gray-600 italic">Tidak ada tugas mendesak.</p>
         )}
      </div>
    </div>
  );

  // 2. INPUT
  const InputView = () => (
    <div className="h-full flex flex-col animate-fade-in max-w-lg mx-auto">
      {/* Switcher */}
      <div className="bg-[#1e1e1e] p-1 rounded-xl flex mb-6 shadow-inner border border-gray-800 shrink-0">
        <button onClick={()=>setInputType('IN')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${inputType==='IN' ? 'bg-[#2a2a2a] text-green-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}>Pemasukan</button>
        <button onClick={()=>setInputType('OUT')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${inputType==='OUT' ? 'bg-[#2a2a2a] text-red-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}>Pengeluaran</button>
      </div>

      <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-5">
        <div className="space-y-1">
           <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tanggal</label>
           <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500 transition placeholder-gray-600"/>
        </div>
        
        <div className="space-y-1">
           <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nominal (Rupiah)</label>
           <div className="relative">
             <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold ${inputType==='IN'?'text-green-500':'text-red-500'}`}>Rp</span>
             <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full pl-12 pr-4 py-3.5 text-xl font-bold bg-[#2a2a2a] text-white border border-gray-700 rounded-xl outline-none focus:border-indigo-500 transition placeholder-gray-600" placeholder="0"/>
           </div>
        </div>

        <div className="space-y-1">
           <label className="text-xs font-bold text-gray-500 uppercase ml-1">{inputType==='IN'?'Sumber Dana':'Keperluan'}</label>
           <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500 transition placeholder-gray-600" placeholder={inputType==='IN'?"Gaji / Bonus / Jual Barang":"Makan / Bensin / Listrik"}/>
        </div>

        {inputType === 'IN' && (
          <div className="flex items-center gap-3 bg-blue-900/20 p-4 rounded-xl border border-blue-900/50 cursor-pointer hover:bg-blue-900/30 transition" onClick={()=>setIsGaji(!isGaji)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${isGaji ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-gray-500'}`}>
               {isGaji && <span className="text-white text-xs">✓</span>}
            </div>
            <div>
              <p className="font-bold text-blue-200 text-sm">Ini Gaji Bulanan?</p>
              <p className="text-xs text-blue-400/70">Potong 15% ke tabungan otomatis.</p>
            </div>
          </div>
        )}

        <button disabled={isLoading} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg hover:brightness-110 transition-all mt-auto ${inputType==='IN'?'bg-green-700':'bg-red-700'}`}>
          {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </form>
    </div>
  );

  // 3. RIWAYAT
  const HistoryView = () => {
    const monthlyGroups: any = {};
    if(historyType === 'MONTHLY') {
      transactions.filter(t=>t.type==='OUT').forEach(t => {
        const m = t.date.split('/').slice(1).join('/'); 
        monthlyGroups[m] = (monthlyGroups[m] || 0) + t.amount;
      });
    }

    let runBal = 0;
    const moneyTransactions = transactions.filter(t => t.type !== 'REMINDER');
    const dailyData = [...moneyTransactions].reverse().map(t => {
       if(t.type==='IN') runBal += t.amount;
       if(t.type==='OUT') runBal -= t.amount;
       return {...t, bal: runBal};
    }).reverse();

    return (
      <div className="h-full flex flex-col animate-fade-in">
        <div className="flex gap-2 mb-4 shrink-0">
          <button onClick={()=>setHistoryType('DAILY')} className={`px-4 py-2 rounded-full text-xs font-bold border transition ${historyType==='DAILY'?'bg-indigo-600 text-white border-indigo-600':'bg-[#1e1e1e] text-gray-500 border-gray-700'}`}>Harian</button>
          <button onClick={()=>setHistoryType('MONTHLY')} className={`px-4 py-2 rounded-full text-xs font-bold border transition ${historyType==='MONTHLY'?'bg-indigo-600 text-white border-indigo-600':'bg-[#1e1e1e] text-gray-500 border-gray-700'}`}>Bulanan</button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 no-scrollbar">
          {historyType === 'DAILY' ? (
             <div className="space-y-3 pb-4">
               {dailyData.map((t,i) => (
                 <div key={i} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-sm hover:border-gray-700 transition">
                    <div className="flex gap-3 items-center">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${t.type==='IN'?'bg-green-900/20 text-green-500':'bg-red-900/20 text-red-500'}`}>
                         {t.type==='IN'?'↓':'↑'}
                       </div>
                       <div>
                          <p className="font-bold text-gray-200 text-sm line-clamp-1">{t.desc}</p>
                          <p className="text-xs text-gray-500">{t.date}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-bold text-sm ${t.type==='IN'?'text-green-500':'text-red-500'}`}>
                         {t.type==='IN'?'+':'-'} {t.amount.toLocaleString()}
                       </p>
                       <p className="text-[10px] text-gray-600">Sisa: {t.bal.toLocaleString()}</p>
                    </div>
                 </div>
               ))}
               {dailyData.length === 0 && <p className="text-center text-gray-600 mt-10">Belum ada transaksi.</p>}
             </div>
          ) : (
            <div className="space-y-3">
               {Object.entries(monthlyGroups).map(([m, tot]:any) => (
                 <div key={m} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-sm">
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-bold block">Bulan</span>
                      <span className="font-bold text-gray-200 text-lg">{m}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase font-bold block">Total Keluar</span>
                      <span className="font-bold text-red-400 text-lg">- {tot.toLocaleString()}</span>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 4. JOB
  const JobView = () => (
    <div className="h-full flex flex-col animate-fade-in max-w-2xl mx-auto">
       <div className="bg-yellow-900/20 p-4 rounded-xl border border-yellow-700/30 mb-6 hidden md:block">
          <h3 className="font-bold text-yellow-500 text-lg">Pengingat Kerja</h3>
          <p className="text-xs text-yellow-600/80">Catat detail pekerjaan & siapa yang meminta.</p>
       </div>

       <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kegiatan</label>
            <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500 transition placeholder-gray-600" placeholder="Cth: Rapat Anggaran"/>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Requester</label>
            <input type="text" value={requester} onChange={e=>setRequester(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500 transition placeholder-gray-600" placeholder="Cth: Pak Budi"/>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Deadline</label>
            <input type="datetime-local" value={jobDeadline} onChange={e=>setJobDeadline(e.target.value)} className="w-full bg-[#2a2a2a] text-white border border-gray-700 p-3.5 rounded-xl outline-none focus:border-indigo-500 transition [color-scheme:dark]"/>
          </div>
          
          <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={()=>setAddToCalendar(!addToCalendar)}>
             <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${addToCalendar ? 'bg-indigo-600 border-indigo-600' : 'bg-transparent border-gray-500'}`}>
                {addToCalendar && <span className="text-white text-xs">✓</span>}
             </div>
             <span className="text-sm font-medium text-gray-300">Simpan ke Kalender HP?</span>
          </div>

          <button className="w-full bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-600 transition">Simpan Tugas</button>
       </form>
       
       <div className="mt-8 flex-1 overflow-hidden flex flex-col">
         <h4 className="font-bold text-xs text-gray-500 mb-3 uppercase tracking-wider">Daftar Deadline</h4>
         <div className="space-y-2 overflow-y-auto no-scrollbar pb-20">
            {transactions.filter(t => t.type === 'REMINDER').map((j, i) => (
              <div key={i} className="bg-[#1e1e1e] p-3 rounded-xl border border-gray-800 shadow-sm flex justify-between items-center hover:border-gray-700 transition">
                <div className="flex-1">
                   <p className="text-sm font-bold text-gray-200">{j.desc}</p>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/30">Req: {j.requester}</span>
                   </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">{new Date(j.deadline).toLocaleDateString()}</span>
                  <span className="text-xs font-bold text-gray-300">{new Date(j.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
            {transactions.filter(t => t.type === 'REMINDER').length === 0 && <p className="text-center text-gray-600 text-sm py-4">Belum ada tugas.</p>}
         </div>
       </div>
    </div>
  );

  // --- MAIN LAYOUT (DARK) ---
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col md:flex-row font-sans text-gray-100 selection:bg-indigo-500/30">
      
      {/* 1. SIDEBAR (PC) */}
      <aside className="hidden md:flex w-64 bg-[#1e1e1e] border-r border-gray-800 flex-col fixed h-full z-20">
         <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-extrabold text-indigo-500 tracking-tight">MoneyApp<span className="text-gray-600">.</span></h1>
         </div>
         <nav className="flex-1 p-4 space-y-2">
            {[
              {id:'HOME', icon:'🏠', label:'Dashboard'},
              {id:'INPUT', icon:'📝', label:'Input Data'},
              {id:'HISTORY', icon:'📊', label:'Riwayat'},
              {id:'JOB', icon:'🔔', label:'Pekerjaan'},
            ].map(menu => (
              <button 
                key={menu.id} 
                onClick={()=>setActiveTab(menu.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab===menu.id ? 'bg-[#2a2a2a] text-indigo-400' : 'text-gray-500 hover:bg-[#252525] hover:text-gray-300'}`}
              >
                <span>{menu.icon}</span>{menu.label}
              </button>
            ))}
         </nav>
         <div className="p-6 border-t border-gray-800">
            <div className="text-xs text-gray-600 font-bold mb-2">SERVER TIME</div>
            <div className="text-sm font-mono font-bold text-gray-400 bg-[#121212] p-2 rounded text-center border border-gray-800">
              {time}
            </div>
         </div>
      </aside>

      {/* 2. KONTEN UTAMA */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        
        {/* Header Mobile */}
        <header className="md:hidden bg-[#1e1e1e] p-4 flex justify-between items-center shadow-md border-b border-gray-800 sticky top-0 z-10 shrink-0">
           <h1 className="font-bold text-lg text-gray-200">MoneyApp</h1>
           <span className="text-[10px] font-bold text-gray-400 bg-[#2a2a2a] px-2 py-1 rounded border border-gray-700">
             {time}
           </span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
           <div className="hidden md:block mb-6">
              <h2 className="text-3xl font-bold text-gray-100">
                {activeTab==='HOME' && 'Dashboard Overview'}
                {activeTab==='INPUT' && 'Catat Transaksi'}
                {activeTab==='HISTORY' && 'Riwayat Keuangan'}
                {activeTab==='JOB' && 'Daftar Pekerjaan'}
              </h2>
           </div>

           <div className="max-w-5xl mx-auto h-full pb-20 md:pb-0">
              {activeTab === 'HOME' && <HomeView />}
              {activeTab === 'INPUT' && <InputView />}
              {activeTab === 'HISTORY' && <HistoryView />}
              {activeTab === 'JOB' && <JobView />}
           </div>
        </div>

        {/* 3. MENU BAWAH (MOBILE) */}
        <nav className="md:hidden bg-[#1e1e1e] border-t border-gray-800 flex justify-around p-3 pb-6 shrink-0 z-30">
           {[
             {id:'HOME', icon:'🏠', label:'Home'},
             {id:'INPUT', icon:'➕', label:'Input'},
             {id:'HISTORY', icon:'📜', label:'History'},
             {id:'JOB', icon:'🔔', label:'Job'},
           ].map(menu => (
             <button key={menu.id} onClick={()=>setActiveTab(menu.id as TabType)} className={`flex flex-col items-center w-16 transition ${activeTab===menu.id?'text-indigo-400 scale-110':'text-gray-600'}`}>
                <span className="text-2xl mb-1">{menu.icon}</span>
                <span className="text-[10px] font-bold">{menu.label}</span>
             </button>
           ))}
        </nav>

      </main>
    </div>
  );
}