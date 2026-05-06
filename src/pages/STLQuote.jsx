import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, FileUp, CheckCircle, ShoppingCart, Info, Layers3, Calculator } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { addCustomToCart } from '@/lib/cartUtils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Malzeme maliyeti ₺/gram
const materials = {
  PLA:   { gramCost: 0.70, name: 'PLA',   desc: 'Ekonomik, çevre dostu' },
  PETG:  { gramCost: 0.60, name: 'PETG',  desc: 'Güçlü, esnek' },
  ABS:   { gramCost: 0.80, name: 'ABS',   desc: 'Dayanıklı, ısıya dirençli' },
  TPU:   { gramCost: 1.10, name: 'TPU',   desc: 'Esnek, kauçuk benzeri' },
  Resin: { gramCost: 1.80, name: 'Resin', desc: 'Yüksek detay, pürüzsüz' },
};

const colors = [
  { value: 'beyaz',    label: 'Beyaz' },
  { value: 'siyah',    label: 'Siyah' },
  { value: 'kirmizi',  label: 'Kırmızı' },
  { value: 'mavi',     label: 'Mavi' },
  { value: 'yesil',    label: 'Yeşil' },
  { value: 'sari',     label: 'Sarı' },
  { value: 'turuncu',  label: 'Turuncu' },
  { value: 'gri',      label: 'Gri' },
];

/**
 * Fiyat formülü:
 *   malzeme_maliyet = gram * gramCost
 *   iscilik        = dakika / 1.8
 *   satis_fiyati   = (malzeme + iscilik) * 1.25
 */
function calculatePrice(gram, dakika, mat) {
  const malzemeMaliyet = gram * materials[mat].gramCost;
  const isciliK = dakika / 1.8;
  const toplamMaliyet = malzemeMaliyet + isciliK;
  const satisFiyati = toplamMaliyet * 1.25;

  return {
    gram,
    dakika,
    malzemeMaliyet: Math.round(malzemeMaliyet * 100) / 100,
    isciliK: Math.round(isciliK * 100) / 100,
    toplamMaliyet: Math.round(toplamMaliyet * 100) / 100,
    total: Math.max(Math.round(satisFiyati * 100) / 100, 30),
  };
}

export default function STLQuote() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('beyaz');
  const [gramInput, setGramInput] = useState('');
  const [dakikaInput, setDakikaInput] = useState('');
  const [price, setPrice] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

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
    setUploading(false);
    toast.success('Dosya yüklendi! Gramaj ve süreyi girerek fiyat alın.');
  };

  const handleCalculate = () => {
    const gram = parseFloat(gramInput);
    const dakika = parseFloat(dakikaInput);
    if (!gram || gram <= 0 || !dakika || dakika <= 0) {
      toast.error('Lütfen geçerli gramaj ve baskı süresi girin.');
      return;
    }
    setPrice(calculatePrice(gram, dakika, material));
    setAddedToCart(false);
  };

  const handleMaterialChange = (mat) => {
    setMaterial(mat);
    if (price) {
      const gram = parseFloat(gramInput);
      const dakika = parseFloat(dakikaInput);
      if (gram > 0 && dakika > 0) setPrice(calculatePrice(gram, dakika, mat));
    }
  };

  const handleAddToCart = () => {
    const name = file ? `Özel Baskı: ${file.name}` : 'Özel STL Baskısı';
    addCustomToCart({
      name,
      price: price.total,
      stl_file_url: fileUrl,
      material,
      color,
    });
    setAddedToCart(true);
    toast.success('Özel baskı sepete eklendi!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">STL Fiyat Teklifi</h1>
        <p className="text-muted-foreground">Slicerdan aldığınız gramaj ve süreyi girerek anında fiyat hesaplayın</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">

          {/* File Upload (optional) */}
          <Card className="p-6 border-border/50">
            <h2 className="font-heading font-semibold mb-1 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-primary" />
              STL Dosyası
              <span className="text-xs text-muted-foreground font-normal ml-1">(isteğe bağlı)</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Dosyayı siparişe eklemek için yükleyin</p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
              <input type="file" accept=".stl" onChange={handleFileUpload} className="hidden" />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-7 h-7 text-primary" />
                  <p className="text-xs font-medium">{file.name}</p>
                  <p className="text-xs text-primary">Değiştirmek için tıklayın</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-7 h-7 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">STL dosyanızı sürükleyin veya tıklayın</p>
                </div>
              )}
            </label>
          </Card>

          {/* Slicer Values */}
          <Card className="p-6 border-border/50">
            <h2 className="font-heading font-semibold mb-1 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              Slicer Değerleri
            </h2>
            <p className="text-xs text-muted-foreground mb-5">Cura, PrusaSlicer vb. programdan aldığınız tahmini değerleri girin</p>

            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Gramaj (g)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="örn: 45"
                  value={gramInput}
                  onChange={(e) => setGramInput(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Baskı Süresi (dk)</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="örn: 180"
                  value={dakikaInput}
                  onChange={(e) => setDakikaInput(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Süreyi saat olarak biliyorsanız 60 ile çarpın (örn: 3 saat = 180 dk)
            </p>
          </Card>

          {/* Material & Options */}
          <Card className="p-6 border-border/50">
            <h2 className="font-heading font-semibold mb-5 flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-primary" />
              Baskı Seçenekleri
            </h2>

            <div className="space-y-5">
              {/* Material */}
              <div>
                <label className="text-sm font-medium mb-2.5 block">Malzeme</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(materials).map(([key, val]) => (
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
                      <p className="text-xs text-primary mt-1">₺{val.gramCost}/g</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
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

          <Button onClick={handleCalculate} size="lg" className="w-full h-12 gap-2">
            <Calculator className="w-4 h-4" />
            Fiyat Hesapla
          </Button>
        </div>

        {/* Price Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <AnimatePresence mode="wait">
              {price ? (
                <motion.div
                  key="price"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="p-6 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                    <h2 className="font-heading font-semibold mb-5">Fiyat Teklifi</h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gramaj</span>
                        <span className="font-medium">{price.gram} g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Baskı Süresi</span>
                        <span className="font-medium">~{price.dakika} dk</span>
                      </div>

                      <div className="h-px bg-border/50 my-1" />

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Malzeme maliyeti</span>
                        <span>₺{price.malzemeMaliyet.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">İşçilik (dk÷1.8)</span>
                        <span>₺{price.isciliK.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Ara toplam</span>
                        <span>₺{price.toplamMaliyet.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Kâr (%25)</span>
                        <span>₺{(price.total - price.toplamMaliyet).toFixed(2)}</span>
                      </div>

                      <div className="h-px bg-border my-1" />

                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Toplam</span>
                        <span className="text-2xl font-heading font-bold text-primary">₺{price.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full gap-2 h-11"
                      onClick={handleAddToCart}
                      disabled={addedToCart}
                    >
                      {addedToCart ? (
                        <><CheckCircle className="w-4 h-4" /> Sepete Eklendi</>
                      ) : (
                        <><ShoppingCart className="w-4 h-4" /> Sepete Ekle</>
                      )}
                    </Button>

                    <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/50">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Fiyat, slicerdan girilen değerlere göre hesaplanmıştır.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="p-6 border-border/50">
                    <div className="text-center py-8 space-y-3">
                      <Calculator className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Gramaj ve baskı süresini girerek<br />fiyat hesaplayın
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