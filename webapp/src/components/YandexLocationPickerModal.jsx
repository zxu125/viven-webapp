import React, { useEffect, useRef, useState } from "react";

export default function YandexPickerV3({ open, onClose, onPick, initialPoint = { lat: 41.311081, lon: 69.240562, zoom: 12 } }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [point, setPoint] = useState(initialPoint);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let cancelled = false;

    (async () => {
      try {
        const ymaps3 = window.ymaps3;
        if (!ymaps3) throw new Error("window.ymaps3 отсутствует");
        await ymaps3.ready;

        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (cancelled) return;

        const host = hostRef.current;
        host.innerHTML = "";

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener } = ymaps3;

        const map = new YMap(host, {
          location: { center: [point.lon, point.lat], zoom: point.zoom },
          mode: "vector",
        });

        map.addChild(new YMapDefaultSchemeLayer());
        map.addChild(new YMapDefaultFeaturesLayer());

        const makeDotEl = () => {
          const el = document.createElement("div");
          el.style.width = "18px";
          el.style.height = "18px";
          el.style.borderRadius = "999px";
          el.style.background = "#ff2d2d";
          el.style.border = "2px solid #fff";
          el.style.boxShadow = "0 4px 10px rgba(0,0,0,0.25)";
          el.style.transform = "translate(-50%, -100%)";
          return el;
        };

        const setMarker = (lon, lat) => {
          if (markerRef.current) {
            try { map.removeChild(markerRef.current); } catch { }
            markerRef.current = null;
          }
          const m = new YMapMarker({ coordinates: [lon, lat] }, makeDotEl());
          map.addChild(m);
          markerRef.current = m;
        };

        setMarker(point.lon, point.lat);

        const listener = new YMapListener({
          layer: "any",
          onClick: (layer, coordinates) => {
            if (!coordinates) return;
            const [lon, lat] = coordinates.coordinates;
            setMarker(lon, lat);
            setPoint((p) => ({ ...p, lat, lon }));
          },
        });

        map.addChild(listener);

        mapRef.current = map;
        map.updateSize?.();
      } catch (e) {
        console.error(e);
        setErr(e?.message || String(e));
      }
    })();

    return () => {
      cancelled = true;
      document.body.style.overflow = prev;
      try { mapRef.current?.destroy?.(); } catch { }
      mapRef.current = null;
      markerRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 9999, padding: 10 }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div style={{ width: "min(720px,100%)", background: "var(--surface)", borderRadius: 18, overflow: "hidden" }} onPointerDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 900, flex: 1 }}>Выберите точку</div>
          <button onClick={onClose} style={{ backgroundColor:'#0000', width: 36, height: 36, fontSize:18 }}>✕</button>
        </div>

        <div style={{ height: "55vh", background: "#f2f2f2", position: "relative" }}>
          <div ref={hostRef} style={{ width: "100%", height: "100%", touchAction: "none" }} />
          {err ? (
            <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, background: "rgba(0,0,0,0.65)", color: "#fff", padding: "8px 10px", borderRadius: 12, fontSize: 12 }}>
              {err}
            </div>
          ) : null}
        </div>

        <div style={{ padding: 12, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
            lat: <b>{point.lat.toFixed(6)}</b> · lon: <b>{point.lon.toFixed(6)}</b>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", fontWeight: 900 }}>
              Отмена
            </button>
            <button
              onClick={() => {
                onPick?.({ lat: point.lat, lon: point.lon });
                onClose?.();
              }}
              style={{ padding: "10px 14px", borderRadius: 12, border: "none", background: "rgba(0,122,255,0.18)", fontWeight: 900 }}
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}