import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";

export function AdminGate({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const status = useQuery({ queryKey: ["admin-password-status"], queryFn: () => api.adminPasswordStatus({}) });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!status.data?.hasPassword) {
        if (password.length < 4) { setError("La clave debe tener al menos 4 caracteres."); setBusy(false); return; }
        if (password !== confirm) { setError("Las claves no coinciden."); setBusy(false); return; }
        const result = await api.setAdminPassword({ password });
        if (result.ok) { onUnlock(); } else { setError(result.error ?? "No se pudo crear la clave."); }
      } else {
        const result = await api.verifyAdminPassword({ password });
        if (result.ok) { onUnlock(); } else { setError("Clave incorrecta."); }
      }
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-backdrop" role="presentation"><aside className="admin-panel" aria-label="Acceso restringido">
    <header><div><p>Zona privada</p><h2>Administración</h2></div><button type="button" aria-label="Cerrar" onClick={onClose}>×</button></header>
    {status.isPending ? <p className="admin-status">Verificando…</p> : (
      <form onSubmit={submit} className="admin-gate-form">
        <p>{status.data?.hasPassword ? "Ingresa tu clave para entrar." : "Crea tu clave de administrador. Solo tú podrás abrir este panel."}</p>
        <label>Clave<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu clave" /></label>
        {!status.data?.hasPassword && <label>Confirmar clave<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite tu clave" /></label>}
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Verificando…" : status.data?.hasPassword ? "Entrar" : "Crear clave y entrar"}</button>
      </form>
    )}
  </aside></div>;
}
