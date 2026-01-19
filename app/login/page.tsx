'use client';
import { useState } from 'react';
import { verifyPin } from '../actions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('pin', pin);
    const res = await verifyPin(formData);

    if (res.success) {
      router.push('/');
    } else {
      setError('PIN Salah!');
      setIsLoading(false);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-xs bg-[#1e1e1e] p-8 rounded-3xl border border-gray-800 text-center shadow-2xl">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold mb-6">MoneyApp Locked</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full bg-[#2a2a2a] text-center text-3xl font-bold py-3 rounded-xl border border-gray-700 focus:border-indigo-500 outline-none tracking-widest"
            placeholder="••••••" autoFocus
          />
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button disabled={isLoading} className="w-full bg-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-500 transition">
            {isLoading ? 'Membuka...' : 'Buka'}
          </button>
        </form>
      </div>
    </div>
  );
}