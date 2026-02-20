import React, { useEffect, useRef, useState } from "react";

export default function YandexSimpleLocationPickerModalV3({
  open,
  onClose,
  title = "Выберите точку",
  initialCenter = { lat: 41.311081, lon: 69.240562, zoom: 12 },
  initialValue, // optional: {lat, lon}
  onPick, // ({lat, lon}) => void
  height = "55vh", // высота карты в модалке
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [point, setPoint] = useState(() => ({
    lat: initialValue?.lat ?? initialCenter.lat,
    lon: initialValue?.lon ?? initialCenter.lon,
    zoom: initialCenter.zoom ?? 12,
  }));

  // чтобы при повторном открытии брать актуальный initialValue
  useEffect(() => {
    if (!open) return;
    setPoint({
      lat: initialValue?.lat ?? initialCenter.lat,
      lon: initialValue?.lon ?? initialCenter.lon,
      zoom: initialCenter.zoom ?? 12,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let cancelled = false;

    (async () => {
      const ymaps3 = window.ymaps3;
      if (!ymaps3) {
        console.error("window.ymaps3 не найден. v3 скрипт не доступен на этой странице?");
        return;
      }
      await ymaps3.ready;

      // ждём 2 кадра, чтобы модалка получила реальные размеры
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;

      const host = hostRef.current;
      if (!host) return;

      host.innerHTML = "";

      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3;

      // marker: сначала пробуем DefaultMarker, иначе fallback через YMapMarker
      let DefaultMarker = null;
      try {
        const mod = await ymaps3.import("@yandex/ymaps3-default-ui-theme");
        DefaultMarker = mod.YMapDefaultMarker;
      } catch {
        DefaultMarker = null;
      }

      const map = new YMap(host, {
        location: { center: [point.lon, point.lat], zoom: point.zoom }, // [lon,lat]
        mode: "vector",
      });

      map.addChild(new YMapDefaultSchemeLayer());
      map.addChild(new YMapDefaultFeaturesLayer());

      let marker;
      if (DefaultMarker) {
        marker = new DefaultMarker({ coordinates: [point.lon, point.lat] });
        map.addChild(marker);
      } else {
        const { YMapMarker } = ymaps3;
        const el = document.createElement("div");
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.borderRadius = "999px";
        el.style.background = "#ff2d2d";
        el.style.border = "2px solid #fff";
        el.style.boxShadow = "0 4px 10px rgba(0,0,0,0.25)";
        marker = new YMapMarker({ coordinates: [point.lon, point.lat] }, el);
        map.addChild(marker);
      }

      // click -> выбрать точку
      map.events.add("click", (e) => {
        const c = e?.coordinates; // [lon,lat]
        if (!c || c.length < 2) return;
        const [lon, lat] = c;

        // обновляем marker без пересоздания карты
        if (marker?.setProps) marker.setProps({ coordinates: [lon, lat] });
        setPoint((p) => ({ ...p, lat, lon }));
      });

      mapRef.current = map;
      markerRef.current = marker;

      // на всякий
      map.updateSize?.();
    })();

    return () => {
      cancelled = true;
      document.body.style.overflow = prevOverflow;

      try {
        mapRef.current?.destroy?.();
      } catch {}
      mapRef.current = null;
      markerRef.current = null;

      if (hostRef.current) hostRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const closeIfBackdrop = (e) => {
    if (e.target?.dataset?.backdrop === "1") onClose?.();
  };

  if (!open) return null;

  return (
    <div data-backdrop="1" style={st.backdrop} onMouseDown={closeIfBackdrop} onTouchStart={closeIfBackdrop}>
      <div style={st.sheet} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
        <div style={st.header}>
          <div style={st.title}>{title}</div>
          <button style={st.iconBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ ...st.mapBox, height }}>
          <div ref={hostRef} style={{ width: "100%", height: "100%" }} />
        </div>

        <div style={st.footer}>
          <div style={st.coords}>
            lat: <b>{point.lat.toFixed(6)}</b> · lon: <b>{point.lon.toFixed(6)}</b>
          </div>

          <div style={st.actions}>
            <button style={st.secondary} onClick={onClose}>Отмена</button>
            <button
              style={st.primary}
              onClick={() => {
                onPick?.({ lat: point.lat, lon: point.lon });
                onClose?.();
              }}
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const st = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 9999,
    padding: 10,
    WebkitTapHighlightColor: "transparent",
  },
  sheet: {
    width: "min(720px, 100%)",
    background: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },
  title: { fontSize: 16, fontWeight: 900, flex: 1 },
  iconBtn: {
    border: "none",
    background: "rgba(0,0,0,0.06)",
    borderRadius: 10,
    width: 36,
    height: 32,
    cursor: "pointer",
    fontSize: 16,
  },
  mapBox: { background: "#f2f2f2" },
  footer: { padding: 12, borderTop: "1px solid rgba(0,0,0,0.08)" },
  coords: { fontSize: 13, opacity: 0.85, marginBottom: 10 },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end" },
  secondary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },
  primary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "none",
    background: "rgba(0, 122, 255, 0.18)",
    cursor: "pointer",
    fontWeight: 900,
  },
};
