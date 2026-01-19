import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// LOGIKA PEMBERSIH KUNCI (CLEANER)
// Ini akan mengubah tulisan "\n" menjadi baris baru yang asli
const formatPrivateKey = (key: string) => {
  return key.replace(/\\n/g, '\n');
};

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  // Kita bersihkan kuncinya di sini sebelum dipakai
  key: process.env.GOOGLE_PRIVATE_KEY
    ? formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY)
    : undefined,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);