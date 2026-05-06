import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Package, Ruler, Weight, Palette } from 'lucide-react';
import { addToCart } from '@/lib/cartUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const categoryLabels = {
  dekorasyon: 'Dekorasyon',
  fonksiyonel: 'Fonksiyonel',
  oyuncak: 'Oyuncak',
  aksesuar: 'Aksesuar',
  hobi: 'Hobi',
  diger: 'Diğer'
};

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = window.location.pathname.split('/').pop();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Ürün bulunamadı.</p>
        <Link to="/products">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Ürünlere Dön
          </Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`${product.name} sepete eklendi!`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Ürünlere Dön
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-border/50">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <Badge variant="outline" className="mb-3">
              {categoryLabels[product.category] || product.category}
            </Badge>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-3xl font-heading font-bold text-primary">₺{product.price?.toFixed(2)}</p>
          </div>

          {product.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {product.material && (
              <div className="p-3 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Package className="w-3.5 h-3.5" /> Malzeme
                </div>
                <p className="font-medium text-sm">{product.material}</p>
              </div>
            )}
            {product.color && (
              <div className="p-3 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Palette className="w-3.5 h-3.5" /> Renk
                </div>
                <p className="font-medium text-sm">{product.color}</p>
              </div>
            )}
            {product.dimensions && (
              <div className="p-3 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Ruler className="w-3.5 h-3.5" /> Boyut
                </div>
                <p className="font-medium text-sm">{product.dimensions}</p>
              </div>
            )}
            {product.weight_grams && (
              <div className="p-3 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Weight className="w-3.5 h-3.5" /> Ağırlık
                </div>
                <p className="font-medium text-sm">{product.weight_grams}g</p>
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full gap-2 h-12"
            onClick={handleAddToCart}
            disabled={!product.in_stock}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.in_stock ? 'Sepete Ekle' : 'Stokta Yok'}
          </Button>
        </div>
      </div>
    </div>
  );
}