import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileUp, CheckCircle, ShoppingCart, Info, Layers3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { addCustomToCart } from '@/lib/cartUtils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const materialPrices = {
  PLA: { perGram: 0.8, name: 'PLA', desc: 'Ekonomik, çevre dostu' },
  ABS: { perGram: 1.0, name: 'ABS', desc: 'Dayanıklı, ısıya dirençli' },
  PETG: { perGram: 1.2, name: 'PETG', desc: 'Güçlü, esnek' },
  TPU: { perGram: 1.5, name: 'TPU', desc: 'Esnek, kauçuk benzeri' },
  Resin: { perGram: 2.5, name: 'Resin', desc: 'Yüksek detay, pürüzsüz' }
};

const colors = [
  { value: 'beyaz', label: 'Beyaz' },
  { value: 'siyah', label: 'Siyah' },
  { value: 'kirmizi', label: 'Kırmızı' },
  { value: 'mavi', label: 'Mavi' },
  { value: 'yesil', label: 'Yeşil' },
  { value: 'sari', label: 'Sarı' },
  { value: 'turuncu', label: 'Turuncu' },
  { value: 'gri', label: 'Gri' },
];

export default function STLQuote() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('beyaz');
  const [price, setPrice] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const calculatePrice = (fileSizeMB, mat) => {
    const estimatedGrams = fileSizeMB * 15;
    const baseCost = estimatedGrams * materialPrices[mat].perGram;
    const laborCost = 25;
    const total = Math.max(baseCost + laborCost, 35);
    return {
      total: Math.round(total * 100) / 100,
      estimatedGrams: Math.round(estimatedGrams),
      materialCost: Math.round(baseCost * 100) / 100,
      laborCost
    };
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.stl')) {
      toast.error('Lütfen STL dosyası yükleyin.');
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setAddedToCart(false);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    setFileUrl(file_url);
    
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    const priceData = calculatePrice(fileSizeMB, material);
    setPrice(priceData);
    setUploading(false);
  };

  const handleMaterialChange = (mat) => {
    setMaterial(mat);
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      setPrice(calculatePrice(fileSizeMB, mat));
    }
  };

  const handleAddToCart = () => {
    addCustomToCart({
      name: `Özel Baskı: ${file.name}`,
      price: price.total,
      stl_file_url: fileUrl,
      material,
      color,
      file_size_mb: (file.size / (1024 * 1024)).toFixed(2)
    });
    setAddedToCart(true);
    toast.success('Özel baskı sepete eklendi!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">STL Dosyası Yükle</h1>
        <p className="text-muted-foreground">STL dosyanızı yükleyin, anında fiyat teklifi alın</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Upload & Options */}
        <div className="lg:col-span-3 space-y-6">
          {/* File Upload */}
          <Card className="p-6 border-border/50">
            <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-primary" />
              Dosya Yükleme
            </h2>

            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
              <input
                type="file"
                accept=".stl"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Dosya yükleniyor...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-primary">Başka dosya seçmek için tıklayın</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">STL dosyanızı buraya sürükleyin veya tıklayın</p>
                  <p className="text-xs text-muted-foreground/60">Maksimum 50MB</p>
                </div>
              )}
            </label>
          </Card>

          {/* Options */}
          <Card className="p-6 border-border/50">
            <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-primary" />
              Baskı Seçenekleri
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Malzeme</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(materialPrices).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => handleMaterialChange(key)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        material === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border/50 hover:border-primary/30'
                      }`}
                    >
                      <p className="text-sm font-medium">{val.name}</p>
                      <p className="text-xs text-muted-foreground">{val.desc}</p>
                      <p className="text-xs text-primary mt-1">₺{val.perGram}/g</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Renk</label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Price Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <AnimatePresence mode="wait">
              {price ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="p-6 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                    <h2 className="font-heading font-semibold mb-6">Fiyat Teklifi</h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tahmini Ağırlık</span>
                        <span>{price.estimatedGrams}g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Malzeme ({material})</span>
                        <span>₺{price.materialCost}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">İşçilik</span>
                        <span>₺{price.laborCost}</span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between">
                        <span className="font-semibold">Toplam</span>
                        <span className="text-2xl font-heading font-bold text-primary">₺{price.total}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full gap-2 h-11"
                      onClick={handleAddToCart}
                      disabled={addedToCart}
                    >
                      {addedToCart ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Sepete Eklendi
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Sepete Ekle
                        </>
                      )}
                    </Button>

                    <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/50">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Fiyat dosya boyutuna göre tahminidir. Karmaşık modellerde fiyat değişebilir.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="p-6 border-border/50">
                    <div className="text-center py-8">
                      <Upload className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Fiyat teklifi almak için STL dosyanızı yükleyin
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}