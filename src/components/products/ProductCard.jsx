import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryLabels = {
  dekorasyon: 'Dekorasyon',
  fonksiyonel: 'Fonksiyonel',
  oyuncak: 'Oyuncak',
  aksesuar: 'Aksesuar',
  hobi: 'Hobi',
  diger: 'Diğer'
};

export default function ProductCard({ product, onAddToCart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="group overflow-hidden bg-card border-border/50 hover:border-primary/30 transition-all duration-300">
        <Link to={`/products/${product.id}`}>
          <div className="aspect-square overflow-hidden bg-secondary/50 relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            {product.featured && (
              <Badge className="absolute top-3 left-3 bg-primary/90">Öne Çıkan</Badge>
            )}
            {!product.in_stock && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <Badge variant="destructive">Stokta Yok</Badge>
              </div>
            )}
          </div>
        </Link>

        <div className="p-4 space-y-3">
          <div>
            <Badge variant="outline" className="text-[10px] mb-2">
              {categoryLabels[product.category] || product.category}
            </Badge>
            <Link to={`/products/${product.id}`}>
              <h3 className="font-heading font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>
            {product.material && (
              <p className="text-xs text-muted-foreground mt-1">{product.material}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-heading font-bold text-lg text-primary">
              ₺{product.price?.toFixed(2)}
            </span>
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              disabled={!product.in_stock}
              className="gap-1.5 text-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Sepete Ekle
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}