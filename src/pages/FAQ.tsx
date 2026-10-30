import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  HelpCircle, 
  Truck, 
  CreditCard, 
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: 'Pesanan & Pembayaran',
      icon: CreditCard,
      questions: [
        {
          q: 'Bagaimana cara melakukan pembayaran?',
          a: 'Setelah checkout, Anda akan diarahkan ke halaman detail pesanan. Silakan transfer sesuai nominal ke rekening simulasi kami dan unggah bukti transfer di tombol yang tersedia.'
        },
        {
          q: 'Berapa lama waktu yang diberikan untuk membayar?',
          a: 'Anda memiliki waktu 24 jam sejak pesanan dibuat. Jika dalam 24 jam bukti transfer tidak diunggah, pesanan akan otomatis dibatalkan dan stok akan dikembalikan ke gudang.'
        },
        {
          q: 'Apakah saya bisa membatalkan pesanan yang sudah dibayar?',
          a: 'Pesanan hanya dapat dibatalkan selama statusnya masih "Menunggu Pembayaran". Jika sudah dibayar dan diverifikasi, silakan hubungi admin kami melalui halaman Kontak.'
        }
      ]
    },
    {
      category: 'Pengiriman',
      icon: Truck,
      questions: [
        {
          q: 'Berapa biaya pengiriman di PetCare?',
          a: 'Saat ini kami menawarkan GRATIS ONGKIR untuk seluruh wilayah Indonesia sebagai bagian dari promo akademik kami.'
        },
        {
          q: 'Bagaimana cara melacak pesanan saya?',
          a: 'Setelah admin mengirimkan barang, nomor resi akan muncul di halaman Detail Pesanan Anda. Anda dapat memantau statusnya melalui tab Pesanan di Profil.'
        }
      ]
    },
    {
      category: 'Produk & Akun',
      icon: ShieldCheck,
      questions: [
        {
          q: 'Apakah semua produk dijamin original?',
          a: 'Tentu! Kami hanya bekerja sama dengan distributor resmi untuk memastikan semua nutrisi dan aksesoris yang Anda beli aman untuk anabul.'
        },
        {
          q: 'Bagaimana jika produk yang saya terima rusak?',
          a: 'Silakan ambil foto atau video unboxing dan segera hubungi tim dukungan kami dalam waktu 1x24 jam setelah barang diterima untuk proses klaim.'
        }
      ]
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Improved Hero Section */}
      <section className="relative pt-32 pb-24 bg-orange-600 overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10"><HelpCircle className="w-32 h-32 text-white" /></div>
          <div className="absolute bottom-10 right-10"><HelpCircle className="w-48 h-48 text-white" /></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><HelpCircle className="w-96 h-96 text-white" /></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center space-x-2 bg-orange-500/20 backdrop-blur-sm px-5 py-2.5 rounded-full border border-orange-400/30 mb-8 mx-auto">
              <HelpCircle className="h-5 w-5 text-orange-100" />
              <span className="text-sm font-bold text-white uppercase tracking-widest">Pusat Bantuan</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-8">
              Pertanyaan yang <br />Sering Diajukan
            </h1>
            <p className="text-orange-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Punya kendala dengan pesanan atau ingin tahu lebih lanjut tentang layanan kami? 
              Temukan solusinya di bawah ini.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="space-y-16">
          {faqs.map((group, groupIdx) => (
            <div key={group.category}>
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2.5 bg-orange-100 rounded-2xl text-orange-600">
                  <group.icon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{group.category}</h2>
              </div>
              
              <div className="grid gap-4">
                {group.questions.map((faq, idx) => {
                  const globalIdx = groupIdx * 10 + idx;
                  const isOpen = activeIndex === globalIdx;
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={false}
                      className={cn(
                        "rounded-[2rem] border transition-all duration-300",
                        isOpen 
                          ? "bg-white border-orange-200 shadow-xl shadow-orange-50" 
                          : "bg-gray-50 border-gray-100 hover:border-orange-100 hover:bg-white"
                      )}
                    >
                      <button
                        onClick={() => setActiveIndex(isOpen ? null : globalIdx)}
                        className="w-full flex items-center justify-between p-8 text-left outline-none"
                      >
                        <span className={cn(
                          "text-lg font-bold transition-colors",
                          isOpen ? "text-orange-600" : "text-gray-900"
                        )}>
                          {faq.q}
                        </span>
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          isOpen ? "bg-orange-600 text-white rotate-180" : "bg-white text-gray-400"
                        )}>
                          <ChevronDown className="h-5 w-5" />
                        </div>
                      </button>
                      
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                          >
                            <div className="px-8 pb-8 text-gray-600 leading-relaxed">
                              <div className="pt-4 border-t border-gray-50">
                                {faq.a}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Support CTA */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-xl">
            <h3 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Belum menemukan jawaban?</h3>
            <p className="text-gray-500 mb-10 text-lg">
              Tim support kami siap membantu Anda setiap hari pukul 08.00 - 21.00 WIB.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-orange-600 text-white font-bold px-10 py-4 rounded-full shadow-lg hover:bg-orange-700 transition-all">
                Hubungi Support
              </button>
              <button className="bg-white text-orange-600 border-2 border-orange-100 font-bold px-10 py-4 rounded-full hover:bg-orange-50 transition-all">
                Pelajari Layanan
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
