import React, { useEffect, useMemo, useRef, useState } from "react";

export function BottomSheetSelect({
  open,
  onClose,
  title = "Выберите",
  options = [],
  value = null,
  onChange,
  placeholder = "Поиск...",
  searchable = true,
  maxHeight,
}) {
  const [q, setQ] = useState("");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setDragY(0);
    setDragging(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => {
      const t = `${o.label ?? ""} ${o.subtitle ?? ""}`.toLowerCase();
      return t.includes(s);
    });
  }, [q, options]);

  const sheetMaxH = maxHeight ?? Math.min(window.innerHeight * 0.82, 560);

  const closeIfBackdrop = (e) => {
    if (e.target?.dataset?.backdrop === "1") onClose?.();
  };

  const onPick = (item) => {
    onChange?.(item.value, item);
    onClose?.();
  };

  // drag-to-close (тянем за “ручку”)
  const onTouchStart = (e) => {
    setDragging(true);
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY.current;
    setDragY(dy > 0 ? dy : 0);
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (dragY > 120) onClose?.();
    else setDragY(0);
  };

  if (!open) return null;

  return (
    <div
      data-backdrop="1"
      onMouseDown={closeIfBackdrop}
      onTouchStart={closeIfBackdrop}
      style={styles.backdrop}
    >
      <div
        style={{
          ...styles.sheet,
          maxHeight: sheetMaxH,
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 180ms ease",
          backgroundColor: "var(--surface)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div
          style={styles.handleWrap}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div style={styles.handle} />
        </div>

        <div style={styles.header}>
          <div style={styles.title}>{title}</div>
          <div style={styles.closeBtn} onClick={onClose} aria-label="close">
            ✕
          </div>
        </div>

        {searchable && (
          <div style={styles.searchWrap}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              style={styles.search}
              autoFocus
            />
          </div>
        )}

        <div style={styles.list}>
          {filtered.length === 0 ? (
            <div style={styles.empty}>Ничего не найдено</div>
          ) : (
            filtered.map((item) => {
              const active = item.value === value;
              return (
                <button
                  key={String(item.value)}
                  style={{ ...styles.row, ...(active ? styles.rowActive : null) }}
                  onClick={() => onPick(item)}
                >
                  <div style={styles.rowText}>
                    <div style={styles.rowLabel}>{item.label}</div>
                    {item.subtitle ? (
                      <div style={styles.rowSub}>{item.subtitle}</div>
                    ) : null}
                  </div>
                  {active ? <div style={styles.check}>✓</div> : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 99999,
    padding: 10,
    WebkitTapHighlightColor: "transparent",
  },
  sheet: {
    width: "min(560px, 100%)",
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  handleWrap: {
    paddingTop: 10,
    paddingBottom: 6,
    display: "flex",
    justifyContent: "center",
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    background: "rgba(0,0,0,0.18)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },
  title: { fontSize: 16, fontWeight: 700, flex: 1 },
  closeBtn: {
    border: "none",
    background: "rgba(0,0,0,0.0)",
    borderRadius: 10,
    width: 36,
    height: 32,
    cursor: "pointer",
    fontSize: 26,
  },
  searchWrap: { padding: 12 },
  search: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    outline: "none",
    fontSize: 14,
  },
  list: {
    maxHeight: 420,
    overflow: "auto",
    WebkitOverflowScrolling: "touch",
    paddingBottom: 10,
  },
  row: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  rowActive: { background: "rgba(0, 122, 255, 0.08)" },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 15, fontWeight: 600 },
  rowSub: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  check: { fontSize: 18, fontWeight: 800 },
  empty: { padding: 18, textAlign: "center", opacity: 0.7 },
};
