import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ScrollToTop from '@/components/ScrollToTop';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import { useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';

// Lazy load below-fold sections
const AboutSection = lazy(() => import('@/components/AboutSection'));
const ServicesSection = lazy(() => import('@/components/ServicesSection'));
const TherapyProcessSection = lazy(() => import('@/components/TherapyProcessSection'));
const TestimonialsSection = lazy(() => import('@/components/TestimonialsSection'));
const BookingSection = lazy(() => import('@/components/BookingSection'));
const FAQSection = lazy(() => import('@/components/FAQSection'));
const BlogSection = lazy(() => import('@/components/BlogSection'));
const ContactSection = lazy(() => import('@/components/ContactSection'));
const Footer = lazy(() => import('@/components/Footer'));

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <Suspense fallback={<div className="min-h-[50vh]" />}>
          <AboutSection />
          <ServicesSection />
          <TherapyProcessSection />
          <TestimonialsSection />
          <BookingSection />
          <FAQSection />
          <BlogSection />
          <ContactSection />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <ScrollToTop />
      <WhatsAppWidget />
    </div>
  );
};

export default Index;
