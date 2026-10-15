export type ChatMessage = {
  id: string;
  sender: "vale" | "prospect";
  type: "text" | "audio" | "image" | "action";
  content: string;
  action?: string;
  mediaKey?: string;
  mediaUrl?: string;
  transcript?: string;
  createdAt: string;
};

export type ConversationState = {
  currentStage: string; country: string | null; experienceLevel: string | null;
  businessStatus: string | null; mainGoal: string | null; mainProblem: string | null;
  modulesViewed: boolean; testimonialsViewed: boolean; officialBonusesViewed: boolean;
  specialBonusesViewed: boolean; priceViewed: boolean; checkoutVideoViewed: boolean;
  checkoutShown: boolean; purchaseIntent: string; knowsProgram: boolean;
  lastAssistantQuestion: string | null; pendingAction: string | null; silenced: boolean;
  lastProcessedUserMessageId: string | null; isGeneratingResponse: boolean;
  answeredQuestions: { experienceLevel: boolean; mainGoal: boolean; country: boolean; businessStatus: boolean };
  beginnerReassuranceShown: boolean; detectedObjection: string | null; conversationStatus: string;
  guaranteeMentioned: boolean; purchaseStatus: "prospect" | "purchased";
};

export type Price = {
  country: string; currency: string; regularPrice: string | null; offerPrice: string | null;
  regularPriceDisplay: string | null; offerPriceDisplay: string; displayPrice: string;
  discountPercentOfficial: number | null; promotionActive: boolean; availableCoupons: number | null;
  paymentMethods: string[]; supportedPaymentMethods: string[]; enabledPaymentMethods: string[];
  official: boolean; excluded: boolean; sortOrder?: number;
};

export type SessionResponse = {
  visitorId: string; conversationId: string; isReturningVisitor: boolean; returningGreetingShown: boolean;
  history: ChatMessage[]; state: ConversationState; quickReplies: string[];
};

export type SendMessageResponse = {
  processed: boolean; newMessages: ChatMessage[]; history: ChatMessage[]; state: ConversationState;
  quickReplies: string[]; action: string; price: Price | null;
};

export type AdminResponse = {
  prices: Array<Price & { sortOrder: number }>;
  specialBonusesActive: boolean;
  speechToTextProvider: string;
};

async function call<T>(action: string, args: unknown): Promise<T> {
  const response = await fetch("/api/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, args }),
  });
  const payload = await response.json() as { ok?: boolean; data?: T; error?: string };
  if (!response.ok || payload.ok === false || payload.data === undefined) throw new Error(payload.error || "No se pudo completar la solicitud.");
  return payload.data;
}

export async function fileToBase64(file: File) {
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo."));
    reader.onload = () => resolve(String(reader.result ?? "").split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
  return { dataBase64, mimeType: file.type };
}

export const api = {
  bootstrapSession: (args: { visitorId: string; returningGreetingShown?: boolean }) => call<SessionResponse>("bootstrapSession", args),
  sendMessage: (args: { visitorId: string; conversationId: string; messageId: string; role: "user"; text: string; type?: "text" | "audio" | "image"; mediaKey?: string; transcript?: string }) => call<SendMessageResponse>("sendMessage", args),
  updateProgress: (args: { visitorId: string; conversationId: string; checkoutVideoViewed?: boolean; checkoutShown?: boolean }) => call<{ ok: boolean }>("updateProgress", args),
  transcribeAudio: (args: { dataBase64: string; mimeType: string; browserTranscript?: string }) => call<{ status: "ok" | "provider_unavailable"; transcript: string | null; mediaKey: string; mediaUrl: string; provider: string }>("transcribeAudio", args),
  uploadImage: (args: { dataBase64: string; mimeType: "image/png" | "image/jpeg" }) => call<{ mediaKey: string; mediaUrl: string }>("uploadImage", args),
  listAdminConfig: (_args: Record<string, never>) => call<AdminResponse>("listAdminConfig", {}),
  getFunnelAnalytics: (_args: Record<string, never>) => call<{ totalVisitors: number; started: number; diagnosed: number; viewedContent: number; viewedPrice: number; checkoutIntent: number; notInterested: number; byCountry: { country: string; count: number }[]; byExperience: { level: string; count: number }[] }>("getFunnelAnalytics", {}),
  updatePrice: (args: { country: string; currency: string; regularPrice: string | null; offerPrice: string | null; regularPriceDisplay: string | null; offerPriceDisplay: string; discountPercentOfficial: number | null; promotionActive: boolean; availableCoupons: number | null; official: boolean }) => call<{ ok: boolean; error: string | null }>("updatePrice", args),
  updatePaymentMethods: (args: { country: string; enabledPaymentMethods: string[] }) => call<{ ok: boolean; enabledPaymentMethods: string[] }>("updatePaymentMethods", args),
  updatePromotion: (args: { active: boolean }) => call<{ ok: boolean }>("updatePromotion", args),
};

export type ApiResponse<TApi, K extends keyof TApi> = TApi[K] extends (...args: never[]) => Promise<infer R> ? R : never;
