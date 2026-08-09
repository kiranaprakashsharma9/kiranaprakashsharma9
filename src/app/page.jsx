import Home from "@/sections/Home";
import About from "@/sections/About";
import Services from "@/sections/Services";
import Reviews from "@/sections/Reviews";
import Shuba from "@/sections/Shuba";
import Ashuba from "@/sections/Ashuba";
import Location from "@/sections/Location";
import Contact from "@/sections/Contact";

export const metadata = {
  title: "Kiranaprakashsharma | Authentic Vedic Purohit in Srirangapatna",
  description:
    "Book expert Vedic Purohit Kiranaprakashsharma in Srirangapatna for Shuba and Ashuba ceremonies including Marriage, Gruhapravesha, Narayana Bali, Pitru Dosha Parihara and Asthi Visarjana.",
};

export default function Page() {
  return (
    <>
      <Home />
      <About />
      <Services />
      <Reviews />
      <Shuba showBackButton={false} previewCount={4} />
      <Ashuba showBackButton={false} previewCount={4} />
      <Location />
      <Contact />
    </>
  );
}
