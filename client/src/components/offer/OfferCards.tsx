import { useEffect, useState } from "react";
import { MEDIA_LIBRARY } from "../../config/media";
import { PRODUCT_KNOWLEDGE } from "../../config/product";
import { trackPixel } from "../../lib/pixel";

export type OfferPrice = {
  country: string;
  regularPrice: string | null;
  offerPrice: string | null;
  regularPriceDisplay: string | null;
  offerPriceDisplay: string;
  displayPrice: string;
  discountPercentOfficial: number | null;
  promotionActive: boolean;
  availableCoupons: number | null;
  paymentMethods: string[];
  supportedPaymentMethods: string[];
  enabledPaymentMethods: string[];
  official: boolean;
  excluded: boolean;
};

export function ModulesSequence({ part }: { part?: 1 | 2 | 3 }) {
  const items = part ? MEDIA_LIBRARY.modules.slice(part - 1, part) : MEDIA_LIBRARY.modules;
  return <div className="media-sequence" aria-label={part ? `Módulos de Cake Artist, parte ${part} de 3` : "Módulos de Cake Artist"}>{items.map((item) => <img key={item.src} src={item.src} alt={item.alt} />)}</div>;
}

export function TestimonialsGallery({ experienceLevel }: { experienceLevel: string | null }) {
  const category = experienceLevel === "beginner" ? "beginner" : "experienced";
  let items = MEDIA_LIBRARY.testimonials.filter((item) => item.category === category);
  if (items.length < 2) items = MEDIA_LIBRARY.testimonials.filter((item) => item.category === "general");
  return <div className="testimonial-gallery" aria-label="Resultados de alumnas">{items.slice(0, 3).map((item) => <img key={item.src} src={item.src} alt={item.alt} />)}</div>;
}

export function BonusCard({ special = false }: { special?: boolean }) {
  return <figure className="visual-card"><img src={special ? MEDIA_LIBRARY.specialBonuses : MEDIA_LIBRARY.officialBonuses} alt={special ? "Bonos especiales de la promoción activa" : "Bonos incluidos con Cake Artist"} /></figure>;
}

function methodIcon(method: string) {
  if (["Nequi", "Efecty", "Sencillito", "Servipag", "OXXO", "PagoEfectivo", "Boleto"].includes(method)) return "💵";
  if (method === "PIX") return "💠";
  if (method === "SEPA") return "🏦";
  if (method === "Apple Pay") return "";
  return "💳";
}

function PaymentMethods({ methods }: { methods: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!methods.length) return <p className="payment-empty">Consulta en Hotmart las opciones disponibles para este checkout.</p>;
  const visible = expanded ? methods : methods.slice(0, 5);
  return <div className="payment-methods">
    <p>Formas de pago</p>
    <ul>{visible.map((method) => <li key={method}><span aria-hidden="true">{methodIcon(method)}</span>{method}</li>)}</ul>
    {methods.length > 5 && <button type="button" className="payment-more" onClick={() => setExpanded((value) => !value)}>{expanded ? "Ver menos" : "Ver todos los medios de pago"}</button>}
  </div>;
}

function PriceSummary({ price }: { price: OfferPrice }) {
  const promotionLabel = price.discountPercentOfficial === 50 && price.promotionActive
    ? "50% DE DESCUENTO"
    : price.promotionActive
      ? "💖 Precio promocional"
      : "Precio actual";
  return <div className="price-summary">
    {price.regularPrice && price.offerPrice && price.regularPriceDisplay && <div className="price-before"><span>PRECIO NORMAL</span><del>{price.regularPriceDisplay}</del></div>}
    <div className="price-now"><span>HOY</span><strong>{price.offerPriceDisplay}</strong></div>
    <p className="promotion-label">{promotionLabel}</p>
    {price.promotionActive && price.availableCoupons === 2 && <p className="coupon-note">Últimos 2 cupones disponibles</p>}
  </div>;
}

export function PriceCard({ price, onCheckout }: { price: OfferPrice; onCheckout: () => void }) {
  // El visitante vio la tarjeta de precio → evento ViewContent del píxel.
  useEffect(() => { trackPixel("ViewContent"); }, []);
  return <section className="price-card" aria-label={`Precio, formas de pago e inscripción para ${price.country}`}>
    <p className="card-kicker">🎂 CAKE ARTIST · {price.country}</p>
    <PriceSummary price={price} />
    <PaymentMethods methods={price.enabledPaymentMethods} />
    <p className="secure-note">🔒 Pago seguro mediante Hotmart</p>
    <a className="checkout-button" href={PRODUCT_KNOWLEDGE.checkoutUrl} target="_blank" rel="noopener noreferrer" onClick={onCheckout}>💖 QUIERO INSCRIBIRME AHORA</a>
  </section>;
}

export function CheckoutCard({ price, onCheckout, checkoutUrl = PRODUCT_KNOWLEDGE.checkoutUrl }: { price: OfferPrice; onCheckout: () => void; checkoutUrl?: string }) {
  // El visitante llegó al paso de inscripción → evento InitiateCheckout del píxel.
  useEffect(() => { trackPixel("InitiateCheckout"); }, []);
  return <section className="checkout-card" aria-label="Inscripción a Cake Artist">
    <p className="card-kicker">Inscripción</p><h2>🎂 CAKE ARTIST</h2>
    <PriceSummary price={price} />
    <PaymentMethods methods={price.enabledPaymentMethods} />
    <ul className="checkout-benefits"><li>+50 clases</li><li>8 módulos</li><li>Bonos incluidos</li><li>Acceso inmediato</li><li>7 días de garantía</li></ul>
    <p className="secure-note">🔒 Pago seguro mediante Hotmart</p>
    <a className="checkout-button" href={checkoutUrl} target="_blank" rel="noopener noreferrer" onClick={onCheckout}>💖 QUIERO COMPLETAR MI INSCRIPCIÓN</a>
  </section>;
}

export function CheckoutVideo({ onViewed }: { onViewed: () => void }) {
  return <section className="video-card"><button className="video-label" type="button" onClick={(event) => { const video = event.currentTarget.nextElementSibling as HTMLVideoElement | null; if (video) { video.hidden = false; void video.play().catch(() => undefined); onViewed(); } }}>▶ Ver tutorial de inscripción</button><video hidden controls playsInline preload="metadata" src={MEDIA_LIBRARY.checkoutVideo} aria-label="Bel García explica cómo completar la inscripción" /></section>;
}
