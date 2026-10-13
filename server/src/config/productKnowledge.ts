import type { Price } from "../lib/funnel";

/**
 * Confirmed facts supplied for Cake Artist. Keep this server-side catalogue as
 * the single factual context for free-form answers. It is deliberately text
 * only: rendering media or advancing the funnel remains the funnel engine's job.
 */
export const PRODUCT_KNOWLEDGE = {
  product: {
    name: "Cake Artist",
    subtitle: "De aficionada a Cake Artist",
    author: "Bel García",
    modality: "100% online",
    delivery: "Más de 50 clases grabadas en HD, sin horarios fijos y para avanzar al propio ritmo",
    access: "El acceso llega al correo usado en la compra después de que Hotmart confirma el pago; no se entrega por WhatsApp",
    guarantee: "7 días de garantía",
    checkoutProvider: "Hotmart",
    materials: "No incluye materiales físicos. La lista completa y específica de utensilios e ingredientes no está confirmada en la configuración",
  },
  modules: [
    "Módulo 1 — Fundamentos para triunfar: bienvenida, uso de la plataforma y grupo de soporte, recetario descargable, materiales y herramientas esenciales, mise en place",
    "Módulo 2 — Experta de las Masas: batidos pesados, cake de vainilla, cake de chocolate, cake frutal y reformulaciones, conservación sin refrigeración",
    "Módulo 3 — Rellenos Infalibles: tipos de rellenos, ganache de chocoberry, ganache de maracuyá, brigadeiro de nido y Nutella, conservación sin refrigeración",
    "Módulo 4 — Desbloqueando los secretos del ganache: resistencia al calor, ganache vegetal blanco y dark, ajustes según el clima, recuperación, colorantes y colorimetría, conservación y reutilización",
    "Módulo 5 — Estructuración y montaje: nivelado y separación de capas, bases, almíbar, armado y relleno, soportes internos, cubre migas, alisado, bordes y cubiertas finales",
    "Módulo 6 — Floral Chic Cake: coloración y capa final de ganache, stencil, texturización y sprinkles, flores naturales, pan de oro, topper y detalles finales",
    "Módulo 7 — Chocolate Lover Cake: cubierta final con ganache dark, capas dimensionales, texturizado, adornos en chocolatería y acabados finales",
    "Módulo 8 — Mermaid Fantasy Cake: acabado acuarela, burbujas de gelatina, sail de rice paper, adornos y corales de fondant, acabados finales",
  ],
  officialBonuses: [
    "Masterclass Brigadeiros",
    "Grupo de Alumnas en Telegram",
    "Curso Express de Fotografía para Pasteleras",
    "Checklist de Organización y Producción Eficiente",
    "Pack de 10 recetas de Brigadeiros Gourmet",
    "Certificado digital de culminación del programa, disponible una vez finalizado el curso",
  ],
  specialBonuses: [
    "+30 Recetas de Helado Artesanal",
    "+70 Recetas de Postres y Snacks",
    "Flanes Lucrativos",
    "Imperio de Sabores",
    "Emprende con Arroz con Leche",
    "Instapower",
  ],
} as const;

export function fullProductKnowledgeContext(prices: Price[], specialBonusesActive: boolean): string {
  const configuredPrices = prices.map((price) => ({
    country: price.country,
    excluded: price.excluded,
    currency: price.currency,
    regularPriceDisplay: price.regularPriceDisplay,
    offerPriceDisplay: price.excluded ? null : price.offerPriceDisplay,
    promotionActive: price.promotionActive,
    discountPercentOfficial: price.discountPercentOfficial,
    availableCoupons: price.availableCoupons,
    enabledPaymentMethods: price.enabledPaymentMethods,
  }));

  return [
    `Producto confirmado: ${JSON.stringify(PRODUCT_KNOWLEDGE.product)}`,
    `Módulos confirmados: ${JSON.stringify(PRODUCT_KNOWLEDGE.modules)}`,
    `Bonos oficiales incluidos: ${JSON.stringify(PRODUCT_KNOWLEDGE.officialBonuses)}`,
    `Bonos especiales de cierre: ${JSON.stringify(PRODUCT_KNOWLEDGE.specialBonuses)}. Promoción de bonos especiales activa: ${specialBonusesActive ? "sí" : "no"}. Si no está activa, no afirmes que se incluyen.`,
    `Precios y métodos de pago configurados por país: ${JSON.stringify(configuredPrices)}`,
    "Reglas de precisión: menciona únicamente enabledPaymentMethods; un método soportado por Hotmart pero no habilitado no está disponible. No afirmes un porcentaje salvo que discountPercentOfficial lo confirme. No menciones cupones salvo que promotionActive sea true y availableCoupons tenga un valor confirmado. Los países marcados excluded no tienen precio ni medios confirmados.",
  ].join("\n");
}
