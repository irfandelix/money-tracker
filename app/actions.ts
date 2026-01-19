'use server';
import { doc } from '@/lib/googleSheets';

export async function addTransaction(formData: any) {
  try {
    await doc.loadInfo();
    
    if (formData.type === 'REMINDER') {
      const sheetJob = doc.sheetsByIndex[1]; // Sheet 2 (Pekerjaan)
      if (!sheetJob) throw new Error("Sheet 2 tidak ditemukan!");
      
      // Simpan sesuai Header baru
      await sheetJob.addRow({
        Kegiatan: formData.desc,       // Kita pakai variable desc untuk Kegiatan
        Requester: formData.requester, // Variable baru
        Deadline: formData.deadline
      });
    } else {
      const sheetMoney = doc.sheetsByIndex[0]; // Sheet 1 (Uang)
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
    
    // 1. Data Uang (Sheet 1)
    const sheetMoney = doc.sheetsByIndex[0];
    const rowsMoney = await sheetMoney.getRows();
    const dataMoney = rowsMoney.map((row) => ({
      date: row.get('Tanggal'),
      type: row.get('Tipe'),
      category: row.get('Kategori'),
      desc: row.get('Deskripsi'),
      amount: parseInt(row.get('Nominal') || '0'),
      savings: parseInt(row.get('Tabungan') || '0'),
      requester: '-', // Uang tidak ada requester
      deadline: '-',
    }));

    // 2. Data Pekerjaan (Sheet 2)
    let dataJobs: any[] = [];
    const sheetJob = doc.sheetsByIndex[1];
    
    if (sheetJob) {
      const rowsJobs = await sheetJob.getRows();
      dataJobs = rowsJobs.map((row) => ({
        date: '-', 
        type: 'REMINDER',
        category: 'Pekerjaan',
        desc: row.get('Kegiatan'),      // Ambil dari kolom Kegiatan
        requester: row.get('Requester'), // Ambil dari kolom Requester
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