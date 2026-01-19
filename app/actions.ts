'use server';
import { doc } from '@/lib/googleSheets';
import { cookies } from 'next/headers';

// --- LOGIC LOGIN & LOGOUT ---
export async function verifyPin(formData: FormData) {
  const pin = formData.get('pin') as string;
  const correctPin = process.env.APP_PIN;
  if (pin === correctPin) {
    const cookieStore = await cookies();
    cookieStore.set('isLoggedIn', 'true', { maxAge: 60 * 60 * 24 * 30, httpOnly: true, path: '/' });
    return { success: true };
  }
  return { success: false };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('isLoggedIn');
}

// --- LOGIC DATABASE (DIPERKUAT) ---
export async function addTransaction(formData: any) {
  try {
    await doc.loadInfo();
    
    // Simpan Pekerjaan (Sheet Index 1)
    if (formData.type === 'REMINDER') {
      const sheetJob = doc.sheetsByIndex[1]; 
      if (!sheetJob) throw new Error("Sheet 2 (Pekerjaan) tidak ditemukan di Google Sheet!");
      
      await sheetJob.addRow({
        'Kegiatan': formData.desc || '-',
        'Requester': formData.requester || '-',
        'Deadline': formData.deadline || '-'
      });
    } 
    // Simpan Uang (Sheet Index 0)
    else {
      const sheetMoney = doc.sheetsByIndex[0];
      const d = new Date(formData.date);
      const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
      await sheetMoney.addRow({
        'Tanggal': dateStr,
        'Tipe': formData.type,
        'Kategori': formData.category || '-',
        'Deskripsi': formData.desc,
        'Nominal': formData.amount || 0,
        'Tabungan': formData.savings || 0
      });
    }
    return { success: true };
  } catch (error) {
    console.error("GAGAL SIMPAN:", error);
    return { success: false };
  }
}

export async function getTransactions() {
  try {
    await doc.loadInfo();
    
    // 1. Ambil Data Uang
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

    // 2. Ambil Data Pekerjaan (Dengan Pengecekan Ekstra)
    let dataJobs: any[] = [];
    // Pastikan ada Sheet ke-2
    if (doc.sheetCount > 1) {
      const sheetJob = doc.sheetsByIndex[1];
      const rowsJobs = await sheetJob.getRows();
      
      dataJobs = rowsJobs.map((row) => {
        // Logika Pengaman: Coba ambil dengan berbagai variasi nama kolom
        const keg = row.get('Kegiatan') || row.get('kegiatan') || 'Tanpa Nama';
        const req = row.get('Requester') || row.get('requester') || '-';
        const dl = row.get('Deadline') || row.get('deadline') || new Date().toISOString();

        return {
          date: '-', 
          type: 'REMINDER', // PENTING: Ini kuncinya biar muncul di filter
          category: 'Pekerjaan',
          desc: keg,
          requester: req,
          amount: 0,
          savings: 0,
          deadline: dl,
        };
      });
    }

    // Gabung: Uang + Pekerjaan
    // Kita taruh Jobs di DEPAN array agar muncul paling atas setelah di-reverse
    const allData = [...dataMoney, ...dataJobs];
    
    // Debugging (Cek di Terminal Vercel/VSCode jika masih error)
    console.log(`Berhasil ambil: ${dataMoney.length} Transaksi, ${dataJobs.length} Pekerjaan.`);

    return { success: true, data: allData.reverse() };
  } catch (error) {
    console.error("GAGAL AMBIL DATA:", error);
    return { success: false, data: [] };
  }
}