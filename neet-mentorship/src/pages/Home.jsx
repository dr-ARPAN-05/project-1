import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import Process from '../components/sections/Process';
import Pricing from '../components/sections/Pricing';
import FAQ from '../components/sections/FAQ';
import CTA from '../components/sections/CTA';

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Process />
      <Pricing />
      <FAQ />
      <CTA />
    </>
  );
}
