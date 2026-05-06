import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Package, FileText } from 'lucide-react';
import { getCart, removeFromCart, updateCartQuantity, getCartTotal } from '@/lib/cartUtils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cart() {
  const [cart, setCart] = useState(getCart());

  useEffect(() => {
    const handler = () => setCart(getCart());
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  const handleRemove = (id) => {
    removeFromCart(id);
    setCart(getCart());
  };

  const handleQuantityChange = (id, delta) => {
    const item = cart.find(i => i.id === id);
    if (item) {
      updateCartQuantity(id, item.quantity + delta);
      setCart(getCart());
    }
  };

  const total = getCartTotal(cart);

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
        <h2 className="font-heading text-xl font-bold mb-2">Sepetiniz Boş</h2>
        <p className="text-muted-foreground text-sm mb-6">Ürün ekleyerek alışverişe başlayın.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/products">
            <Button variant="outline" className="gap-2">
              <Package className="w-4 h-4" /> Ürünleri İncele
            </Button>
          </Link>
          <Link to="/stl-quote">
            <Button className="gap-2">
              <FileText className="w-4 h-4" /> STL Yükle
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Alışverişe Devam Et
      </Link>

      <h1 className="font-heading text-3xl font-bold mb-8">Sepetim ({cart.length})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                <Card className="p-4 border-border/50">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.is_custom ? (
                            <FileText className="w-6 h-6 text-muted-foreground/30" />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground/30" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-sm truncate">{item.name}</h3>
                          {item.is_custom && (
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">{item.material}</Badge>
                              <Badge variant="outline" className="text-[10px]">{item.color}</Badge>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-heading font-bold text-primary">
                          ₺{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div>
          <Card className="p-6 border-border/50 sticky top-24">
            <h2 className="font-heading font-semibold mb-4">Sipariş Özeti</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>₺{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kargo</span>
                <span className="text-primary text-xs font-medium">Ücretsiz</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="font-semibold">Toplam</span>
                <span className="text-xl font-heading font-bold text-primary">₺{total.toFixed(2)}</span>
              </div>
            </div>

            <Link to="/checkout">
              <Button className="w-full h-11 gap-2">
                Siparişi Tamamla
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}