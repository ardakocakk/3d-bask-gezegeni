import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, FileUp, CheckCircle, ShoppingCart, Info, Layers3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { addCustomToCart } from '@/lib/cartUtils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const materials = {
  PLA:   { gramCost: 0.70, name: 'PLA',   desc: 'Ekonomik, çevre dostu' },
  PETG:  { gramCost: 0.60, name: 'PETG',  desc: 'Güçlü, esnek' },
  ABS:   { gramCost: 0.80, name: 'ABS',   desc: 'Dayanıklı, ısıya dirençli' },
  TPU:   { gramCost: 1.10, name: 'TPU',   desc: 'Esnek, kauçuk benzeri' },
  Resin: { gramCost: 1.80, name: 'Resin', desc: 'Yüksek detay, pürüzsüz' },
};

const infillOptions = [
  { value: 10,  label: '%10 – Çok Hafif', multiplier: 0.30 },
  { value: 20,  label: '%20 – Hafif',      multiplier: 0.40 },
  { value: 40,  label: '%40 – Standart',   multiplier: 0.55 },
  { value: 60,  label: '%60 – Güçlü',      multiplier: 0.72 },
  { value: 80,  label: '%80 – Çok Güçlü', multiplier: 0.88 },
  { value: 100, label: '%100 – Masif',     multiplier: 1.00 },
];

const sizeOptions = [
  { value: 'xs',  label: 'XS',  sub: '3 cm\'e kadar',  multiplier: 0.15 },
  { value: 'sm',  label: 'S',   sub: '3 – 6 cm',       multiplier: 0.35 },
  { value: 'md',  label: 'M',   sub: '6 – 10 cm',      multiplier: 0.65 },
  { value: 'lg',  label: 'L',   sub: '10 – 15 cm',     multiplier: 1.00 },
  { value: 'xl',  label: 'XL',  sub: '15 – 20 cm',     multiplier: 1.60 },
  { value: 'xxl', label: 'XXL', sub: '20 cm+',         multiplier: 2.40 },
];

const colors = [
  { value: 'beyaz',   label: 'Beyaz' },
  { value: 'siyah',   label: 'Siyah' },
  { value: 'kirmizi', label: 'Kırmızı' },
  { value: 'mavi',    label: 'Mavi' },
  { value: 'yesil',   label: 'Yeşil' },
  { value: 'sari',    label: 'Sarı' },
  { value: 'turuncu', label: 'Turuncu' },
  { value: 'gri',     label: 'Gri' },
];

function calculatePrice(fileSizeMB, mat, infillMult, sizeMult) {
  const solidGrams = fileSizeMB * 80;
  const estimatedMinutes = fileSizeMB * 120;
  const gram = solidGrams * infillMult * sizeMult;
  const malzemeMaliyet = gram * materials[mat].gramCost;
  const isciliK = estimatedMinutes / 1.8;
  const toplamMaliyet = malzemeMaliyet + isciliK;
  const satisFiyati = toplamMaliyet * 1.25;
  return {
    gram: Math.round(gram),
    estimatedMinutes: Math.round(estimatedMinutes),
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
  const [infill, setInfill] = useState(20);
  const [size, setSize] = useState('md');
  const [price, setPrice] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const recalculate = (fileSizeMB, mat, inf, sz) => {
    const infillOpt = infillOptions.find(o => o.value === inf);
    const sizeOpt = sizeOptions.find(o => o.value === sz);
    setPrice(calculatePrice(fileSizeMB, mat, infillOpt.multiplier, sizeOpt.multiplier));
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
    recalculate(fileSizeMB, material, infill, size);
    setUploading(false);
  };

  const handleMaterialChange = (mat) => {
    setMaterial(mat);
    if (file) recalculate(file.size / (1024 * 1024), mat, infill, size);
  };

  const handleInfillChange = (val) => {
    const num = Number(val);
    setInfill(num);
    if (file) recalculate(file.size / (1024 * 1024), material, num, size);
  };

  const handleSizeChange = (val) => {
    setSize(val);
    if (file) recalculate(file.size / (1024 * 1024), material, infill, val);
  };

  const handleAddToCart = () => {
    addCustomToCart({
      name: `Özel Baskı: ${file.name}`,
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
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">STL Dosyası Yükle</h1>
        <p className="text-muted-foreground">STL dosyanızı yükleyin, anında fiyat teklifi alın</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">

          {/* File Upload */}
          <Card className="p-6 border-border/50">
            <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-primary" />
              Dosya Yükleme
            </h2>
            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
              <input type="file" accept=".stl" onChange={handleFileUpload} className="hidden" />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Dosya yükleniyor...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-primary" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
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
                        material === key ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/30'
                      }`}
                    >
                      <p className="text-sm font-medium">{val.name}</p>
                      <p className="text-xs text-muted-foreground">{val.desc}</p>
                      <p className="text-xs text-primary mt-1">₺{val.gramCost}/g</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Infill */}
              <div>
                <label className="text-sm font-medium mb-2.5 block">
                  Doluluk Oranı
                  <span className="text-muted-foreground font-normal ml-2 text-xs">(sağlamlık)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {infillOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleInfillChange(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        infill === opt.value ? 'border-accent bg-accent/10' : 'border-border/50 hover:border-accent/30'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${infill === opt.value ? 'text-accent' : ''}`}>%{opt.value}</p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">{opt.label.split('–')[1].trim()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="text-sm font-medium mb-2.5 block">
                  Boyut
                  <span className="text-muted-foreground font-normal ml-2 text-xs">(modelin en büyük kenarı)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSizeChange(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        size === opt.value ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/30'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${size === opt.value ? 'text-primary' : ''}`}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">{opt.sub}</p>
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
        </div>

        {/* Price Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <AnimatePresence mode="wait">
              {price ? (
                <motion.div key="price" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card className="p-6 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                    <h2 className="font-heading font-semibold mb-5">Fiyat Teklifi</h2>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tahmini Gramaj</span>
                        <span className="font-medium">{price.gram} g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tahmini Baskı Süresi</span>
                        <span className="font-medium">~{price.estimatedMinutes} dk</span>
                      </div>
                      <div className="h-px bg-border/50 my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Malzeme maliyeti</span>
                        <span>₺{price.malzemeMaliyet.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">İşçilik</span>
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

                    <Button className="w-full gap-2 h-11" onClick={handleAddToCart} disabled={addedToCart}>
                      {addedToCart ? (
                        <><CheckCircle className="w-4 h-4" /> Sepete Eklendi</>
                      ) : (
                        <><ShoppingCart className="w-4 h-4" /> Sepete Ekle</>
                      )}
                    </Button>

                    <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/50">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Fiyat tahminidir, sipariş sonrası kesin fiyat iletilir.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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