import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Save, Trash2, ListChecks, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { toast } from 'react-hot-toast';

interface Scenario {
  id: number;
  category: string;
  title: string;
  checked: boolean;
}

const CATEGORIES = [
  'Autentikasi & Pengguna',
  'Katalog & Pencarian',
  'Keranjang & Reservasi Stok',
  'Pembayaran & Pesanan (User)',
  'Admin - Ringkasan & Stats',
  'Admin - Kelola Produk',
  'Admin - Kelola Pesanan',
  'Admin - Keamanan & Audit'
];

const INITIAL_SCENARIOS: Scenario[] = [
  // Group 1: Autentikasi (1-10)
  { id: 1, category: 'Autentikasi & Pengguna', title: 'Register dengan data valid', checked: false },
  { id: 2, category: 'Autentikasi & Pengguna', title: 'Register dengan email yang sudah ada (harus gagal)', checked: false },
  { id: 3, category: 'Autentikasi & Pengguna', title: 'Register dengan password lemah (harus gagal)', checked: false },
  { id: 4, category: 'Autentikasi & Pengguna', title: 'Login dengan kredensial benar', checked: false },
  { id: 5, category: 'Autentikasi & Pengguna', title: 'Login dengan password salah', checked: false },
  { id: 6, category: 'Autentikasi & Pengguna', title: 'Login dengan email yang tidak terdaftar', checked: false },
  { id: 7, category: 'Autentikasi & Pengguna', title: 'Logout sesi dengan benar', checked: false },
  { id: 8, category: 'Autentikasi & Pengguna', title: 'Lupa password (request reset link)', checked: false },
  { id: 9, category: 'Autentikasi & Pengguna', title: 'Reset password dengan token valid', checked: false },
  { id: 10, category: 'Autentikasi & Pengguna', title: 'Akses halaman Profile tanpa login (harus redirect)', checked: false },

  // Group 2: Katalog (11-20)
  { id: 11, category: 'Katalog & Pencarian', title: 'Melihat semua produk di halaman Shop', checked: false },
  { id: 12, category: 'Katalog & Pencarian', title: 'Filter produk berdasarkan kategori', checked: false },
  { id: 13, category: 'Katalog & Pencarian', title: 'Cari produk berdasarkan nama', checked: false },
  { id: 14, category: 'Katalog & Pencarian', title: 'Cari produk berdasarkan SKU', checked: false },
  { id: 15, category: 'Katalog & Pencarian', title: 'Urutkan Harga: Rendah ke Tinggi', checked: false },
  { id: 16, category: 'Katalog & Pencarian', title: 'Urutkan Harga: Tinggi ke Rendah', checked: false },
  { id: 17, category: 'Katalog & Pencarian', title: 'Melihat detail produk (halaman produk)', checked: false },
  { id: 18, category: 'Katalog & Pencarian', title: 'Menampilkan badge "Low Stock" (stok <= 5)', checked: false },
  { id: 19, category: 'Katalog & Pencarian', title: 'Menampilkan badge "Out of Stock" (stok 0)', checked: false },
  { id: 20, category: 'Katalog & Pencarian', title: 'Detail produk menampilkan deskripsi & stok akurat', checked: false },

  // Group 3: Keranjang (21-30)
  { id: 21, category: 'Keranjang & Reservasi Stok', title: 'Menambah produk ke keranjang', checked: false },
  { id: 22, category: 'Keranjang & Reservasi Stok', title: 'Ubah jumlah (qty) di keranjang', checked: false },
  { id: 23, category: 'Keranjang & Reservasi Stok', title: 'Hapus item dari keranjang', checked: false },
  { id: 24, category: 'Keranjang & Reservasi Stok', title: 'Keranjang tetap ada setelah refresh halaman', checked: false },
  { id: 25, category: 'Keranjang & Reservasi Stok', title: 'Tambah ke keranjang TIDAK mengurangi stok on-hand', checked: false },
  { id: 26, category: 'Keranjang & Reservasi Stok', title: 'Checkout memanggil RPC checkout_cart', checked: false },
  { id: 27, category: 'Keranjang & Reservasi Stok', title: 'Checkout berhasil: Verifikasi stok_reserved bertambah', checked: false },
  { id: 28, category: 'Keranjang & Reservasi Stok', title: 'Cegah tambah item melebihi stok yang tersedia', checked: false },
  { id: 29, category: 'Keranjang & Reservasi Stok', title: 'Tampilkan error jika stok tiba-tiba habis saat checkout', checked: false },
  { id: 30, category: 'Keranjang & Reservasi Stok', title: 'Keranjang kosong otomatis setelah checkout berhasil', checked: false },

  // Group 4: Pembayaran (31-40)
  { id: 31, category: 'Pembayaran & Pesanan (User)', title: 'Lihat detail pesanan dengan status Menunggu Pembayaran', checked: false },
  { id: 32, category: 'Pembayaran & Pesanan (User)', title: 'Countdown 24 jam untuk batas waktu pembayaran', checked: false },
  { id: 33, category: 'Pembayaran & Pesanan (User)', title: 'Upload bukti pembayaran (gambar)', checked: false },
  { id: 34, category: 'Pembayaran & Pesanan (User)', title: 'Update bukti pembayaran sebelum diverifikasi admin', checked: false },
  { id: 35, category: 'Pembayaran & Pesanan (User)', title: 'Status pesanan berubah jadi "Menunggu Verifikasi"', checked: false },
  { id: 36, category: 'Pembayaran & Pesanan (User)', title: 'Pembatalan pesanan oleh user (sebelum diverifikasi)', checked: false },
  { id: 37, category: 'Pembayaran & Pesanan (User)', title: 'Pesanan batal: Reservasi stok dilepaskan kembali', checked: false },
  { id: 38, category: 'Pembayaran & Pesanan (User)', title: 'Lihat riwayat pesanan di halaman Profile', checked: false },
  { id: 39, category: 'Pembayaran & Pesanan (User)', title: 'Konfirmasi "Pesanan Diterima" oleh user', checked: false },
  { id: 40, category: 'Pembayaran & Pesanan (User)', title: 'Avatar user: Upload & simpan ke storage (FIX UUID)', checked: false },

  // Group 5: Admin Stats (41-45)
  { id: 41, category: 'Admin - Ringkasan & Stats', title: 'Lihat ringkasan (Total Order, Produk, User)', checked: false },
  { id: 42, category: 'Admin - Ringkasan & Stats', title: 'Grafik pendapatan 7 hari terakhir tampil akurat', checked: false },
  { id: 43, category: 'Admin - Ringkasan & Stats', title: 'Counter "Verifikasi Pending" sesuai dengan jumlah payment', checked: false },
  { id: 44, category: 'Admin - Ringkasan & Stats', title: 'Akses dashboard hanya untuk Admin/Staff', checked: false },
  { id: 45, category: 'Admin - Ringkasan & Stats', title: 'Customer biasa dilarang akses dashboard admin', checked: false },

  // Group 6: Admin Produk (46-50)
  { id: 46, category: 'Admin - Kelola Produk', title: 'Tambah produk baru dengan upload gambar', checked: false },
  { id: 47, category: 'Admin - Kelola Produk', title: 'Edit informasi produk yang sudah ada', checked: false },
  { id: 48, category: 'Admin - Kelola Produk', title: 'Soft delete: Nonaktifkan produk (bukan hapus permanen)', checked: false },
  { id: 49, category: 'Admin - Kelola Produk', title: 'Penyesuaian stok manual (RPC adjust_stock)', checked: false },
  { id: 50, category: 'Admin - Kelola Produk', title: 'Produk nonaktif tidak tampil di katalog customer', checked: false },

  // Group 7: Admin Pesanan (51-55)
  { id: 51, category: 'Admin - Kelola Pesanan', title: 'Verifikasi bukti pembayaran: Setujui (Approve)', checked: false },
  { id: 52, category: 'Admin - Kelola Pesanan', title: 'Verifikasi bukti pembayaran: Tolak (Reject) dengan alasan', checked: false },
  { id: 53, category: 'Admin - Kelola Pesanan', title: 'Input nomor resi pengiriman', checked: false },
  { id: 54, category: 'Admin - Kelola Pesanan', title: 'Status pesanan berubah: Processing -> Shipped', checked: false },
  { id: 55, category: 'Admin - Kelola Pesanan', title: 'Pembatalan pesanan oleh admin', checked: false },

  // Group 8: Admin Keamanan (56-60)
  { id: 56, category: 'Admin - Keamanan & Audit', title: 'Ubah peran user (Customer <-> Staff <-> Admin)', checked: false },
  { id: 57, category: 'Admin - Keamanan & Audit', title: 'Nonaktifkan/Suspend akun user', checked: false },
  { id: 58, category: 'Admin - Keamanan & Audit', title: 'Lihat Audit Logs untuk tindakan sensitif', checked: false },
  { id: 59, category: 'Admin - Keamanan & Audit', title: 'Metadata audit log menampilkan detail perubahan', checked: false },
  { id: 60, category: 'Admin - Keamanan & Audit', title: 'Storage RLS: User hanya bisa akses folder miliknya sendiri', checked: false },
];

export default function TestScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [expanded, setExpanded] = useState<string[]>(CATEGORIES);

  useEffect(() => {
    const saved = localStorage.getItem('petcare_test_scenarios');
    if (saved) {
      setScenarios(JSON.parse(saved));
    } else {
      setScenarios(INITIAL_SCENARIOS);
    }
  }, []);

  const toggleScenario = (id: number) => {
    const next = scenarios.map(s => s.id === id ? { ...s, checked: !s.checked } : s);
    setScenarios(next);
    localStorage.setItem('petcare_test_scenarios', JSON.stringify(next));
  };

  const toggleCategory = (cat: string) => {
    setExpanded(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const reset = () => {
    setScenarios(INITIAL_SCENARIOS);
    localStorage.removeItem('petcare_test_scenarios');
    toast.success('Progress direset');
  };

  const completedCount = scenarios.filter(s => s.checked).length;
  const progressPercent = Math.round((completedCount / scenarios.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <ListChecks className="mr-3 h-8 w-8 text-orange-600" />
            Checklist 60 Skenario Testing
          </h1>
          <p className="mt-2 text-gray-500">Berdasarkan PRD PetCare Petshop. Progress disimpan di browser Anda.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-xl">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kepatuhan PRD</p>
            <p className="text-2xl font-black text-orange-600">{progressPercent}%</p>
          </div>
          <div className="h-12 w-12 rounded-full border-4 border-orange-50 flex items-center justify-center">
             <ShieldCheck className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {CATEGORIES.map(cat => {
          const catScenarios = scenarios.filter(s => s.category === cat);
          const catCompleted = catScenarios.filter(s => s.checked).length;
          const isExpanded = expanded.includes(cat);

          return (
            <div key={cat} className="bg-white rounded-[2rem] border border-gray-100 shadow-lg overflow-hidden">
              <button 
                onClick={() => toggleCategory(cat)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                    catCompleted === catScenarios.length ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {catCompleted}/{catScenarios.length}
                  </div>
                  <h3 className="font-extrabold text-gray-900">{cat}</h3>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="px-8 pb-8 space-y-3">
                  {catScenarios.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => toggleScenario(s.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all",
                        s.checked ? "bg-orange-50/50 border-orange-200" : "bg-gray-50/50 border-gray-100 hover:border-orange-200"
                      )}
                    >
                      {s.checked ? (
                        <CheckCircle2 className="h-6 w-6 text-orange-600 shrink-0" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-300 shrink-0" />
                      )}
                      <div className="flex-grow">
                        <span className="text-xs font-bold text-gray-400 mb-1 block">S-{s.id}</span>
                        <p className={cn("font-bold text-sm", s.checked ? "text-orange-900" : "text-gray-700")}>
                          {s.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex justify-between items-center bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
            <Save className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold">Progress Tersimpan Otomatis</p>
            <p className="text-xs text-gray-400">Anda dapat melanjutkan testing kapan saja.</p>
          </div>
        </div>
        <Button variant="outline" className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full" onClick={reset}>
          <Trash2 className="h-4 w-4 mr-2" />
          Reset Semua
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
