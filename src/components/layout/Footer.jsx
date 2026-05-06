import React from 'react';
import { Link } from 'react-router-dom';
import { Layers3, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Layers3 className="w-4 h-4 text-primary" />
              </div>
              <span className="font-heading font-bold">3D Baskı Gezegeni</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hayallerinizi katman katman gerçeğe dönüştürüyoruz. Özel tasarım veya hazır ürünlerimizle 3D baskı dünyasına adım atın.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">Hızlı Bağlantılar</h3>
            <div className="space-y-2.5">
              <Link to="/products" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Ürünler</Link>
              <Link to="/stl-quote" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">STL Fiyat Al</Link>
              <Link to="/cart" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Sepetim</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4">İletişim</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                info@3dbaskigezegeni.com
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                +90 555 123 4567
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                İstanbul, Türkiye
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 3D Baskı Gezegeni. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}