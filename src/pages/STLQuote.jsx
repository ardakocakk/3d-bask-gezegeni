import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, FileUp, CheckCircle, ShoppingCart, Info, Layers3, Ruler, AlertTriangle, TriangleAlert, Microscope, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { addCustomToCart } from '@/lib/cartUtils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { parseSTLVolume, slicerEstimate } from '@/lib/stlParser';

const materials = {
  PLA:   { gramCost: 0.70, name: 'PLA',   desc: 'Ekonomik, çevre dostu' },
  PETG:  { gramCost: 0.60, name: 'PETG',  desc: 'Güçlü, esnek' },
  ABS:   { gramCost: 0.80, name: 'ABS',   desc: 'Dayanıklı, ısıya dirençli' },
  TPU:   { gramCost: 1.10, name: 'TPU',   desc: 'Esnek, kauçuk benzeri' },
  Resin: { gramCost: 1.80, name: 'Resin', desc: 'Yüksek detay, pürüzsüz' },
};

const infillOptions = [
  { value: 10,  label: '%10 – Çok Hafif', infillRatio: 0.10 },
  { value: 20,  label: '%20 – Hafif',      infillRatio: 0.20 },
  { value: 40,  label: '%40 – Standart',   infillRatio: 0.40 },
  { value: 60,  label: '%60 – Güçlü',      infillRatio: 0.60 },
  { value: 80,  label: '%80 – Çok Güçlü', infillRatio: 0.80 },
  { value: 100, label: '%100 – Masif',     infillRatio: 1.00 },
];

// Malzeme yoğunlukları (g/cm³)
const materialDensity = {
  PLA:   1.24,
  PETG:  1.27,
  ABS:   1.04,
  TPU:   1.21,
  Resin: 1.10,
};

function calculatePrice(stlData, targetMaxCm, mat, infillRatio, supportMultiplier = 1.0) {
  const est = slicerEstimate({
    volumeCm3: stlData.volumeCm3,
    surfaceAreaCm2: stlData.surfaceAreaCm2,
    boundingBoxMm: stlData.boundingBoxMm,
    supports: stlData.supports,
    targetMaxCm,
    infillRatio,
  });

  // supportMultiplier: 0 = destek yok, 0.6 = ağaç, 1.0 = normal
  const effectiveSupportVol = est.supportVolCm3 * supportMultiplier;

  const density = materialDensity[mat];
  const modelOnlyPlastic = est.totalPlasticCm3 - est.supportVolCm3;
  const gram = (modelOnlyPlastic + effectiveSupportVol) * density;

  // Süre: FDM ortalama ~2.0 dk/g
  const estimatedMinutes = gram * 2.0;

  const malzemeMaliyet = gram * materials[mat].gramCost;
  const isciliK = estimatedMinutes * 0.55;
  const toplamMaliyet = malzemeMaliyet + isciliK;
  const satisFiyati = toplamMaliyet * 1.25;

  return {
    gram: Math.round(gram),
    scaledVolumeCm3: est.scaledVolumeCm3,
    totalPlasticCm3: est.totalPlasticCm3,
    supportVolCm3: Math.round(effectiveSupportVol * 100) / 100,
    estimatedMinutes: Math.round(estimatedMinutes),
    malzemeMaliyet: Math.round(malzemeMaliyet * 100) / 100,
    isciliK: Math.round(isciliK * 100) / 100,
    toplamMaliyet: Math.round(toplamMaliyet * 100) / 100,
    total: Math.max(Math.round(satisFiyati * 100) / 100, 30),
  };
}

const supportOptions = [
  { value: 'none',   label: 'Destek Yok',    desc: 'Desteksiz baskı',          icon: '🚫', multiplier: 0.0 },
  { value: 'normal', label: 'Normal Destek', desc: 'Standart kafes destek',     icon: '🏗️', multiplier: 1.0 },
  { value: 'tree',   label: 'Ağaç Destek',   desc: 'Az materyal, kolay sökme', icon: '🌳', multiplier: 0.6 },
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



export default function STLQuote() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('beyaz');
  const [infill, setInfill] = useState(20);
  const [sizeCm, setSizeCm] = useState(10);
  const [stlData, setStlData] = useState(null); // { volumeCm3, surfaceAreaCm2, boundingBoxMm, supports, meshQuality, suggestedOrientation }
  const [supportType, setSupportType] = useState('normal');
  const [price, setPrice] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const bgImage = 'https://media.base44.com/images/public/69faefe28e4303a7ca845f3d/e757ce58b_mythical_Titan_Atlas_as_a_classical_statue_In_this_version_Atlas_stands_with_even_more_power_supporting_an_even_lar.jpg';

  const recalculate = (data, mat, inf, cm, suppType) => {
    if (!data) return;
    const infillOpt = infillOptions.find(o => o.value === inf);
    const suppOpt = supportOptions.find(o => o.value === suppType);
    setPrice(calculatePrice(data, cm, mat, infillOpt.infillRatio, suppOpt.multiplier));
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
    setPrice(null);

    // STL'yi parse et (tarayıcıda) - tam analiz
    const buffer = await selectedFile.arrayBuffer();
    const parsed = parseSTLVolume(buffer);
    const { volumeCm3, surfaceAreaCm2, boundingBoxMm, supports, meshQuality, suggestedOrientation, triangleCount } = parsed;
    const originalMaxMm = Math.max(boundingBoxMm.x, boundingBoxMm.y, boundingBoxMm.z);
    const originalMaxCm = Math.max(1, Math.round(originalMaxMm / 10));
    const data = { volumeCm3, surfaceAreaCm2, boundingBoxMm, supports, meshQuality, suggestedOrientation, triangleCount };
    setStlData(data);
    setSizeCm(originalMaxCm);

    // Dosyayı sunucuya yükle
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    setFileUrl(file_url);

    recalculate(data, material, infill, originalMaxCm || 10, supportType);
    setUploading(false);
  };

  const handleMaterialChange = (mat) => {
    setMaterial(mat);
    if (stlData) recalculate(stlData, mat, infill, sizeCm, supportType);
  };

  const handleInfillChange = (val) => {
    const num = Number(val);
    setInfill(num);
    if (stlData) recalculate(stlData, material, num, sizeCm, supportType);
  };

  const handleSizeChange = (val) => {
    const num = Number(val);
    setSizeCm(num);
    if (stlData) recalculate(stlData, material, infill, num, supportType);
  };

  const handleSupportTypeChange = (val) => {
    setSupportType(val);
    if (stlData) recalculate(stlData, material, infill, sizeCm, val);
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
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.45) 50%, rgba(240,240,240,0.5) 100%), url('${bgImage}')`,
        backgroundAttachment: 'fixed'
      }}
    >
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

          {/* STL Analiz Raporu */}
          {stlData && (
            <Card className="p-6 border-border/50">
              <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Microscope className="w-4 h-4 text-primary" />
                Model Analizi
              </h2>
              <div className="space-y-4">
                {/* Boyutlar */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {['X', 'Y', 'Z'].map((axis, i) => (
                    <div key={axis} className="rounded-lg bg-secondary/50 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{axis}</p>
                      <p className="text-sm font-semibold font-heading">
                        {[stlData.boundingBoxMm.x, stlData.boundingBoxMm.y, stlData.boundingBoxMm.z][i].toFixed(1)} mm
                      </p>
                    </div>
                  ))}
                </div>

                {/* Temel metrikler */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Üçgen Sayısı</span>
                    <span className="font-medium">{stlData.triangleCount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hacim</span>
                    <span className="font-medium">{stlData.volumeCm3.toFixed(2)} cm³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yüzey Alanı</span>
                    <span className="font-medium">{stlData.surfaceAreaCm2.toFixed(2)} cm²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mesh Kalitesi</span>
                    <span className={`font-semibold ${
                      stlData.meshQuality.qualityScore > 90 ? 'text-green-400' :
                      stlData.meshQuality.qualityScore > 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{stlData.meshQuality.qualityLabel}</span>
                  </div>
                </div>

                {/* Destek Analizi */}
                <div className={`rounded-xl p-3 border flex items-start gap-3 ${
                  stlData.supports.needsSupport
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-green-500/30 bg-green-500/5'
                }`}>
                  {stlData.supports.needsSupport
                    ? <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    : <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  }
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${stlData.supports.needsSupport ? 'text-yellow-300' : 'text-green-300'}`}>
                      Destek: {stlData.supports.needsSupport ? `Gerekli (${stlData.supports.supportComplexity})` : 'Gerekmiyor'}
                    </p>
                    {stlData.supports.needsSupport && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        %{stlData.supports.overhangRatio} overhang · {stlData.supports.overhangCount} yüzey
                        · {stlData.supports.supportAreaCm2} cm²
                      </p>
                    )}
                  </div>
                </div>

                {/* Önerilen Yön */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RotateCcw className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Önerilen baskı yönü: <span className="text-foreground font-medium">{stlData.suggestedOrientation}</span></span>
                </div>
              </div>
            </Card>
          )}

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
                <label className="text-sm font-medium mb-2.5 block flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-primary" />
                  Boyut
                  <span className="text-muted-foreground font-normal text-xs">(en büyük kenar)</span>
                </label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[sizeCm]}
                    onValueChange={(v) => handleSizeChange(v[0])}
                    min={1}
                    max={30}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={sizeCm}
                      onChange={(e) => handleSizeChange(e.target.value)}
                      className="w-16 text-center bg-background"
                    />
                    <span className="text-sm text-muted-foreground">cm</span>
                  </div>
                </div>
              </div>

              {/* Support Type */}
              {stlData && stlData.supports.needsSupport && (
                <div>
                  <label className="text-sm font-medium mb-2.5 block flex items-center gap-2">
                    Destek Tipi
                    <span className="text-muted-foreground font-normal text-xs">
                      (overhang %{stlData.supports.overhangRatio})
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {supportOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSupportTypeChange(opt.value)}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                          supportType === opt.value ? 'border-yellow-500/60 bg-yellow-500/10' : 'border-border/50 hover:border-yellow-500/30'
                        }`}
                      >
                        <p className="text-base mb-0.5">{opt.icon}</p>
                        <p className={`text-xs font-semibold ${supportType === opt.value ? 'text-yellow-300' : ''}`}>{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                        <span className="text-muted-foreground">Model Hacmi</span>
                        <span className="font-medium">{price.scaledVolumeCm3} cm³</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plastik Hacmi</span>
                        <span className="font-medium">{price.totalPlasticCm3} cm³</span>
                      </div>
                      {price.supportVolCm3 > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-yellow-400" /> Destek Materyali
                          </span>
                          <span className="text-yellow-400 font-medium">+{price.supportVolCm3} cm³</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tahmini Gramaj</span>
                        <span className="font-medium font-bold text-foreground">{price.gram} g</span>
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
    </div>
  );
}