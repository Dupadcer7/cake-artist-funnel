import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & typeof globalThis & { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike };

export function ChatInput({ disabled, processingAudio, onSend, onImage, onAudio }: { disabled: boolean; processingAudio: boolean; onSend: (text: string) => void; onImage: (file: File) => void; onAudio: (blob: Blob, transcript: string) => void }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ blob: Blob; url: string; transcript: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const resultIndexRef = useRef(0);
  const finalizeTimerRef = useRef<number | null>(null);
  const finalizedRef = useRef(false);

  function submit(event: FormEvent) { event.preventDefault(); const clean = text.trim(); if (!clean || disabled) return; onSend(clean); setText(""); }
  function chooseImage(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) onImage(file); event.target.value = ""; }
  function stopTracks() { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; }
  function finalizePreview() {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    if (finalizeTimerRef.current !== null) { window.clearTimeout(finalizeTimerRef.current); finalizeTimerRef.current = null; }
    const recorder = recorderRef.current;
    const blob = new Blob(chunksRef.current, { type: recorder?.mimeType || "audio/webm" });
    if (!blob.size) setAudioError("No se detectó audio. Inténtalo otra vez y habla después de iniciar la grabación.");
    else setPreview({ blob, url: URL.createObjectURL(blob), transcript: transcriptRef.current.trim() });
    stopTracks();
    recorderRef.current = null;
  }
  function stopRecording() {
    setRecording(false);
    finalizedRef.current = false;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    const recorder = recorderRef.current;
    if (recorder) recorder.onstop = () => { /* la vista previa se crea al terminar la transcripción */ };
    try { recorder?.stop(); } catch { /* noop */ }
    if (recognition) {
      // Esperar los resultados finales de la transcripción antes de crear la vista previa
      recognition.onend = () => finalizePreview();
      try { recognition.stop(); } catch { /* noop */ }
      finalizeTimerRef.current = window.setTimeout(() => finalizePreview(), 2500);
    } else {
      finalizePreview();
    }
  }
  async function startRecording() {
    setAudioError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setAudioError("La grabación de voz no está disponible en este navegador. Puedes escribir tu mensaje aquí mismo.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; chunksRef.current = []; transcriptRef.current = ""; resultIndexRef.current = 0; finalizedRef.current = false;
      const recorder = new MediaRecorder(stream); recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onerror = () => { setAudioError("No pude grabar el audio. Revisa el permiso del micrófono e inténtalo otra vez."); setRecording(false); stopTracks(); };
      recorder.onstop = () => finalizePreview();
      const w = window as SpeechWindow; const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (Ctor) { const recognition = new Ctor(); recognition.lang = "es-419"; recognition.continuous = true; recognition.interimResults = true; recognition.onresult = (event) => { let finalText = ""; for (let index = resultIndexRef.current; index < event.results.length; index += 1) { const result = event.results[index]; if (result?.isFinal) { finalText += `${result[0]?.transcript ?? ""} `; resultIndexRef.current = index + 1; } } if (finalText) transcriptRef.current += finalText; }; recognition.onerror = () => undefined; try { recognition.start(); recognitionRef.current = recognition; } catch { recognitionRef.current = null; } }
      recorder.start(); setRecording(true);
    } catch (error) {
      setRecording(false); stopTracks();
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setAudioError(denied ? "Necesito permiso para usar el micrófono. Actívalo en tu navegador y vuelve a intentarlo." : "No pude iniciar el micrófono. Puedes intentarlo otra vez o escribir tu mensaje.");
    }
  }
  function cancelPreview() { if (preview) URL.revokeObjectURL(preview.url); setPreview(null); }
  function sendPreview() { if (!preview) return; onAudio(preview.blob, preview.transcript); URL.revokeObjectURL(preview.url); setPreview(null); }

  if (preview) return <div className="audio-preview"><audio controls src={preview.url} /><div><button type="button" onClick={cancelPreview}>Cancelar</button><button className="primary" type="button" onClick={sendPreview} disabled={processingAudio}>{processingAudio ? "Procesando…" : "Enviar audio"}</button></div></div>;
  return <form className="chat-input" onSubmit={submit}>
    <button className="icon-button" type="button" aria-label="Adjuntar imagen" onClick={() => imageInputRef.current?.click()} disabled={disabled}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 12.5 13 7a3.5 3.5 0 1 1 5 5l-7.7 7.7a5 5 0 0 1-7.1-7.1l8-8"/><path d="m6.5 15.5 7.8-7.8"/></svg></button><input ref={imageInputRef} className="file-input" aria-hidden="true" tabIndex={-1} type="file" accept="image/png,image/jpeg" onChange={chooseImage} disabled={disabled} />
    <button className={`icon-button ${recording ? "recording" : ""}`} type="button" aria-label={recording ? "Detener grabación" : "Grabar mensaje de voz"} aria-describedby="voice-privacy-note" onClick={() => recording ? stopRecording() : void startRecording()} disabled={disabled}>{recording ? "■" : <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/></svg>}</button>
    <textarea aria-label="Escribe tu mensaje" placeholder="Escribe tu mensaje..." value={text} onChange={(event) => setText(event.target.value)} rows={1} disabled={disabled} />
    <button className="send-button" type="submit" disabled={disabled || !text.trim()}>Enviar</button>
    {recording && <span className="composer-status" role="status">Grabando… toca el botón cuadrado para terminar.</span>}
    {audioError && <span className="composer-error" role="alert">{audioError}</span>}
    <span className="voice-privacy-note" id="voice-privacy-note">Tus notas de voz se transcriben con el reconocimiento de voz de tu navegador.</span>
  </form>;
}
