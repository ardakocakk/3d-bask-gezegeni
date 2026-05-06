import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function AppLayout() {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart_3d');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart_3d', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  }, [cart]);

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('cart_3d');
      setCart(saved ? JSON.parse(saved) : []);
    };
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}