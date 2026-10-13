import modulesPart1 from "../assets/modules-part-1.png";
import modulesPart2 from "../assets/modules-part-2.png";
import modulesPart3 from "../assets/modules-part-3.png";
import officialBonuses from "../assets/official-bonuses.png";
import specialBonuses from "../assets/special-bonuses.png";
import checkoutVideo from "../assets/checkout-tutorial-bel-garcia.mp4";
import lizbeth from "../assets/testimonial-lizbeth-llancari-ku.png";
import janellys from "../assets/testimonial-janellys-vianney.png";
import loammy from "../assets/testimonial-loammy-collaguazo.png";
import yanira from "../assets/testimonial-yanira-pelaez.png";
import adriana from "../assets/testimonial-adriana-chavez.png";
import karen from "../assets/testimonial-karen-lucia-burgueno-rico.png";
import karelvy from "../assets/testimonial-karelvy-acosta.png";

export const MEDIA_LIBRARY = {
  modules: [
    { src: modulesPart1, alt: "Módulos 1 a 3 de Cake Artist: fundamentos, masas y rellenos" },
    { src: modulesPart2, alt: "Módulos 4 a 6 de Cake Artist: ganache, estructuración y Floral Chic Cake" },
    { src: modulesPart3, alt: "Módulos 7 y 8 de Cake Artist: Chocolate Lover Cake y Mermaid Fantasy Cake" },
  ],
  officialBonuses,
  specialBonuses,
  checkoutVideo,
  testimonials: [
    { src: lizbeth, category: "beginner", alt: "Testimonio real de Lizbeth Llancari Kú" },
    { src: janellys, category: "beginner", alt: "Testimonio real de Janellys Vianney" },
    { src: loammy, category: "beginner", alt: "Testimonio real de Loammy Collaguazo" },
    { src: yanira, category: "experienced", alt: "Testimonio real de Yanira Pelaez" },
    { src: adriana, category: "general", alt: "Testimonio real de Adriana Chávez" },
    { src: karen, category: "experienced", alt: "Testimonio real de Karen Lucia Burgueño Rico" },
    { src: karelvy, category: "experienced", alt: "Testimonio real de Karelvy Acosta" },
  ],
} as const;
