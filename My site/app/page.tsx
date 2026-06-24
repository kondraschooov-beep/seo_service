import Hero from "@/components/hero/Hero";
import Services from "@/components/sections/Services";
import Metrics from "@/components/sections/Metrics";
import Cases from "@/components/sections/Cases";
import Process from "@/components/sections/Process";
import About from "@/components/sections/About";
import Faq from "@/components/sections/Faq";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import RevealObserver from "@/components/ui/RevealObserver";

export default function Page() {
  return (
    <main>
      <Hero />
      <Services />
      <Metrics />
      <Cases />
      <Process />
      <About />
      <Faq />
      <Contact />
      <Footer />
      <RevealObserver />
    </main>
  );
}
