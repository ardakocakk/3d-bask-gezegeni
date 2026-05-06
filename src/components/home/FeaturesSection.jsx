import React from 'react';
import { Upload, Zap, Truck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Upload,
    title: 'STL Yükle, Fiyat Al',
    description: 'Dosyanızı yükleyin, malzeme ve renk seçin, anında fiyat teklifi alın.'
  },
  {
    icon: Zap,
    title: 'Hızlı Üretim',
    description: 'Siparişleriniz profesyonel 3D yazıcılarla hızlıca üretilir.'
  },
  {
    icon: Truck,
    title: 'Güvenli Kargo',
    description: 'Özenle paketlenen ürünleriniz kapınıza kadar gelir.'
  },
  {
    icon: Shield,
    title: 'Kalite Garantisi',
    description: 'Her baskı kalite kontrolünden geçirilir, memnuniyet garantisi.'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4">Neden Biz?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            3D baskı deneyiminizi en üst seviyeye taşıyoruz
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-sm mb-2">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}