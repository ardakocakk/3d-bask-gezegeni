import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderSuccess() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-10 h-10 text-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
          Siparişiniz Alındı!
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Siparişiniz başarıyla oluşturuldu. En kısa sürede hazırlanıp kargoya verilecektir.
          Sipariş durumunuz e-posta ile bildirilecektir.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" /> Ana Sayfaya Dön
            </Button>
          </Link>
          <Link to="/products">
            <Button className="gap-2 w-full sm:w-auto">
              <Package className="w-4 h-4" /> Alışverişe Devam Et
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}