import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Navbar({ cartCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Layers3 className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">
              3D Baskı <span className="text-primary">Gezegeni</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ana Sayfa
            </Link>
            <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ürünler
            </Link>
            <Link to="/stl-quote" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              STL Fiyat Al
            </Link>
          </div>

          {/* Cart + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px] bg-primary">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm py-2 text-muted-foreground hover:text-foreground">
              Ana Sayfa
            </Link>
            <Link to="/products" onClick={() => setMobileOpen(false)} className="block text-sm py-2 text-muted-foreground hover:text-foreground">
              Ürünler
            </Link>
            <Link to="/stl-quote" onClick={() => setMobileOpen(false)} className="block text-sm py-2 text-muted-foreground hover:text-foreground">
              STL Fiyat Al
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}