import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '../products/ProductCard';
import { addToCart } from '@/lib/cartUtils';

export default function FeaturedProducts() {
  const { data: products = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => base44.entities.Product.filter({ featured: true, in_stock: true }, '-created_date', 4),
  });

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-2">Öne Çıkan Ürünler</h2>
            <p className="text-muted-foreground text-sm">En popüler 3D baskı ürünlerimiz</p>
          </div>
          <Link to="/products">
            <Button variant="ghost" className="gap-2 text-sm hidden sm:flex">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/products">
            <Button variant="outline" className="gap-2">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}