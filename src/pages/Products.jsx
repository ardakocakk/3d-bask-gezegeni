import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '../components/products/ProductCard';
import { addToCart } from '@/lib/cartUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const categoryLabels = {
  all: 'Tümü',
  dekorasyon: 'Dekorasyon',
  fonksiyonel: 'Fonksiyonel',
  oyuncak: 'Oyuncak',
  aksesuar: 'Aksesuar',
  hobi: 'Hobi',
  diger: 'Diğer'
};

export default function Products() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [material, setMaterial] = useState('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ in_stock: true }, '-created_date', 100),
  });

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || p.category === category;
    const matchMaterial = material === 'all' || p.material === material;
    return matchSearch && matchCategory && matchMaterial;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Ürünlerimiz</h1>
        <p className="text-muted-foreground">3D baskı ile üretilmiş hazır ürünler</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-40 bg-card">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={material} onValueChange={setMaterial}>
          <SelectTrigger className="w-full sm:w-36 bg-card">
            <SelectValue placeholder="Malzeme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Malzemeler</SelectItem>
            <SelectItem value="PLA">PLA</SelectItem>
            <SelectItem value="ABS">ABS</SelectItem>
            <SelectItem value="PETG">PETG</SelectItem>
            <SelectItem value="TPU">TPU</SelectItem>
            <SelectItem value="Resin">Resin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border/50">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <SlidersHorizontal className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Aramanızla eşleşen ürün bulunamadı.</p>
        </div>
      )}
    </div>
  );
}