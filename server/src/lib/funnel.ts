import { fullProductKnowledgeContext } from "../config/productKnowledge";

export const FUNNEL_STAGES = [
  "WELCOME", "EXPERIENCE_DIAGNOSIS", "SOCIAL_PROOF", "MAIN_MENU", "COURSE_CONTENT",
  "COUNTRY", "PRICE", "FREE_QUESTION", "OBJECTION_HANDLING", "HIGH_PURCHASE_INTENT", "CHECKOUT", "PURCHASED",
] as const;

export const OBJECTION_TYPES = [
  "NO_BUDGET", "TOO_EXPENSIVE", "LATER", "THOUGHT_FREE", "THOUGHT_IN_PERSON", "NO_TIME",
  "ONLINE_DOUBT", "PAYMENT_SECURITY", "NO_EXPERIENCE", "MATERIALS", "TRUST", "NOT_INTERESTED", "OTHER",
] as const;

export type DetectedObjection = typeof OBJECTION_TYPES[number];
export type ConversationStatus = "ACTIVE" | "NO_BUDGET" | "LATER" | "CLOSED_NOT_INTERESTED";

export type FunnelAction =
  | "NONE" | "SHOW_MODULES" | "SHOW_MODULES_PART_1" | "SHOW_MODULES_PART_2" | "SHOW_MODULES_PART_3"
  | "SHOW_TESTIMONIALS" | "SHOW_OFFICIAL_BONUSES" | "SHOW_SPECIAL_BONUSES"
  | "SHOW_PRICE" | "SHOW_CHECKOUT_VIDEO" | "SHOW_CHECKOUT" | "SILENCE";

export type ConversationState = {
  currentStage: string;
  country: string | null;
  experienceLevel: string | null;
  businessStatus: string | null;
  mainGoal: string | null;
  mainProblem: string | null;
  modulesViewed: boolean;
  testimonialsViewed: boolean;
  officialBonusesViewed: boolean;
  specialBonusesViewed: boolean;
  priceViewed: boolean;
  checkoutVideoViewed: boolean;
  checkoutShown: boolean;
  purchaseIntent: string;
  knowsProgram: boolean;
  lastAssistantQuestion: string | null;
  pendingAction: string | null;
  silenced: boolean;
  lastProcessedUserMessageId: string | null;
  isGeneratingResponse: boolean;
  answeredQuestions: {
    experienceLevel: boolean;
    mainGoal: boolean;
    country: boolean;
    businessStatus: boolean;
  };
  beginnerReassuranceShown: boolean;
  detectedObjection: string | null;
  conversationStatus: string;
  guaranteeMentioned: boolean;
  purchaseStatus: "prospect" | "purchased";
};

export type Price = {
  country: string;
  currency: string;
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
export type ReplyStep = { kind: "text"; content: string } | { kind: "action"; action: FunnelAction };
export type ReplyPlan = {
  steps: ReplyStep[];
  quickReplies: string[];
  state: ConversationState;
  price: Price | null;
  requiresInference?: boolean;
  inferencePrompt?: string;
};

export const EXPERIENCE_MENU = ["🌱 Comienzo desde cero", "🎂 Ya tengo experiencia"];
export const SOCIAL_PROOF_BEGINNER_MENU = ["✨ Sí, quiero verlos", "➡️ Prefiero seguir"];
export const SOCIAL_PROOF_EXPERIENCED_MENU = ["✨ Ver resultados", "➡️ Prefiero seguir"];
export const MAIN_MENU = ["📚 Ver qué incluye el curso", "💰 Ver precio", "💖 Quiero inscribirme", "❓ Tengo una duda"];
export const COURSE_MENU = ["❓ Tengo una duda"];
export const TESTIMONIAL_MENU = ["📚 Ver qué incluye el curso", "💰 Ver precio"];
export const PRICE_MENU = ["❓ Tengo una duda"];
export const QUESTION_MENU = ["📚 Ver qué incluye el curso", "💰 Ver precio", "💖 Quiero inscribirme"];
const EXPENSIVE_MENU = ["📚 Revisar qué incluye", "💖 Quiero inscribirme", "➡️ Lo pensaré"];
const FREE_MENU = ["💰 Ver precio", "📚 Ver qué incluye", "➡️ Seguir después"];
const IN_PERSON_MENU = ["📚 Ver qué incluye", "💰 Ver precio", "❓ Tengo otra duda"];
const ONLINE_DOUBT_MENU = ["✨ Ver resultados de alumnas", "📚 Ver el contenido"];
const SECURITY_MENU = ["💖 Ver cómo inscribirme"];

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ¿?¡!\s]/g, " ").replace(/\s+/g, " ").trim();
}

function has(text: string, values: string[]) { return values.some((value) => text.includes(value)); }
function textStep(content: string): ReplyStep { return { kind: "text", content }; }
function actionStep(action: FunnelAction): ReplyStep { return { kind: "action", action }; }
function moduleRevealSteps(): ReplyStep[] {
  return [actionStep("SHOW_MODULES_PART_1"), actionStep("SHOW_MODULES_PART_2"), actionStep("SHOW_MODULES_PART_3")];
}
function isTerminalStatus(state: ConversationState) { return state.conversationStatus === "NO_BUDGET" || state.conversationStatus === "LATER" || state.conversationStatus === "CLOSED_NOT_INTERESTED"; }
function allowedMenu(state: ConversationState, menu: string[]) { return isTerminalStatus(state) ? [] : menu; }

function canonicalCountry(raw: string, prices: Price[]) {
  const cleaned = raw.trim().replace(/[¿?¡!.,;:]+$/g, "").replace(/\s+(?:y|pero|porque)\s+.*$/i, "");
  const normalized = normalize(cleaned);
  const aliases: Record<string, string> = {
    mexico: "México", panama: "Panamá", "republica dominicana": "República Dominicana",
    peru: "Perú", espana: "España", spain: "España", usa: "Estados Unidos",
    eeuu: "Estados Unidos", "ee uu": "Estados Unidos", brazil: "Brasil",
    "puerto rico": "Puerto Rico", "el salvador": "El Salvador", "costa rica": "Costa Rica", haiti: "Haití",
  };
  const alias = aliases[normalized];
  if (alias) return alias;
  return prices.find((price) => normalize(price.country) === normalized)?.country ?? cleaned;
}

function extractCountry(raw: string, prices: Price[]) {
  const direct = prices.find((price) => normalize(raw).includes(normalize(price.country)));
  if (direct) return direct.country;
  const match = raw.match(/(?:soy|estoy|vivo|me encuentro)\s+(?:de|en)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{2,35})/i)
    ?? raw.match(/(?:precio|valor|cuesta|costo)\s+(?:para|en)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{2,35})/i);
  return match?.[1] ? canonicalCountry(match[1], prices) : null;
}

function configuredPrice(state: ConversationState, prices: Price[]) {
  return state.country ? prices.find((item) => item.country === state.country) ?? null : null;
}

function unavailablePricePlan(state: ConversationState, price: Price | null): ReplyPlan {
  const country = state.country ?? "ese país";
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  state.currentStage = "MAIN_MENU";
  return {
    steps: [textStep(`No quiero darte una información incorrecta. Por ahora no hay un precio configurado para ${country}.`)],
    quickReplies: allowedMenu(state, QUESTION_MENU),
    state,
    price,
  };
}

function priceSteps(state: ConversationState, prices: Price[]): { steps: ReplyStep[]; price: Price | null } {
  const price = configuredPrice(state, prices);
  if (!price || price.excluded) return { steps: [], price };
  state.priceViewed = true;
  state.currentStage = "PRICE";
  const steps: ReplyStep[] = [actionStep("SHOW_PRICE")];
  if (!state.checkoutVideoViewed) {
    steps.push(actionStep("SHOW_CHECKOUT_VIDEO"));
  }
  if (!state.modulesViewed) {
    steps.push(textStep("Para que puedas verlo mucho más claro, mira cómo está organizada la formación 👇🎂"));
    steps.push(...moduleRevealSteps());
    state.modulesViewed = true;
  }
  if (!state.officialBonusesViewed) {
    steps.push(textStep("Y además de las clases, tu acceso incluye estos recursos 👇🎁"));
    steps.push(actionStep("SHOW_OFFICIAL_BONUSES"));
    state.officialBonusesViewed = true;
  }
  return { steps, price };
}

function pricePlan(state: ConversationState, prices: Price[], pendingAction = "countryForPrice"): ReplyPlan {
  if (!state.country) {
    state.currentStage = "COUNTRY";
    state.pendingAction = pendingAction;
    state.lastAssistantQuestion = "country";
    return {
      steps: [textStep("Claro 💖 ¿En qué país te encuentras para mostrarte el precio correspondiente?")],
      quickReplies: [], state, price: null,
    };
  }
  const result = priceSteps(state, prices);
  if (!result.price || result.price.excluded) return unavailablePricePlan(state, result.price);
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  return { steps: result.steps, quickReplies: allowedMenu(state, PRICE_MENU), state, price: result.price };
}

function paymentPlan(state: ConversationState, prices: Price[]): ReplyPlan {
  if (!state.country) {
    state.currentStage = "COUNTRY";
    state.pendingAction = "countryForPayment";
    state.lastAssistantQuestion = "country";
    return {
      steps: [textStep("Claro 😊 ¿En qué país te encuentras para mostrarte los medios de pago habilitados?")],
      quickReplies: [], state, price: null,
    };
  }
  const result = priceSteps(state, prices);
  if (!result.price || result.price.excluded) return unavailablePricePlan(state, result.price);
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  return { steps: result.steps, quickReplies: allowedMenu(state, PRICE_MENU), state, price: result.price };
}

function enrollmentPlan(state: ConversationState, prices: Price[], specialBonusesActive: boolean, includePrice = false): ReplyPlan {
  state.conversationStatus = "ACTIVE";
  state.silenced = false;
  if (!state.country) return pricePlan(state, prices, "countryForCheckout");
  const price = configuredPrice(state, prices);
  if (!price || price.excluded) return unavailablePricePlan(state, price);

  state.purchaseIntent = "HIGH";
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  state.currentStage = "HIGH_PURCHASE_INTENT";

  if (state.checkoutShown) {
    return {
      steps: [textStep("Tu opción para completar la inscripción ya está disponible arriba 💖")],
      quickReplies: [], state, price,
    };
  }

  const steps: ReplyStep[] = [];
  if (includePrice && !state.priceViewed) {
    const result = priceSteps(state, prices);
    steps.push(...result.steps);
  }
  steps.push(textStep("¡Excelente! 💖 Te voy a mostrar cómo realizar tu inscripción de forma sencilla."));
  if (!state.checkoutVideoViewed) {
    steps.push(actionStep("SHOW_CHECKOUT_VIDEO"));
    state.checkoutVideoViewed = true;
  }
  steps.push(textStep("El pago se realiza de forma segura mediante Hotmart 🔒\n\nUna vez confirmado, el acceso llega automáticamente al correo que registres durante la compra."));
  steps.push(textStep("Además cuentas con 7 días de garantía. Si dentro de ese período el programa no cumple tus expectativas, puedes solicitar el reembolso correspondiente."));
  state.guaranteeMentioned = true;
  if (specialBonusesActive && !state.specialBonusesViewed) {
    steps.push(textStep("Y si aprovechas la promoción disponible, también recibes estos 6 regalos adicionales 🎁✨"));
    steps.push(actionStep("SHOW_SPECIAL_BONUSES"));
    state.specialBonusesViewed = true;
  }
  steps.push(actionStep("SHOW_CHECKOUT"));
  state.checkoutShown = true;
  state.currentStage = "CHECKOUT";
  return { steps, quickReplies: [], state, price };
}

function menuPlan(state: ConversationState, content: string, menu = QUESTION_MENU): ReplyPlan {
  state.currentStage = "MAIN_MENU";
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  return { steps: [textStep(content)], quickReplies: allowedMenu(state, menu), state, price: null };
}

function hasExplicitRejection(text: string) {
  return has(text, ["no gracias", "no me interesa", "definitivamente no voy a comprar", "no lo voy a comprar", "no quiero comprar", "no quiero inscribirme"]);
}

function hasPriceObjection(text: string) {
  return has(text, ["esta muy caro", "esta caro", "es muy caro", "me parece costoso", "seria mas barato", "muy costoso", "demasiado caro"]);
}

function hasInPersonConfusion(text: string) {
  return has(text, ["pense que era presencial", "crei que era presencial", "no sabia que era online"]);
}

function shouldCloseForPriceOrModality(text: string) {
  const rejects = hasExplicitRejection(text);
  const priceConcern = hasPriceObjection(text);
  const modalityConfusion = hasInPersonConfusion(text);
  return modalityConfusion || (rejects && priceConcern);
}

function priceModalityClosingPlan(state: ConversationState): ReplyPlan {
  state.detectedObjection = "NOT_INTERESTED";
  state.currentStage = "OBJECTION_HANDLING";
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  state.conversationStatus = "CLOSED_NOT_INTERESTED";
  state.silenced = true;
  return {
    steps: [textStep("Claro 😊 Cake Artist es 100% online, con clases grabadas para que puedas avanzar a tu ritmo desde donde estés.\n\nSi en este momento la inversión no encaja contigo, no pasa nada 💖. Si más adelante deseas retomarlo o conocer alguna promoción que esté disponible, aquí estaremos para orientarte.")],
    quickReplies: [],
    state,
    price: null,
  };
}

function isClearQuestion(raw: string, text: string) {
  if (raw.includes("?") || raw.includes("¿")) return true;
  if (/^(que|como|cuando|donde|cual|cuanto|quien|puedo|podria|necesito|incluye|tiene|es|hay)\b/.test(text)) return true;
  return has(text, ["me puedes decir", "puedes decirme", "me podrias decir", "podrias decirme", "quisiera saber", "quiero saber", "dime si", "me explicas", "tengo una duda"]);
}

function closedFollowUpPlan(raw: string, text: string, state: ConversationState, prices: Price[], specialBonusesActive: boolean): ReplyPlan {
  state.currentStage = "OBJECTION_HANDLING";
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  state.silenced = true;
  const silent = (): ReplyPlan => ({ steps: [], quickReplies: [], state, price: null });
  if (!isClearQuestion(raw, text)) return silent();

  if (has(text, ["es online", "modalidad", "es presencial", "clases grabadas", "horarios"])) {
    return { steps: [textStep("Sí 😊 Cake Artist es 100% online. Las clases quedan grabadas para que puedas estudiarlas desde donde estés y avanzar a tu propio ritmo, sin horarios fijos.")], quickReplies: [], state, price: null };
  }
  if (has(text, ["garantia", "devolucion", "reembolso"])) {
    return { steps: [textStep("Cake Artist cuenta con una garantía de 7 días. Si dentro de ese período el programa no cumple tus expectativas, puedes solicitar el reembolso correspondiente. 🔒")], quickReplies: [], state, price: null };
  }
  if (has(text, ["cuando tengo acceso", "como accedo", "como ingreso", "credenciales", "acceso inmediato"])) {
    return { steps: [textStep("El acceso llega al correo utilizado durante la compra una vez que Hotmart confirma el pago.")], quickReplies: [], state, price: null };
  }
  if (has(text, ["cuantas clases", "numero de clases"])) {
    return { steps: [textStep("Cake Artist incluye más de 50 clases grabadas en HD, organizadas en 8 módulos.")], quickReplies: [], state, price: null };
  }
  if (has(text, ["certificado", "certificacion", "diploma"])) {
    return { steps: [textStep("Sí 😊 Cake Artist incluye un certificado digital de culminación, disponible una vez que hayas finalizado el curso.")], quickReplies: [], state, price: null };
  }
  if (has(text, ["cuantos modulos", "numero de modulos"])) {
    return { steps: [textStep("Cake Artist está organizado en 8 módulos, desde fundamentos, masas y rellenos hasta ganache, estructuración, montaje y decoración temática.")], quickReplies: [], state, price: null };
  }
  if (has(text, ["materiales", "utensilios", "ingredientes"])) {
    return { steps: [textStep("Cake Artist no incluye materiales físicos. Como la lista específica de utensilios e ingredientes no está documentada en la información configurada, prefiero no inventarte requisitos.")], quickReplies: [], state, price: null };
  }
  if (has(text, ["como puedo pagar", "como pago", "medios de pago", "formas de pago", "metodos de pago", "aceptan paypal", "aceptan tarjeta", "puedo pagar con"])) {
    const price = configuredPrice(state, prices);
    const methods = price?.enabledPaymentMethods ?? [];
    const copy = methods.length > 0
      ? `Para ${price?.country ?? state.country}, los medios habilitados actualmente en Hotmart son: ${methods.join(", ")}.`
      : "Los medios habilitados dependen del país y de la configuración disponible en Hotmart. No quiero prometerte una opción que no esté activa.";
    return { steps: [textStep(copy)], quickReplies: [], state, price: null };
  }
  if (has(text, ["precio", "cuanto cuesta", "cuanto vale", "valor del curso", "costo"])) {
    return { steps: [textStep("Respeto tu decisión y no volveré a mostrarte la oferta. Si más adelante deseas retomarla, podré orientarte con el precio vigente en ese momento.")], quickReplies: [], state, price: null };
  }

  const prompt = [
    "Responde como Vale, asesora virtual de Cake Artist by Bel García, en español latino, con cercanía y precisión.",
    "La persona ya rechazó la compra. Responde únicamente su pregunta clara en uno o dos párrafos breves. No intentes vender, no reactives el funnel, no ofrezcas continuar y no añadas preguntas, enlaces ni llamadas a la acción.",
    "Puedes contestar con hechos concretos del conocimiento confirmado, pero no debes solicitar ni disparar tarjetas de precio, módulos, testimonios, bonos, video o checkout. No cambies el estado cerrado.",
    fullProductKnowledgeContext(prices, specialBonusesActive),
    "Si la respuesta no está en el conocimiento confirmado, di que no quieres dar información incorrecta. No infieras ni completes datos faltantes.",
    `Pregunta: ${raw}`,
  ].join("\n");
  return { steps: [], quickReplies: [], state, price: null, requiresInference: true, inferencePrompt: prompt };
}

function detectObjection(text: string): DetectedObjection | null {
  if (hasExplicitRejection(text)) return "NOT_INTERESTED";
  if (has(text, ["lo compro despues", "quizas mas adelante", "mas adelante", "luego si", "otra oportunidad", "lo pensare", "seguire despues", "seguir despues"])) return "LATER";
  if (has(text, ["no tengo dinero", "no me alcanza", "ahora mismo no puedo pagarlo", "no puedo pagarlo", "no tengo presupuesto", "sin presupuesto"])) return "NO_BUDGET";
  if (hasPriceObjection(text)) return "TOO_EXPENSIVE";
  if (has(text, ["pense que era gratis", "hay que pagar", "no sabia que tenia costo", "no sabia que costaba", "era gratis"])) return "THOUGHT_FREE";
  if (hasInPersonConfusion(text)) return "THOUGHT_IN_PERSON";
  if (has(text, ["no se si online me sirva", "no se si me sirva online", "no aprendo online", "dudo que online", "online no me funciona"])) return "ONLINE_DOUBT";
  if (has(text, ["no tengo tiempo", "me falta tiempo", "no dispongo de tiempo", "ando sin tiempo"])) return "NO_TIME";
  if (has(text, ["es seguro", "pago seguro", "seguro pagar", "seguridad del pago"])) return "PAYMENT_SECURITY";
  if (has(text, ["me preocupa no tener experiencia", "no se nada de reposteria", "no tengo experiencia", "nunca he hecho pasteles", "soy totalmente principiante"])) return "NO_EXPERIENCE";
  if (has(text, ["no tengo materiales", "que materiales necesito", "incluye los materiales", "envian materiales", "materiales fisicos"])) return "MATERIALS";
  if (has(text, ["no confio", "es una estafa", "sera real", "puedo confiar", "es confiable"])) return "TRUST";
  if (has(text, ["tengo una objecion", "no estoy convencida", "tengo dudas para comprar"])) return "OTHER";
  return null;
}

function objectionPlan(objection: DetectedObjection, state: ConversationState): ReplyPlan {
  state.detectedObjection = objection;
  state.currentStage = "OBJECTION_HANDLING";
  state.pendingAction = null;
  state.lastAssistantQuestion = null;

  if (objection === "NO_BUDGET") {
    state.conversationStatus = "NO_BUDGET";
    state.silenced = true;
    return { steps: [textStep("Claro, te entiendo 😊 No pasa nada. Si ahora mismo no es el momento, puedes dejarlo para más adelante y continuar cuando te sea posible 💖")], quickReplies: [], state, price: null };
  }
  if (objection === "LATER") {
    state.conversationStatus = "LATER";
    state.silenced = true;
    return { steps: [textStep("Claro 💖 No hay problema. Lo importante es que lo hagas cuando realmente sea un buen momento para ti.\n\nSi más adelante tenemos alguna promoción disponible y vuelves por aquí, con gusto te mostraré las opciones vigentes.")], quickReplies: [], state, price: null };
  }
  if (objection === "NOT_INTERESTED") {
    state.conversationStatus = "CLOSED_NOT_INTERESTED";
    state.silenced = true;
    return { steps: [textStep("Claro 😊 Muchas gracias por haber revisado toda la información. Si en otro momento quieres conocer las opciones o promociones que estén disponibles, aquí estaremos para orientarte 💖")], quickReplies: [], state, price: null };
  }

  state.conversationStatus = "ACTIVE";
  state.silenced = false;
  if (objection === "TOO_EXPENSIVE") {
    const steps: ReplyStep[] = [textStep("Entiendo 😊 Y es totalmente válido comparar antes de tomar una decisión.\n\nLa diferencia es que Cake Artist no son clases sueltas: tienes una formación organizada con +50 clases, 8 módulos, desde fundamentos hasta estructuración y decoración, además del acompañamiento y los recursos incluidos.")];
    if (!state.guaranteeMentioned) {
      steps.push(textStep("Y además tienes 7 días de garantía para que puedas entrar, conocer el programa y verificar si realmente cumple con lo que esperabas 🔒"));
      state.guaranteeMentioned = true;
    }
    return { steps, quickReplies: EXPENSIVE_MENU, state, price: null };
  }
  if (objection === "THOUGHT_FREE") {
    return { steps: [textStep("Sí 😊 Cake Artist es una formación de pago porque incluye el programa completo, las +50 clases, los módulos, recursos y bonos correspondientes.\n\nSi quieres, puedo mostrarte el valor disponible para tu país.")], quickReplies: FREE_MENU, state, price: null };
  }
  if (objection === "THOUGHT_IN_PERSON") {
    return { steps: [textStep("Entiendo 😊 Cake Artist es 100% online.\n\nLas clases quedan grabadas para que puedas estudiarlas desde donde estés y avanzar a tu propio ritmo, sin horarios fijos.")], quickReplies: IN_PERSON_MENU, state, price: null };
  }
  if (objection === "ONLINE_DOUBT") {
    const menu = state.testimonialsViewed ? ["📚 Ver el contenido"] : ONLINE_DOUBT_MENU;
    return { steps: [textStep("Precisamente una de las ventajas es que puedes repetir las clases las veces que necesites y avanzar a tu ritmo 💖\n\nNo tienes que adaptarte a un horario fijo ni intentar aprender todo en una sola sesión.")], quickReplies: menu, state, price: null };
  }
  if (objection === "NO_TIME") {
    return { steps: [textStep("En ese caso la modalidad puede ayudarte bastante 😊 Las clases son grabadas, así que no tienes horarios fijos y puedes avanzar cuando tengas disponibilidad.")], quickReplies: [], state, price: null };
  }
  if (objection === "PAYMENT_SECURITY") {
    state.guaranteeMentioned = true;
    return { steps: [textStep("Sí 🔒 El pago se realiza mediante Hotmart, una plataforma reconocida internacionalmente.\n\nAdemás, Cake Artist cuenta con 7 días de garantía.")], quickReplies: SECURITY_MENU, state, price: null };
  }
  if (objection === "NO_EXPERIENCE") {
    state.experienceLevel = "beginner";
    state.answeredQuestions.experienceLevel = true;
    state.beginnerReassuranceShown = true;
    state.pendingAction = "socialProofOffer";
    state.currentStage = "SOCIAL_PROOF";
    return { steps: [textStep("Tranquila 💖 No necesitas experiencia previa para comenzar. Cake Artist está organizado paso a paso para que aprendas desde los fundamentos y avances a tu propio ritmo."), textStep("Si quieres, puedo mostrarte resultados reales de alumnas que también comenzaron aprendiendo desde cero 😊")], quickReplies: SOCIAL_PROOF_BEGINNER_MENU, state, price: null };
  }
  if (objection === "MATERIALS") {
    return { steps: [textStep("Cake Artist no incluye materiales físicos. Como la lista específica de utensilios e ingredientes no está documentada en la información configurada, prefiero no inventarte requisitos. Sí puedo orientarte sobre el contenido y la modalidad del programa.")], quickReplies: MAIN_MENU, state, price: null };
  }
  if (objection === "TRUST") {
    state.guaranteeMentioned = true;
    return { steps: [textStep("Entiendo que quieras comprobarlo antes de decidir 😊 El pago se procesa mediante Hotmart y Cake Artist cuenta con 7 días de garantía, dos elementos que te permiten realizar la inscripción con mayor seguridad." )], quickReplies: ["✨ Ver resultados de alumnas", "📚 Ver qué incluye", "💖 Ver cómo inscribirme"], state, price: null };
  }
  return { steps: [textStep("Entiendo 😊 Vale la pena resolver esa inquietud antes de tomar una decisión. Cuéntame cuál es el punto concreto que te preocupa y te responderé solo con la información confirmada de Cake Artist.")], quickReplies: [], state, price: null };
}

function testimonialsPlan(state: ConversationState, wantsRepeat: boolean): ReplyPlan {
  const steps: ReplyStep[] = [];
  if (!state.testimonialsViewed || wantsRepeat) {
    steps.push(actionStep("SHOW_TESTIMONIALS"));
    state.testimonialsViewed = true;
  }
  steps.push(textStep("Estas son algunas de las alumnas de nuestra comunidad SweetLovers 💖"));
  state.currentStage = "MAIN_MENU";
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  return { steps, quickReplies: TESTIMONIAL_MENU, state, price: null };
}

export function quickRepliesForState(state: ConversationState): string[] {
  if (state.checkoutShown || state.purchaseStatus === "purchased" || isTerminalStatus(state)) return [];
  if (!state.experienceLevel) return EXPERIENCE_MENU;
  if (state.pendingAction === "socialProofOffer") return state.experienceLevel === "experienced" ? SOCIAL_PROOF_EXPERIENCED_MENU : SOCIAL_PROOF_BEGINNER_MENU;
  if (state.pendingAction === "countryForPrice" || state.pendingAction === "countryForCheckout" || state.pendingAction === "countryForPayment" || state.pendingAction === "freeQuestion") return [];
  if (state.priceViewed) return PRICE_MENU;
  if (state.modulesViewed && state.officialBonusesViewed) return COURSE_MENU;
  if (state.testimonialsViewed) return TESTIMONIAL_MENU;
  return MAIN_MENU;
}

export function planConversation(raw: string, initial: ConversationState, prices: Price[], specialBonusesActive: boolean): ReplyPlan {
  const state: ConversationState = { ...initial, answeredQuestions: { ...initial.answeredQuestions } };
  const text = normalize(raw);
  const wantsRepeat = has(text, ["otra vez", "de nuevo", "repetir", "vuelve a mostrar"]);
  const beginnerChoice = has(text, ["comienzo desde cero", "empiezo desde cero", "voy a comenzar desde cero", "soy principiante"]);
  const experiencedChoice = has(text, ["ya tengo experiencia", "ya hago pasteles", "hago pasteles", "hago queques", "hago reposteria", "vendo pasteles", "tengo experiencia", "soy repostera", "soy pastelera", "cake design"]);
  const wantsCourse = has(text, ["ver que incluye", "revisar que incluye", "ver el contenido", "que incluye el curso", "ver el curso", "modulo", "contenido", "temario", "ruta de aprendizaje", "que voy a aprender", "que ensenan", "cuantas clases"]);
  const wantsPrice = has(text, ["ver precio", "cuanto cuesta", "cuanto vale", "precio", "costo", "valor del curso"]);
  const wantsEnroll = has(text, ["quiero inscribirme", "ver como inscribirme", "quiero comprar", "pasame el enlace", "pasame el link", "dame el enlace", "dame el link", "quiero aprovechar", "como compro", "inscribirme ahora", "continuar a la inscripcion"]);
  const wantsPayment = has(text, ["como puedo pagar", "como pago", "medios de pago", "medio de pago", "formas de pago", "forma de pago", "que metodos aceptan", "metodos de pago", "aceptan paypal", "aceptan tarjeta", "puedo pagar con"]);
  const wantsQuestion = has(text, ["tengo una duda", "tengo otra duda", "quiero preguntar", "hacer una pregunta"]);
  const wantsTestimonials = has(text, ["si quiero verlos", "ver resultados", "resultados de alumnas", "ver testimonios", "testimonios"]);
  const skipsTestimonials = has(text, ["prefiero seguir"]);
  const countryFromMessage = extractCountry(raw, prices);

  if (state.purchaseStatus === "purchased") {
    state.currentStage = "PURCHASED";
    return { steps: [textStep("Tu inscripción ya figura como realizada 💖 Si tienes una pregunta clara sobre el acceso, escríbela y con gusto te oriento.")], quickReplies: [], state, price: null };
  }

  if (/^(gracias|muchas gracias|mil gracias|gracias vale)[.!\s]*$/.test(text)) {
    return { steps: [], quickReplies: [], state, price: null };
  }

  if (has(text, ["ya compre", "ya pague", "realice mi compra", "compra realizada"])) {
    state.purchaseStatus = "purchased";
    state.currentStage = "PURCHASED";
    return { steps: [textStep("¡Qué alegría darte la bienvenida a Cake Artist! 💖 Tus credenciales llegarán al correo utilizado durante la compra.")], quickReplies: [], state, price: null };
  }

  // A definitive rejection closes the commercial sequence. Subsequent statements
  // remain silent; only a clear question receives a concise factual answer, with
  // no resources, price, checkout, CTA, or automatic funnel continuation.
  if (state.conversationStatus === "CLOSED_NOT_INTERESTED") {
    return closedFollowUpPlan(raw, text, state, prices, specialBonusesActive);
  }

  if (beginnerChoice || experiencedChoice) {
    const nextLevel = beginnerChoice ? "beginner" : "experienced";
    const alreadyHandled = state.experienceLevel === nextLevel && state.beginnerReassuranceShown && !wantsRepeat;
    state.experienceLevel = nextLevel;
    state.answeredQuestions.experienceLevel = true;
    state.lastAssistantQuestion = null;
    state.pendingAction = "socialProofOffer";
    state.conversationStatus = "ACTIVE";
    state.silenced = false;
    state.currentStage = "SOCIAL_PROOF";
    if (alreadyHandled) {
      const copy = nextLevel === "beginner"
        ? "Ya tengo presente que comienzas desde cero 💖 ¿Quieres ver resultados de alumnas o prefieres continuar?"
        : "Ya tengo presente tu experiencia 😊 ¿Quieres ver resultados de alumnas o prefieres continuar?";
      return { steps: [textStep(copy)], quickReplies: nextLevel === "experienced" ? SOCIAL_PROOF_EXPERIENCED_MENU : SOCIAL_PROOF_BEGINNER_MENU, state, price: null };
    }
    if (nextLevel === "beginner") {
      state.beginnerReassuranceShown = true;
      return {
        steps: [
          textStep("Tranquila 💖 No necesitas experiencia previa para comenzar.\n\nCake Artist está organizado paso a paso para que aprendas desde los fundamentos: masas, rellenos, ganache, estructuración y decoración, avanzando a tu propio ritmo."),
          textStep("Y para que no tengas que quedarte solamente con lo que yo te digo, puedo mostrarte algunos resultados reales de alumnas que también comenzaron aprendiendo desde cero 😊"),
        ],
        quickReplies: SOCIAL_PROOF_BEGINNER_MENU, state, price: null,
      };
    }
    return {
      steps: [
        textStep("¡Buenísimo! 😊 Entonces Cake Artist puede ayudarte a llevar lo que ya sabes a un nivel mucho más profesional, especialmente en masas, rellenos, ganache, estructuración y técnicas modernas de decoración."),
        textStep("También puedo mostrarte algunos resultados de alumnas que ya tenían experiencia y querían llevar sus pasteles a un nivel más profesional 😊"),
      ],
      quickReplies: SOCIAL_PROOF_EXPERIENCED_MENU, state, price: null,
    };
  }

  if (state.pendingAction === "socialProofOffer" && skipsTestimonials) {
    state.pendingAction = null;
    state.currentStage = "MAIN_MENU";
    return { steps: [], quickReplies: MAIN_MENU, state, price: null };
  }
  if ((state.pendingAction === "socialProofOffer" && wantsTestimonials) || wantsTestimonials) return testimonialsPlan(state, wantsRepeat);

  // This combined price/modality response is intentionally evaluated before the
  // general objection classifier so it closes once instead of trying to recover
  // the sale through the regular price or in-person branches.
  if (shouldCloseForPriceOrModality(text)) return priceModalityClosingPlan(state);

  const objection = detectObjection(text);
  if (objection) return objectionPlan(objection, state);

  if (state.pendingAction === "countryForPrice" || state.pendingAction === "countryForCheckout" || state.pendingAction === "countryForPayment") {
    if (countryFromMessage || raw.trim()) {
      state.country = countryFromMessage ?? canonicalCountry(raw, prices);
      state.answeredQuestions.country = true;
    }
    const pending = state.pendingAction;
    if (pending === "countryForCheckout") return enrollmentPlan(state, prices, specialBonusesActive, true);
    if (pending === "countryForPayment") return paymentPlan(state, prices);
    return pricePlan(state, prices);
  }

  if (wantsCourse) {
    state.currentStage = "COURSE_CONTENT";
    state.knowsProgram = true;
    state.pendingAction = null;
    state.lastAssistantQuestion = null;
    const steps: ReplyStep[] = [];
    if (!state.modulesViewed || wantsRepeat) {
      steps.push(textStep("Claro 💖 Mira cómo está organizada toda la formación:"));
      steps.push(...moduleRevealSteps());
      state.modulesViewed = true;
    }
    if (!state.officialBonusesViewed || wantsRepeat) {
      steps.push(textStep("Además, dentro de tu acceso también tienes estos bonos incluidos 👇🎁"));
      steps.push(actionStep("SHOW_OFFICIAL_BONUSES"));
      state.officialBonusesViewed = true;
    }
    if (!steps.length) steps.push(textStep("La formación y los bonos incluidos ya quedaron visibles arriba 💖"));
    state.currentStage = "MAIN_MENU";
    return { steps, quickReplies: allowedMenu(state, COURSE_MENU), state, price: null };
  }

  if (wantsPrice) {
    if (countryFromMessage) {
      state.country = countryFromMessage;
      state.answeredQuestions.country = true;
    }
    return pricePlan(state, prices);
  }

  if (wantsPayment) {
    if (countryFromMessage) {
      state.country = countryFromMessage;
      state.answeredQuestions.country = true;
    }
    return paymentPlan(state, prices);
  }

  if (wantsEnroll) {
    if (countryFromMessage) {
      state.country = countryFromMessage;
      state.answeredQuestions.country = true;
    }
    state.purchaseIntent = "HIGH";
    return enrollmentPlan(state, prices, specialBonusesActive, !state.priceViewed);
  }

  if (wantsQuestion) {
    state.currentStage = "FREE_QUESTION";
    state.pendingAction = "freeQuestion";
    state.lastAssistantQuestion = "freeQuestion";
    return { steps: [textStep("Claro 💖 Escríbeme tu duda sobre Cake Artist y te respondo directamente.")], quickReplies: [], state, price: null };
  }

  if (countryFromMessage && !state.country) {
    state.country = countryFromMessage;
    state.answeredQuestions.country = true;
  }

  if (has(text, ["montar mi negocio", "crear mi negocio", "iniciar mi negocio", "quiero emprender", "ganar dinero", "aprender para vender", "vender pasteles", "tener clientes", "convertir la reposteria en negocio"])) {
    state.mainGoal = "profesionalizar la repostería para desarrollar un negocio";
    state.answeredQuestions.mainGoal = true;
    state.businessStatus = "planning";
    state.answeredQuestions.businessStatus = true;
    return menuPlan(state, "Claro 💖 Si tu objetivo es emprender, tener una buena base técnica puede ayudarte a ofrecer productos con una presentación mucho más profesional.\n\nCake Artist puede enseñarte esa parte técnica paso a paso; los resultados económicos posteriormente dependerán de cómo desarrolles y comercialices tu negocio.");
  }

  if (has(text, ["quiero aprender", "quiero mejorar", "quiero perfeccionar", "quiero formarme"])) {
    state.mainGoal = raw.trim();
    state.answeredQuestions.mainGoal = true;
    const copy = state.experienceLevel === "beginner"
      ? "Claro 💖 Cake Artist te permite construir una base paso a paso, desde los fundamentos hasta masas, rellenos, ganache, estructuración y decoración."
      : "Claro 💖 Cake Artist puede ayudarte a perfeccionar técnica y presentación con una ruta que integra masas, rellenos, ganache, estructuración y decoración moderna.";
    return menuPlan(state, copy);
  }

  if (has(text, ["quien eres", "quien es vale", "eres una persona", "eres humana"])) return menuPlan(state, "Soy Vale, asesora virtual autorizada para orientarte sobre Cake Artist by Bel García. 😊");
  if (has(text, ["quien dicta", "quien ensena", "quien es la instructora", "quien es bel"])) return menuPlan(state, "La instructora de Cake Artist es Bel García. El programa está organizado para llevarte de los fundamentos a técnicas completas de estructuración y decoración.");
  if (has(text, ["horno profesional", "necesito horno", "necesita horno", "que horno"])) return menuPlan(state, "La información oficial no especifica que sea obligatorio contar con un horno profesional, así que no quiero darte una información incorrecta. Sí puedo decirte que la formación comienza desde los fundamentos y avanza paso a paso.");
  if (has(text, ["ganache", "relleno", "masas", "estructuracion", "montaje", "decoracion", "floral chic", "chocolate lover", "mermaid fantasy"])) return menuPlan(state, "Sí 💖 Esa técnica forma parte de la ruta de Cake Artist y se trabaja para que puedas aplicarla con más seguridad y conseguir resultados más firmes y limpios.");
  if (has(text, ["garantia", "devolucion", "reembolso"])) {
    state.guaranteeMentioned = true;
    return menuPlan(state, "Cake Artist cuenta con una garantía de 7 días. Si dentro de ese período el programa no cumple tus expectativas, puedes solicitar el reembolso correspondiente. 🔒");
  }
  if (has(text, ["es online", "modalidad", "es presencial", "clases grabadas"])) return menuPlan(state, "Cake Artist es 100% online. Las clases quedan grabadas para que avances a tu ritmo desde donde estés y sin horarios fijos. 💖");
  if (has(text, ["cuando tengo acceso", "como accedo", "como ingreso", "credenciales", "acceso inmediato"])) return menuPlan(state, "El acceso es inmediato después de confirmarse el pago. Las credenciales llegan al correo que utilices durante la compra.");
  if (has(text, ["por whatsapp", "me lo mandan por whatsapp"])) return menuPlan(state, "No. El programa no se entrega por WhatsApp; tus credenciales llegan al correo utilizado durante la compra.");
  if (has(text, ["bonos", "bonus", "regalos incluidos"])) return menuPlan(state, "Cake Artist incluye recursos y bonos oficiales. Puedes verlos junto con el contenido del curso, y los bonos especiales solo se muestran cuando la promoción correspondiente está activa.");
  if (has(text, ["cuantas clases", "numero de clases"])) return menuPlan(state, "Cake Artist incluye más de 50 clases grabadas en HD, organizadas en 8 módulos.");
  if (has(text, ["cuanto dura", "duracion del curso", "fecha de inicio", "hasta cuando", "cuotas", "descuento", "cupos"])) return menuPlan(state, "No quiero darte una información incorrecta. Ese dato específico no está configurado en la información oficial de Cake Artist.");

  if (!state.experienceLevel) {
    state.currentStage = "EXPERIENCE_DIAGNOSIS";
    state.lastAssistantQuestion = "experience";
    return { steps: [textStep("Para orientarte según tu punto de partida, elige la opción que te describe mejor.")], quickReplies: EXPERIENCE_MENU, state, price: null };
  }

  const prompt = [
    "Responde como Vale, asesora virtual de Cake Artist by Bel García, en español latino, con cercanía y precisión.",
    "Responde primero la pregunta concreta en 1 o 2 párrafos breves. No hagas otra pregunta de venta, no repitas precio, módulos, testimonios ni checkout, y no inventes datos.",
    "Datos confirmados: curso 100% online; acceso inmediato tras confirmarse el pago; credenciales por correo; no se entrega por WhatsApp; no incluye materiales físicos; más de 50 clases grabadas en HD; 8 módulos sobre fundamentos, masas, rellenos, ganache, estructuración y decoración; garantía de 7 días; el pago se procesa mediante Hotmart.",
    "Si expresa un deseo, objetivo u opinión, relaciónalo con una base técnica sólida y no uses un fallback. No prometas ingresos.",
    "Si pide un dato factual que no está en esos datos, responde exactamente: «No quiero darte una información incorrecta. Ese dato específico no está configurado en la información oficial de Cake Artist.»",
    `Mensaje del usuario: ${raw}`,
  ].join("\n");
  state.pendingAction = null;
  state.lastAssistantQuestion = null;
  state.currentStage = "MAIN_MENU";
  return { steps: [], quickReplies: allowedMenu(state, QUESTION_MENU), state, price: null, requiresInference: true, inferencePrompt: prompt };
}
