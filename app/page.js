import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VideoBackground from '@/components/home/VideoBackground';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import StorytellingSection from '@/components/home/StorytellingSection';
import OperationsSection from '@/components/home/OperationsSection';
import CTASection from '@/components/home/CTASection';

export default function Home() {
  return (
    <>
      <VideoBackground />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedProperties />
        <StorytellingSection />
        <OperationsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
