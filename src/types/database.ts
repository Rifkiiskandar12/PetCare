export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: 'customer' | 'staff' | 'admin'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'staff' | 'admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'staff' | 'admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string
          sku: string
          name: string
          description: string | null
          price: number
          stock_on_hand: number
          stock_reserved: number
          image_path: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          sku: string
          name: string
          description?: string | null
          price: number
          stock_on_hand?: number
          stock_reserved?: number
          image_path?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          sku?: string
          name?: string
          description?: string | null
          price?: number
          stock_on_hand?: number
          stock_reserved?: number
          image_path?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      carts: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          subtotal: number
          shipping_cost: number
          total: number
          shipping_address: string
          contact_phone: string
          tracking_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          status?: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          subtotal: number
          shipping_cost?: number
          total: number
          shipping_address: string
          contact_phone: string
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          status?: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          subtotal?: number
          shipping_cost?: number
          total?: number
          shipping_address?: string
          contact_phone?: string
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name_snapshot: string
          sku_snapshot: string
          unit_price_snapshot: number
          quantity: number
          line_total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name_snapshot: string
          sku_snapshot: string
          unit_price_snapshot: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name_snapshot?: string
          sku_snapshot?: string
          unit_price_snapshot?: number
          quantity?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          attempt_no: number
          method: string
          status: 'not_submitted' | 'pending_verification' | 'approved' | 'rejected'
          amount: number
          proof_path: string | null
          submitted_at: string | null
          verified_by: string | null
          verified_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          attempt_no: number
          method?: string
          status?: 'not_submitted' | 'pending_verification' | 'approved' | 'rejected'
          amount: number
          proof_path?: string | null
          submitted_at?: string | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          attempt_no?: number
          method?: string
          status?: 'not_submitted' | 'pending_verification' | 'approved' | 'rejected'
          amount?: number
          proof_path?: string | null
          submitted_at?: string | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          product_id: string
          actor_id: string | null
          movement_type: 'stock_in' | 'adjustment' | 'reservation' | 'sale' | 'release'
          quantity_delta: number
          reserved_delta: number
          reason: string
          order_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          actor_id?: string | null
          movement_type: 'stock_in' | 'adjustment' | 'reservation' | 'sale' | 'release'
          quantity_delta?: number
          reserved_delta?: number
          reason: string
          order_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          actor_id?: string | null
          movement_type?: 'stock_in' | 'adjustment' | 'reservation' | 'sale' | 'release'
          quantity_delta?: number
          reserved_delta?: number
          reason?: string
          order_id?: string | null
          created_at?: string
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          old_status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled' | null
          new_status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          actor_id: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          old_status?: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled' | null
          new_status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          actor_id?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          old_status?: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled' | null
          new_status?: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          actor_id?: string | null
          note?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      checkout_cart: {
        Args: {
          p_shipping_address: string
          p_contact_phone: string
        }
        Returns: string
      }
      submit_payment_proof: {
        Args: {
          p_order_id: string
          p_proof_path: string
        }
        Returns: string
      }
      verify_simulated_payment: {
        Args: {
          p_payment_id: string
          p_approve: boolean
          p_rejection_reason?: string
        }
        Returns: undefined
      }
      cancel_pending_order: {
        Args: {
          p_order_id: string
        }
        Returns: undefined
      }
      ship_order: {
        Args: {
          p_order_id: string
          p_tracking_number: string
        }
        Returns: undefined
      }
      confirm_order_received: {
        Args: {
          p_order_id: string
        }
        Returns: undefined
      }
      adjust_stock: {
        Args: {
          p_product_id: string
          p_quantity_delta: number
          p_reason: string
        }
        Returns: undefined
      }
      admin_set_user_access: {
        Args: {
          p_target_user_id: string
          p_role: 'customer' | 'staff' | 'admin'
          p_is_active: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: 'customer' | 'staff' | 'admin'
      inventory_movement_type: 'stock_in' | 'adjustment' | 'reservation' | 'sale' | 'release'
      order_status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled'
      payment_status: 'not_submitted' | 'pending_verification' | 'approved' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
