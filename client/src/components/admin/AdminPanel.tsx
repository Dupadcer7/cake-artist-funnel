import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api, type ApiResponse } from "../../api";

type AdminData = ApiResponse<typeof api, "listAdminConfig">;
type AdminPrice = AdminData["prices"][number];
type FunnelData = ApiResponse<typeof api, "getFunnelAnalytics">;

function FunnelAnalytics() {
  const { data, isPending, isError } = useQuery({ queryKey: ["funnel-analytics"], queryFn: () => api.getFunnelAnalytics({}) });
  if (isPending) return <p className="admin-status">Cargando datos del embudo…</p>;
  if (isError || !data) return <p className="inline-error admin-validation">No se pudieron cargar los datos.</p>;
  const stages: { label: string; value: number }[] = [
    { label: "Visitaron el funnel", value: data.totalVisitors },
    { label: "Escribieron un mensaje", value: data.started },
    { label: "Completaron el diagnóstico", value: data.diagnosed },
    { label: "Vieron el contenido del curso", value: data.viewedContent },
    { label: "Vieron el precio", value: data.viewedPrice },
    { label: "Llegaron a inscripción", value: data.checkoutIntent },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));
  return <div className="funnel-analytics">
    {stages.map((stage, i) => {
      const prev = i === 0 ? stage.value : stages[i - 1].value;
      const drop = prev > 0 ? Math.round((1 - stage.value / prev) * 100) : 0;
      return <div key={stage.label} className="funnel-stage">
        <div className="funnel-stage-head"><strong>{stage.label}</strong><span>{stage.value}</span></div>
        <div className="funnel-bar"><i style={{ width: `${Math.round((stage.value / max) * 100)}%` }} /></div>
        {i > 0 && <small className="funnel-drop">{drop}% se quedó en el paso anterior ↑</small>}
      </div>;
    })}
    <p className="funnel-note">Cerraron por desinterés: <strong>{data.notInterested}</strong></p>
    {data.byCountry.length > 0 && <div className="funnel-breakdown"><strong>Por país</strong>
      {data.byCountry.map((r) => <div key={r.country} className="funnel-row"><span>{r.country}</span><span>{r.count}</span></div>)}
    </div>}
    {data.byExperience.length > 0 && <div className="funnel-breakdown"><strong>Por experiencia</strong>
      {data.byExperience.map((r) => <div key={r.level} className="funnel-row"><span>{r.level === "beginner" ? "Desde cero" : r.level === "experienced" ? "Con experiencia" : r.level}</span><span>{r.count}</span></div>)}
    </div>}
  </div>;
}

function nullableText(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value || null;
}

function nullableNumber(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AdminPanel({ data, onClose }: { data: AdminData; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-config"] });
  const updatePrice = useMutation({
    mutationFn: api.updatePrice,
    onSuccess: (result, variables) => {
      if (result.ok) {
        setPriceErrors((current) => ({ ...current, [variables.country]: "" }));
        void refresh();
      } else {
        setPriceErrors((current) => ({ ...current, [variables.country]: result.error ?? "No se pudo guardar el precio." }));
      }
    },
  });
  const updatePaymentMethods = useMutation({ mutationFn: api.updatePaymentMethods, onSuccess: refresh });
  const updatePromotion = useMutation({ mutationFn: api.updatePromotion, onSuccess: refresh });
  const [tab, setTab] = useState<"precios" | "embudo">("embudo");
  const activePrices = data.prices.filter((price) => !price.excluded);

  function savePrice(event: FormEvent<HTMLFormElement>, country: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const regularPrice = nullableText(form, "regularPrice");
    const offerPrice = nullableText(form, "offerPrice");
    const regularPriceDisplay = nullableText(form, "regularPriceDisplay");
    const offerPriceDisplay = String(form.get("offerPriceDisplay") ?? "").trim();
    if (regularPrice && offerPrice && !regularPriceDisplay) {
      setPriceErrors((current) => ({ ...current, [country]: "Completa el precio normal mostrado para que la oferta siempre enseñe ANTES y AHORA." }));
      return;
    }
    if (offerPrice && !offerPriceDisplay) {
      setPriceErrors((current) => ({ ...current, [country]: "Completa el precio promocional mostrado antes de guardar." }));
      return;
    }
    setPriceErrors((current) => ({ ...current, [country]: "" }));
    updatePrice.mutate({
      country,
      currency: String(form.get("currency") ?? ""),
      regularPrice,
      offerPrice,
      regularPriceDisplay,
      offerPriceDisplay,
      discountPercentOfficial: nullableNumber(form, "discountPercentOfficial"),
      promotionActive: form.get("promotionActive") === "on",
      availableCoupons: nullableNumber(form, "availableCoupons"),
      official: form.get("official") === "on",
    });
  }

  function togglePaymentMethod(price: AdminPrice, method: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...price.enabledPaymentMethods, method]))
      : price.enabledPaymentMethods.filter((item) => item !== method);
    updatePaymentMethods.mutate({ country: price.country, enabledPaymentMethods: next });
  }

  return <div className="admin-backdrop" role="presentation"><aside className="admin-panel" aria-label="Administración de precios y promoción">
    <header><div><p>Configuración persistente</p><h2>Administración</h2></div><button type="button" aria-label="Cerrar administración" onClick={onClose}>×</button></header>
    <div className="admin-tabs" role="tablist">
      <button type="button" role="tab" aria-selected={tab === "embudo"} className={tab === "embudo" ? "active" : ""} onClick={() => setTab("embudo")}>📊 Embudo</button>
      <button type="button" role="tab" aria-selected={tab === "precios"} className={tab === "precios" ? "active" : ""} onClick={() => setTab("precios")}>💰 Precios</button>
    </div>
    {tab === "embudo" ? <section className="funnel-section"><FunnelAnalytics /></section> : <>
    <section className="promo-control"><div><strong>Bonos especiales</strong><span>Mostrar solo en cierre con promoción activa</span></div><label className="switch"><input aria-label="Activar bonos especiales" type="checkbox" checked={data.specialBonusesActive} onChange={(event) => updatePromotion.mutate({ active: event.target.checked })} /><i /></label></section>
    <div className="admin-list">{activePrices.map((price) => <article key={price.country} className="price-editor">
      <form onSubmit={(event) => savePrice(event, price.country)}>
        <div className="price-country"><strong>{price.country}</strong><span>{price.currency}</span></div>
        <label>Moneda<input name="currency" aria-label={`Moneda para ${price.country}`} defaultValue={price.currency} /></label>
        <label>Precio normal (dato)<input name="regularPrice" aria-label={`Precio normal para ${price.country}`} defaultValue={price.regularPrice ?? ""} /></label>
        <label>Precio normal mostrado<input name="regularPriceDisplay" aria-label={`Precio normal mostrado para ${price.country}`} defaultValue={price.regularPriceDisplay ?? ""} placeholder="Sin precio anterior" /></label>
        <label>Precio promocional (dato)<input name="offerPrice" aria-label={`Precio promocional para ${price.country}`} defaultValue={price.offerPrice ?? ""} /></label>
        <label>Precio promocional mostrado<input name="offerPriceDisplay" aria-label={`Precio promocional mostrado para ${price.country}`} defaultValue={price.offerPriceDisplay} /></label>
        <label>Descuento oficial (%)<input name="discountPercentOfficial" aria-label={`Descuento oficial para ${price.country}`} type="number" min="0" max="100" defaultValue={price.discountPercentOfficial ?? ""} placeholder="Sin confirmar" /></label>
        <label>Cupones disponibles<input name="availableCoupons" aria-label={`Cupones disponibles para ${price.country}`} type="number" min="0" defaultValue={price.availableCoupons ?? ""} placeholder="Sin dato" /></label>
        <div className="admin-checks">
          <label className="official-check"><input name="promotionActive" type="checkbox" defaultChecked={price.promotionActive} />Promoción activa</label>
          <label className="official-check"><input name="official" type="checkbox" defaultChecked={price.official} />Precio oficial</label>
        </div>
        <button type="submit" disabled={updatePrice.isPending}>Guardar precio</button>
        {priceErrors[price.country] && <p className="inline-error admin-validation" role="alert">{priceErrors[price.country]}</p>}
      </form>
      <fieldset className="payment-editor"><legend>Medios habilitados para este checkout</legend>
        {price.supportedPaymentMethods.map((method) => <label key={method}><input type="checkbox" checked={price.enabledPaymentMethods.includes(method)} disabled={updatePaymentMethods.isPending} onChange={(event) => togglePaymentMethod(price, method, event.target.checked)} />{method}</label>)}
        {!price.supportedPaymentMethods.length && <p>Sin medios soportados configurados.</p>}
      </fieldset>
    </article>)}</div>
    {(updatePrice.isSuccess || updatePaymentMethods.isSuccess) && <p className="admin-status" role="status">Configuración guardada en la base de datos.</p>}
    </>}
  </aside></div>;
}
