import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, fileToBase64, type ApiResponse } from "./api";
import { ActionMessage, ChatHeader, ConversationDecor, MessageBubble, QuickReplies, TypingIndicator, type ChatMessage } from "./components/chat/Chat";
import { ChatInput } from "./components/chat/ChatInput";
import { AdminPanel } from "./components/admin/AdminPanel";
import { AdminGate } from "./components/admin/AdminGate";
import { trackPixel } from "./lib/pixel";

const VISITOR_KEY = "cake-artist-visitor-id";
type Session = ApiResponse<typeof api, "bootstrapSession">;

let volatileVisitorId: string | null = null;

function createClientId(prefix: string) {
  try {
    const nativeRandomUuid = globalThis.crypto?.randomUUID;
    if (typeof nativeRandomUuid === "function") return nativeRandomUuid.call(globalThis.crypto);
  } catch {
    // Older and restricted webviews can expose crypto without randomUUID.
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createVisitorId() {
  return createClientId("visitor");
}

function getVisitorId() {
  if (volatileVisitorId) return volatileVisitorId;

  // Some host webviews sandbox storage. Accessing localStorage can throw a
  // SecurityError before React paints anything, so storage is an enhancement,
  // not a prerequisite for opening the conversation.
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      const current = window[storage].getItem(VISITOR_KEY);
      if (current) {
        volatileVisitorId = current;
        return current;
      }
    } catch {
      // Try the next storage option, then fall back to memory.
    }
  }

  const next = createVisitorId();
  volatileVisitorId = next;
  try {
    window.localStorage.setItem(VISITOR_KEY, next);
  } catch {
    try {
      window.sessionStorage.setItem(VISITOR_KEY, next);
    } catch {
      // The in-memory id still keeps this open session stable.
    }
  }
  return next;
}
function wait(ms: number) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
function naturalDelay(min: number, max: number) { return Math.floor(min + Math.random() * (max - min + 1)); }
async function blobToBase64(blob: Blob) { const bytes = new Uint8Array(await blob.arrayBuffer()); let binary = ""; for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i] ?? 0); return btoa(binary); }

export function App() {
  const visitorId = useMemo(getVisitorId, []);
  const queryClient = useQueryClient();
  const [typing, setTyping] = useState(false);
  const [typingLabel, setTypingLabel] = useState("Vale está escribiendo...");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // This flag belongs to the current page session only. Once bootstrap has
  // decided how to open the conversation, later query refreshes must never
  // run the returning-visitor greeting again.
  const returningGreetingShown = useRef(false);
  const isGeneratingResponse = useRef(false);
  const lastProcessedUserMessageId = useRef<string | null>(null);
  const processedUserMessageIds = useRef(new Set<string>());
  // Píxel de Meta: el evento Contact se dispara una sola vez por sesión,
  // cuando el visitante envía su primer mensaje.
  const contactTracked = useRef(false);

  const session = useQuery({
    queryKey: ["session", visitorId],
    queryFn: async () => {
      const result = await api.bootstrapSession({ visitorId, returningGreetingShown: returningGreetingShown.current });
      returningGreetingShown.current = result.returningGreetingShown;
      return result;
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
  const admin = useQuery({ queryKey: ["admin-config"], queryFn: () => api.listAdminConfig({}) });
  const send = useMutation({ mutationFn: api.sendMessage });
  const transcribe = useMutation({ mutationFn: api.transcribeAudio });
  const uploadImage = useMutation({ mutationFn: api.uploadImage });
  const progress = useMutation({ mutationFn: api.updateProgress });

  const data = session.data;
  const prices = admin.data?.prices ?? [];
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [data?.history.length, typing]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const syncHeight = () => document.documentElement.style.setProperty("--app-height", `${Math.round(viewport?.height ?? window.innerHeight)}px`);
    syncHeight();
    viewport?.addEventListener("resize", syncHeight);
    window.addEventListener("resize", syncHeight);
    return () => { viewport?.removeEventListener("resize", syncHeight); window.removeEventListener("resize", syncHeight); };
  }, []);

  async function processUserMessage(message: { messageId: string; role: "user"; text: string; type?: "text" | "audio" | "image"; mediaKey?: string; transcript?: string; mediaUrl?: string }) {
    if (!data || message.role !== "user") return;
    if (isGeneratingResponse.current || lastProcessedUserMessageId.current === message.messageId || processedUserMessageIds.current.has(message.messageId)) return;

    // Primer mensaje del visitante en esta conversación → evento Contact del píxel.
    if (!contactTracked.current && !data.history.some((item) => item.sender === "prospect")) {
      contactTracked.current = true;
      trackPixel("Contact");
    }

    isGeneratingResponse.current = true;
    processedUserMessageIds.current.add(message.messageId);
    setError(null);
    const optimistic: ChatMessage = {
      id: message.messageId,
      sender: "prospect",
      type: message.type ?? "text",
      content: message.type === "audio" ? (message.transcript || "Mensaje de voz") : message.type === "image" ? "Imagen adjunta" : message.text,
      mediaUrl: message.mediaUrl,
      transcript: message.transcript,
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData<Session>(["session", visitorId], (old) => old ? { ...old, history: old.history.some((item) => item.id === message.messageId) ? old.history : [...old.history, optimistic], quickReplies: [] } : old);
    setTyping(true);
    setTypingLabel("Vale está escribiendo...");
    try {
      const response = await send.mutateAsync({
        visitorId,
        conversationId: data.conversationId,
        messageId: message.messageId,
        role: message.role,
        text: message.text,
        type: message.type ?? "text",
        mediaKey: message.mediaKey,
        transcript: message.transcript,
      });
      lastProcessedUserMessageId.current = message.messageId;
      const newIds = new Set(response.newMessages.map((item) => item.id));
      const baseHistory = response.history.filter((item) => !newIds.has(item.id));
      queryClient.setQueryData<Session>(["session", visitorId], (old) => old ? { ...old, history: baseHistory, state: response.state, quickReplies: [] } : old);
      if (!response.processed || !response.newMessages.length) {
        setTyping(false);
        queryClient.setQueryData<Session>(["session", visitorId], (old) => old ? { ...old, state: response.state, quickReplies: response.quickReplies } : old);
        return;
      }
      await wait(naturalDelay(3000, 5000));
      setTyping(false);
      for (let index = 0; index < response.newMessages.length; index += 1) {
        const nextMessage = response.newMessages[index];
        if (!nextMessage) continue;
        queryClient.setQueryData<Session>(["session", visitorId], (old) => old && !old.history.some((item) => item.id === nextMessage.id) ? { ...old, history: [...old.history, nextMessage] } : old);
        if (index < response.newMessages.length - 1) {
          await wait(naturalDelay(800, 1500));
          setTyping(true);
          await wait(naturalDelay(800, 1500));
          setTyping(false);
        }
      }
      queryClient.setQueryData<Session>(["session", visitorId], (old) => old ? { ...old, state: response.state, quickReplies: response.quickReplies } : old);
    } catch {
      processedUserMessageIds.current.delete(message.messageId);
      setTyping(false);
      setError("No pude guardar el mensaje. Inténtalo nuevamente.");
      void session.refetch();
    } finally {
      isGeneratingResponse.current = false;
    }
  }

  function submitUserMessage(input: { text: string; type?: "text" | "audio" | "image"; mediaKey?: string; transcript?: string; mediaUrl?: string }) {
    const messageId = createClientId("user-message");
    return processUserMessage({ ...input, messageId, role: "user" });
  }

  async function handleAudio(blob: Blob, browserTranscript: string) {
    if (!data) return; setTyping(true); setTypingLabel("Escuchando tu audio...");
    try {
      const stored = await transcribe.mutateAsync({ dataBase64: await blobToBase64(blob), mimeType: blob.type || "audio/webm", browserTranscript: browserTranscript || undefined });
      setTyping(false);
      await submitUserMessage({ text: stored.transcript ?? "__audio__", type: "audio", mediaKey: stored.mediaKey, mediaUrl: stored.mediaUrl, transcript: stored.transcript ?? undefined });
    } catch { setTyping(false); setError("No pude entender bien ese audio 😊 Puedes intentarlo otra vez o escribir el mensaje."); }
  }

  async function handleImage(file: File) {
    try {
      const encoded = await fileToBase64(file);
      const stored = await uploadImage.mutateAsync({ dataBase64: encoded.dataBase64, mimeType: encoded.mimeType === "image/png" ? "image/png" : "image/jpeg" });
      await submitUserMessage({ text: "__image__", type: "image", mediaKey: stored.mediaKey, mediaUrl: stored.mediaUrl });
    } catch { setError("No pude adjuntar esa imagen. Usa un archivo PNG o JPEG e inténtalo de nuevo."); }
  }

  function handleProgress(kind: "video" | "checkout") {
    if (!data) return;
    progress.mutate({ visitorId, conversationId: data.conversationId, checkoutVideoViewed: kind === "video" ? true : undefined, checkoutShown: kind === "checkout" ? true : undefined });
  }

  if (session.isPending || admin.isPending) return <main className="loading-screen"><div className="loading-mark">V</div><p>Preparando la conversación…</p></main>;
  if (session.error || !data || admin.error || !admin.data) return <main className="loading-screen"><p>No pudimos abrir la conversación.</p><button type="button" onClick={() => { void session.refetch(); void admin.refetch(); }}>Reintentar</button></main>;

  return <main className="stage"><section className="chat-shell" aria-label="Conversación con Vale">
    <ChatHeader onAdmin={() => setAdminOpen(true)} />
    <div className="conversation" ref={listRef}>
      <ConversationDecor />
      <div className="conversation-inner">
      <div className="day-marker">Conversación</div>
      {data.history.map((message) => message.type === "action"
        ? <ActionMessage key={message.id} message={message} experienceLevel={data.state.experienceLevel} country={data.state.country} prices={prices} onProgress={handleProgress} />
        : <MessageBubble key={message.id} message={message} />)}
      <TypingIndicator active={typing} label={typingLabel} />
      <QuickReplies items={data.quickReplies} disabled={send.isPending || typing} onPick={(item) => void submitUserMessage({ text: item })} />
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div></div>
    <footer className="composer"><ChatInput disabled={send.isPending || typing || data.state.purchaseStatus === "purchased"} processingAudio={transcribe.isPending} initialText={data.history.length === 0 ? "Hola Vale, quiero que me des más información acerca del curso" : undefined} onSend={(text) => void submitUserMessage({ text })} onImage={(file) => void handleImage(file)} onAudio={(blob, transcript) => void handleAudio(blob, transcript)} /></footer>
  </section>{adminOpen && !adminUnlocked && <AdminGate onUnlock={() => setAdminUnlocked(true)} onClose={() => setAdminOpen(false)} />}{adminOpen && adminUnlocked && admin.data && <AdminPanel data={admin.data} onClose={() => { setAdminOpen(false); setAdminUnlocked(false); }} />}</main>;
}
