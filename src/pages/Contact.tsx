import { motion } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Instagram, 
  Twitter, 
  Facebook,
  Clock,
  MessageCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function Contact() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Pesan Anda telah terkirim! Tim kami akan segera menghubungi Anda.');
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'WhatsApp / Telepon',
      value: '+62 812 3456 7890',
      description: 'Respons cepat setiap hari'
    },
    {
      icon: Mail,
      title: 'Email Resmi',
      value: 'info@petcare.test',
      description: 'Balasan dalam 1x24 jam'
    },
    {
      icon: MapPin,
      title: 'Alamat Store',
      value: 'Jl. Petshop No. 123, Jakarta Selatan',
      description: 'Datang & temui kami langsung'
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-orange-50 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-orange-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-orange-300 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white px-5 py-2.5 rounded-full shadow-sm mb-8 border border-orange-100">
              <MessageCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-bold text-orange-900 uppercase tracking-widest">Hubungi Kami</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-8">
              Punya <span className="text-orange-600">Pertanyaan?</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Tim PetCare siap memberikan solusi terbaik untuk setiap kebutuhan dan kenyamanan anabul kesayangan Anda.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Informasi Kontak</h2>
              <p className="text-gray-500 text-sm mb-8">Tim support kami tersedia 7 hari seminggu.</p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start space-x-5 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{item.title}</h3>
                    <p className="text-gray-900 font-extrabold text-lg my-1">{item.value}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-8 bg-orange-600 rounded-[3rem] text-white shadow-2xl shadow-orange-200">
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="h-6 w-6 text-orange-200" />
                <h3 className="font-bold text-xl">Jam Operasional</h3>
              </div>
              <div className="space-y-3 text-orange-100 text-sm">
                <div className="flex justify-between border-b border-orange-500/30 pb-2">
                  <span>Senin - Jumat</span>
                  <span className="font-bold text-white">08:00 - 21:00</span>
                </div>
                <div className="flex justify-between border-b border-orange-500/30 pb-2">
                  <span>Sabtu</span>
                  <span className="font-bold text-white">09:00 - 20:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Minggu</span>
                  <span className="font-bold text-white">10:00 - 18:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 md:p-16 rounded-[3.5rem] border border-gray-100 shadow-2xl"
            >
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Kirim Pesan Langsung</h2>
                <p className="text-gray-500">Punya kendala pesanan atau ingin bekerja sama? Isi formulir di bawah.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-2">Nama Lengkap</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-2">Email</label>
                    <input 
                      required
                      type="email" 
                      placeholder="budi@example.com"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-2">Topik Pesan</label>
                  <select className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none bg-white">
                    <option>Masalah Pesanan & Pengiriman</option>
                    <option>Informasi Stok Produk</option>
                    <option>Kritik & Saran</option>
                    <option>Lainnya</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-2">Pesan Anda</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Tuliskan pesan Anda di sini..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                  ></textarea>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full py-5 rounded-2xl shadow-xl shadow-orange-100 text-lg font-bold"
                  isLoading={loading}
                >
                  <Send className="h-5 w-5 mr-3" />
                  Kirim Pesan
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Media Footer CTA */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-8">Ikuti Kami di Media Sosial</h3>
          <div className="flex justify-center space-x-6">
            {[Instagram, Twitter, Facebook].map((Icon, idx) => (
              <motion.button 
                key={idx}
                whileHover={{ scale: 1.1, y: -5 }}
                className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-orange-600 hover:text-white hover:bg-orange-600 transition-all"
              >
                <Icon className="h-6 w-6" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
