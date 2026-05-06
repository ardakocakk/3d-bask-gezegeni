import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import FeaturedProducts from '../components/home/FeaturedProducts';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <FeaturedProducts />
    </div>
  );
}