import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Database } from '../types/database';
import { toast } from 'react-hot-toast';

type CartItem = Database['public']['Tables']['cart_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row'];
};

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [user]);

  async function fetchCart() {
    if (!user) return;
    setLoading(true);
    try {
      // Find or create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        const { data: newCart, error: createError } = await (supabase
          .from('carts') as any)
          .insert({ user_id: user.id })
          .select('id')
          .single();
        if (createError) throw createError;
        cart = newCart;
      }

      if (!cart) throw new Error('Failed to create or find cart');

      const { data: cartItems, error } = await (supabase
        .from('cart_items') as any)
        .select('*, products(*)')
        .eq('cart_id', (cart as any).id);

      if (error) throw error;
      setItems(cartItems as CartItem[]);
    } catch (err: any) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }

  const addToCart = async (productId: string, quantity: number) => {
    if (!user) {
      toast.error('Silakan masuk untuk berbelanja');
      return;
    }

    try {
      // Get cart ID
      const { data: cart } = await (supabase
        .from('carts') as any)
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) throw new Error('Cart not found');

      // Check if item already exists
      const existingItem = items.find((item) => item.product_id === productId);

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const { error } = await (supabase
          .from('cart_items') as any)
          .insert({
            cart_id: (cart as any).id,
            product_id: productId,
            quantity,
          });
        if (error) throw error;
        await fetchCart();
        toast.success('Berhasil ditambahkan ke keranjang');
      }
    } catch (err: any) {
      toast.error('Gagal menambahkan ke keranjang');
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      const { error } = await (supabase
        .from('cart_items') as any)
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );
    } catch (err: any) {
      toast.error('Gagal memperbarui jumlah');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success('Item dihapus');
    } catch (err: any) {
      toast.error('Gagal menghapus item');
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce(
    (acc, item) => acc + item.products.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, loading, addToCart, updateQuantity, removeItem, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
