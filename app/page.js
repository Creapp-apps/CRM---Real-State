import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VideoBackground from '@/components/home/VideoBackground';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import StorytellingSection from '@/components/home/StorytellingSection';
import OperationsSection from '@/components/home/OperationsSection';
import CTASection from '@/components/home/CTASection';
import { getSiteContent } from '@/lib/siteContent';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { content, theme } = await getSiteContent();
  return (
    <>
      <VideoBackground video={theme?.media?.heroVideo} />
      <Navbar navbar={content.navbar} />
      <main>
        <HeroSection hero={content.hero} />
        <FeaturedProperties />
        <StorytellingSection stats={content.stats} values={content.values} />
        <OperationsSection operations={content.operations} />
        <CTASection cta={content.cta} />
      </main>
      <Footer footer={content.footer} />
    </>
  );
}
