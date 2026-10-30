import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { ProductCard } from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal, Loader2, PackageX } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

type ProductWithCategory = Product & { categories: Category };

export default function Shop() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, sortBy]);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);
    if (!error) setCategories(data);
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*, categories(*)')
        .eq('is_active', true);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (sortBy === 'price_low') query = query.order('price', { ascending: true });
      else if (sortBy === 'price_high') query = query.order('price', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data as ProductWithCategory[]);
    } catch (err: any) {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }

  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const minPrice = priceRange.min ? Number(priceRange.min) : 0;
    const maxPrice = priceRange.max ? Number(priceRange.max) : Infinity;
    const matchesPrice = p.price >= minPrice && p.price <= maxPrice;

    return matchesSearch && matchesPrice;
  });

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast.error('Silakan masuk terlebih dahulu');
      navigate('/auth');
      return;
    }
    await addToCart(product.id, 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Katalog Produk</h1>
          <p className="mt-2 text-gray-500">Temukan kebutuhan terbaik untuk anabul kesayangan Anda.</p>
        </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="relative group flex-grow min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min Rp"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-24 p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max Rp"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-24 p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white min-w-[140px]"
            >
              <option value="newest">Terbaru</option>
              <option value="price_low">Termurah</option>
              <option value="price_high">Termahal</option>
            </select>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar / Filters (Optional for larger screens) */}
        <div className="hidden lg:block space-y-8">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Kategori</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  selectedCategory === null
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                )}
              >
                Semua Produk
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    selectedCategory === cat.id
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
            <PackageX className="h-8 w-8 text-orange-600 mb-4" />
            <h4 className="font-bold text-gray-900 mb-2">Butuh Bantuan?</h4>
            <p className="text-sm text-gray-600 mb-4">
              Tim kami siap membantu Anda memilih produk yang tepat untuk anabul.
            </p>
            <button className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Hubungi Kami &rarr;
            </button>
          </div>
        </div>

        {/* Main Product Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Skeleton className="h-10 flex-1 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
              <PackageX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Produk Tidak Ditemukan</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                Maaf, kami tidak dapat menemukan produk yang Anda cari. Coba gunakan kata kunci lain.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
