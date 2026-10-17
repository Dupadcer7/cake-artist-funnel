import type { ReactNode } from "react";
import valeProfile from "../../assets/vale-profile-correcta.jpg";
import { BonusCard, CheckoutCard, CheckoutVideo, ModulesSequence, PriceCard, TestimonialsGallery, type OfferPrice } from "../offer/OfferCards";
import { PRODUCT_KNOWLEDGE } from "../../config/product";

export type ChatMessage = {
  id: string; sender: "vale" | "prospect"; type: "text" | "audio" | "image" | "action"; content: string;
  action?: string; mediaUrl?: string; transcript?: string; createdAt: string;
};

export function ChatHeader({ onAdmin }: { onAdmin: () => void }) {
  return <header className="chat-header">
    <div className="avatar-wrap" aria-hidden="true">
      <span className="avatar-glow" />
      <img className="avatar" src={valeProfile} alt="" />
      <i className="avatar-status" />
    </div>
    <div className="header-copy">
      <strong>Vale <span aria-hidden="true">♡</span></strong>
      <span>Asesora de pastelería</span>
    </div>
    <div className="header-actions">
      <div className="online"><i /><span>En línea</span></div>
      <button className="admin-trigger" type="button" aria-label="Abrir administración" onClick={onAdmin}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>
      </button>
    </div>
    <span className="header-sparkle sparkle-one" aria-hidden="true">✦</span>
    <span className="header-sparkle sparkle-two" aria-hidden="true">✧</span>
  </header>;
}

export function ConversationDecor() {
  return <div className="conversation-decor" aria-hidden="true">
    <span className="pastry-float pastry-cupcake">
      <svg viewBox="0 0 48 48"><path d="M14 23h20l-3 17H17l-3-17Z"/><path d="M13 23c0-4 3-7 7-7a8 8 0 0 1 15 3c0 2-1 3-2 4H13Z"/><path d="M24 16c-1-4 1-7 4-9"/><circle cx="29" cy="7" r="3"/></svg>
    </span>
    <span className="pastry-float pastry-candy">
      <svg viewBox="0 0 48 48"><path d="m15 18-9-4 3 9-3 9 9-3M33 18l9-4-3 9 3 9-9-3"/><rect x="14" y="16" width="20" height="15" rx="7.5"/></svg>
    </span>
    <span className="pastry-float pastry-slice">
      <svg viewBox="0 0 48 48"><path d="m11 35 12-24 15 24H11Z"/><path d="M16 25h17M19 19h10"/><circle cx="24" cy="11" r="2.5"/></svg>
    </span>
    <span className="pastel-spark pastel-spark-one">✦</span>
    <span className="pastel-spark pastel-spark-two">✧</span>
    <span className="pastel-spark pastel-spark-three">✦</span>
  </div>;
}

function ActionContent({ action, experienceLevel, country, price, onProgress }: { action: string; experienceLevel: string | null; country: string | null; price: OfferPrice | null; onProgress: (kind: "video" | "checkout") => void }) {
  if (action === "SHOW_MODULES") return <ModulesSequence />;
  if (action === "SHOW_MODULES_PART_1") return <ModulesSequence part={1} />;
  if (action === "SHOW_MODULES_PART_2") return <ModulesSequence part={2} />;
  if (action === "SHOW_MODULES_PART_3") return <ModulesSequence part={3} />;
  if (action === "SHOW_TESTIMONIALS") return <TestimonialsGallery experienceLevel={experienceLevel} />;
  if (action === "SHOW_OFFICIAL_BONUSES") return <BonusCard />;
  if (action === "SHOW_SPECIAL_BONUSES") return <BonusCard special />;
  if (action === "SHOW_PRICE" && country && price && !price.excluded) return <PriceCard price={price} onCheckout={() => onProgress("checkout")} />;
  if (action === "SHOW_CHECKOUT_VIDEO") return <CheckoutVideo onViewed={() => onProgress("video")} />;
  if (action === "SHOW_CHECKOUT" && country && price && !price.excluded) return <CheckoutCard price={price} onCheckout={() => onProgress("checkout")} />;
  // Flujo de remarketing (?src=remarketing): la tarjeta de inscripción usa el
  // link con descuento. Esta acción solo la emite el servidor en ese flujo.
  if (action === "SHOW_CHECKOUT_DISCOUNT" && country && price && !price.excluded) return <CheckoutCard price={price} checkoutUrl={PRODUCT_KNOWLEDGE.discountCheckoutUrl} onCheckout={() => onProgress("checkout")} />;
  return null;
}

export function MessageBubble({ message, actionContent }: { message: ChatMessage; actionContent?: ReactNode }) {
  if (message.type === "action") return <article className="message-row vale action-row" aria-label="Contenido de Vale"><div className="message-stack">{actionContent}</div></article>;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return <article className={`message-row ${message.sender}`} aria-label={message.sender === "vale" ? "Mensaje de Vale" : "Tu mensaje"}><div className="message-stack"><div className="bubble">
    {message.type === "image" && message.mediaUrl ? <img className="user-media" src={message.mediaUrl} alt="Imagen enviada en la conversación" /> : null}
    {message.type === "audio" && message.mediaUrl ? <audio className="audio-message" controls preload="metadata" src={message.mediaUrl} /> : null}
    {message.type === "text" ? <span>{message.content}</span> : null}
    {message.type === "audio" && message.transcript ? <p className="transcript">Transcripción: “{message.transcript}”</p> : null}
    <time>{time}</time>
  </div></div></article>;
}

export function TypingIndicator({ active, label = "Vale está escribiendo..." }: { active: boolean; label?: string }) {
  if (!active) return null;
  return <div className="typing" role="status" aria-live="polite"><span><i /><i /><i /></span>{label}</div>;
}

export function QuickReplies({ items, disabled, onPick }: { items: string[]; disabled: boolean; onPick: (item: string) => void }) {
  if (!items.length) return null;
  return <div className="quick-replies" aria-label="Respuestas rápidas">{items.map((item) => <button key={item} type="button" disabled={disabled} onClick={() => onPick(item)}>{item}</button>)}</div>;
}

export function ActionMessage({ message, experienceLevel, country, prices, onProgress }: { message: ChatMessage; experienceLevel: string | null; country: string | null; prices: OfferPrice[]; onProgress: (kind: "video" | "checkout") => void }) {
  const price = prices.find((item) => item.country === country) ?? null;
  return <MessageBubble message={message} actionContent={<ActionContent action={message.action ?? message.content} experienceLevel={experienceLevel} country={country} price={price} onProgress={onProgress} />} />;
}
