import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getCart, getCartTotal, clearCart } from '@/lib/cartUtils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const cart = getCart();
  const total = getCartTotal(cart);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    notes: ''
  });

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.customer_name || !form.customer_email || !form.customer_phone || !form.customer_address) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setSubmitting(true);
    
    await base44.entities.Order.create({
      ...form,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        is_custom: item.is_custom || false,
        stl_file_url: item.stl_file_url || '',
        material: item.material || '',
        color: item.color || ''
      })),
      total_amount: total,
      status: 'beklemede'
    });

    clearCart();
    toast.success('Siparişiniz başarıyla oluşturuldu!');
    navigate('/order-success');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Sepete Dön
      </Link>

      <h1 className="font-heading text-3xl font-bold mb-8">Sipariş Bilgileri</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border-border/50 space-y-4">
          <h2 className="font-heading font-semibold">Kişisel Bilgiler</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                placeholder="Ad Soyad"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>E-posta *</Label>
              <Input
                type="email"
                value={form.customer_email}
                onChange={(e) => handleChange('customer_email', e.target.value)}
                placeholder="email@ornek.com"
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Telefon *</Label>
            <Input
              value={form.customer_phone}
              onChange={(e) => handleChange('customer_phone', e.target.value)}
              placeholder="05XX XXX XX XX"
              className="bg-background"
            />
          </div>
        </Card>

        <Card className="p-6 border-border/50 space-y-4">
          <h2 className="font-heading font-semibold">Teslimat Bilgileri</h2>

          <div className="space-y-2">
            <Label>Adres *</Label>
            <Textarea
              value={form.customer_address}
              onChange={(e) => handleChange('customer_address', e.target.value)}
              placeholder="Teslimat adresi"
              className="bg-background h-24"
            />
          </div>

          <div className="space-y-2">
            <Label>Sipariş Notu</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Siparişle ilgili eklemek istediğiniz not (isteğe bağlı)"
              className="bg-background h-20"
            />
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-6 border-border/50">
          <h2 className="font-heading font-semibold mb-4">Sipariş Özeti</h2>
          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                <span>₺{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-border mb-3" />
          <div className="flex justify-between">
            <span className="font-semibold">Toplam</span>
            <span className="text-xl font-heading font-bold text-primary">₺{total.toFixed(2)}</span>
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full h-12 gap-2" disabled={submitting}>
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              İşleniyor...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Siparişi Onayla
            </>
          )}
        </Button>
      </form>
    </div>
  );
}