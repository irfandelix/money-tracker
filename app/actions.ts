'use server';
import { doc } from '@/lib/googleSheets';
import { cookies } from 'next/headers';

// --- LOGIC LOGIN & LOGOUT ---
export async function verifyPin(formData: FormData) {
  const pin = formData.get('pin') as string;
  const correctPin = process.env.APP_PIN;

  if (pin === correctPin) {
    const cookieStore = await cookies();
    cookieStore.set('isLoggedIn', 'true', { 
      maxAge: 60 * 60 * 24 * 30, // 30 Hari
      httpOnly: true,
      path: '/'
    });
    return { success: true };
  } else {
    return { success: false };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('isLoggedIn');
}

// --- LOGIC DATABASE ---
export async function addTransaction(formData: any) {
  try {
    await doc.loadInfo();
    
    // Logic Sheet 2 (Pekerjaan)
    if (formData.type === 'REMINDER') {
      const sheetJob = doc.sheetsByIndex[1];
      if (!sheetJob) throw new Error("Sheet 2 (Pekerjaan) belum dibuat!");
      
      await sheetJob.addRow({
        Kegiatan: formData.desc,
        Requester: formData.requester,
        Deadline: formData.deadline
      });
    } 
    // Logic Sheet 1 (Uang)
    else {
      const sheetMoney = doc.sheetsByIndex[0];
      const d = new Date(formData.date);
      const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;

      await sheetMoney.addRow({
        Tanggal: dateStr,
        Tipe: formData.type,
        Kategori: formData.category || '-',
        Deskripsi: formData.desc,
        Nominal: formData.amount || 0,
        Tabungan: formData.savings || 0
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Gagal simpan:", error);
    return { success: false };
  }
}

export async function getTransactions() {
  try {
    await doc.loadInfo();
    
    // Ambil Data Uang
    const sheetMoney = doc.sheetsByIndex[0];
    const rowsMoney = await sheetMoney.getRows();
    const dataMoney = rowsMoney.map((row) => ({
      date: row.get('Tanggal'),
      type: row.get('Tipe'),
      category: row.get('Kategori'),
      desc: row.get('Deskripsi'),
      amount: parseInt(row.get('Nominal') || '0'),
      savings: parseInt(row.get('Tabungan') || '0'),
      requester: '-',
      deadline: '-',
    }));

    // Ambil Data Pekerjaan (Cek dulu Sheet 2 ada atau tidak)
    let dataJobs: any[] = [];
    const sheetJob = doc.sheetsByIndex[1];
    if (sheetJob) {
      const rowsJobs = await sheetJob.getRows();
      dataJobs = rowsJobs.map((row) => ({
        date: '-', 
        type: 'REMINDER',
        category: 'Pekerjaan',
        desc: row.get('Kegiatan'),
        requester: row.get('Requester'),
        amount: 0,
        savings: 0,
        deadline: row.get('Deadline'),
      }));
    }

    const allData = [...dataMoney, ...dataJobs];
    return { success: true, data: allData.reverse() };
  } catch (error) {
    console.error("Gagal ambil data:", error);
    return { success: false, data: [] };
  }
}