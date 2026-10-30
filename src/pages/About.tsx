import { motion } from 'motion/react';
import { PawPrint, Heart, ShieldCheck, Truck, Users, Award } from 'lucide-react';

export default function About() {
  const stats = [
    { label: 'Pelanggan Puas', value: '10,000+' },
    { label: 'Produk Pilihan', value: '500+' },
    { label: 'Tahun Pengalaman', value: '5+' },
    { label: 'Anabul Terawat', value: '25,000+' },
  ];

  const values = [
    {
      icon: Heart,
      title: 'Kasih Sayang Tanpa Batas',
      description: 'Setiap produk yang kami pilih didasari oleh kecintaan kami pada hewan peliharaan.'
    },
    {
      icon: ShieldCheck,
      title: 'Kualitas Terjamin',
      description: 'Hanya menyediakan produk original dan aman untuk kesehatan anabul Anda.'
    },
    {
      icon: Truck,
      title: 'Pengiriman Cepat',
      description: 'Kami memahami kebutuhan mendesak anabul Anda, pengiriman instan adalah prioritas kami.'
    },
    {
      icon: Award,
      title: 'Terpercaya',
      description: 'Telah dipercaya oleh ribuan pemilik hewan peliharaan di seluruh Indonesia.'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-orange-50">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-orange-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-orange-300 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center space-x-2 bg-white px-5 py-2.5 rounded-full shadow-sm mb-8 border border-orange-100">
              <PawPrint className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-bold text-orange-900 uppercase tracking-widest">Tentang PetCare</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-8">
              Lebih dari Sekedar <br /><span className="text-orange-600">Petshop Biasa</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Kami hadir untuk menjadi mitra terpercaya bagi Anda dalam memberikan kehidupan terbaik bagi hewan peliharaan kesayangan.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative z-20 -mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-xl shadow-orange-100/50 border border-gray-100 text-center"
              >
                <p className="text-3xl font-extrabold text-orange-600 mb-2">{stat.value}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">Misi Kami</h2>
              <div className="space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed">
                  Didirikan pada tahun 2019, PetCare bermula dari sebuah keinginan sederhana: memudahkan para pemilik hewan peliharaan untuk mendapatkan akses ke produk-produk berkualitas tinggi.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Kami percaya bahwa hewan peliharaan adalah anggota keluarga. Oleh karena itu, mereka berhak mendapatkan nutrisi terbaik, perawatan paling aman, dan kenyamanan maksimal.
                </p>
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Bergabunglah dengan Komunitas Kami</p>
                      <p className="text-sm text-gray-500">Ribuan paw-rents telah menjadi bagian dari keluarga PetCare.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-video rounded-[3rem] bg-gray-100 overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=2071&auto=format&fit=crop" 
                  alt="Happy pet owner"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 hidden md:block">
                <div className="flex items-center space-x-3">
                  <Heart className="h-8 w-8 text-red-500 fill-current" />
                  <span className="font-bold text-gray-900 italic">"Love what they love."</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nilai-Nilai Kami</h2>
            <p className="mt-4 text-gray-500">Prinsip yang mendasari setiap langkah pelayanan kami.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors">
                  <value.icon className="h-7 w-7 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-orange-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-orange-200">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10"><PawPrint className="h-12 w-12" /></div>
              <div className="absolute bottom-10 right-10"><PawPrint className="h-20 w-20" /></div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Siap Memberikan yang Terbaik untuk Anabul?</h2>
            <p className="text-orange-100 text-lg mb-10 max-w-2xl mx-auto">
              Jelajahi katalog kami dan temukan berbagai pilihan nutrisi serta aksesoris berkualitas premium.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-orange-600 font-bold px-10 py-4 rounded-full shadow-lg"
              >
                Belanja Sekarang
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-orange-700 text-white font-bold px-10 py-4 rounded-full shadow-lg"
              >
                Hubungi Kami
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
