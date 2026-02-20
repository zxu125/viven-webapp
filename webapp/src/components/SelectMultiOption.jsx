import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * SelectMultiOption (BottomSheet style)
 * - открывается как bottomsheet
 * - поиск
 * - мультивыбор (галочка на выбранных)
 *
 * props:
 *  open: boolean
 *  onClose: () => void
 *  title?: string
 *  options: Array<{ id: string|number, label: string, subLabel?: string }>
 *  value: Array<string|number>            // выбранные id
 *  onChange: (nextIds: Array<string|number>) => void
 *  placeholder?: string
 *  searchPlaceholder?: string
 *  showDone?: boolean
 */
export default function SelectMultiOption({
    open,
    onClose,
    title = "Выберите",
    options = [],
    value = [],
    onChange,
    placeholder = "Поиск...",
    searchPlaceholder = "Поиск...",
    showDone = true,
}) {
    const [q, setQ] = useState("");
    const listRef = useRef(null);

    useEffect(() => {
        if (!open) setQ("");
    }, [open]);

    const selectedSet = useMemo(() => new Set(value ?? []), [value]);

    const filtered = useMemo(() => {
        const s = (q || "").trim().toLowerCase();
        if (!s) return options;
        return (options || []).filter((o) => {
            const a = String(o.label ?? "").toLowerCase();
            const b = String(o.subLabel ?? "").toLowerCase();
            return a.includes(s) || b.includes(s);
        });
    }, [options, q]);

    const toggle = (id) => {
        const next = new Set(selectedSet);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onChange?.(Array.from(next));
    };

    const selectAll = () => onChange?.(options.map((o) => o.id));
    const clearAll = () => onChange?.([]);

    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
            }}
        >
            {/* backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,.35)",
                }}
            />

            {/* sheet */}
            <div
                className="bg-surface shadow"
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    maxHeight: "78vh",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    borderBottom: "none",
                }}
            >
                {/* handle */}
                <div style={{ paddingTop: 8 }}>
                    <div
                        style={{
                            width: 44,
                            height: 4,
                            borderRadius: 999,
                            background: "rgba(127,127,127,.35)",
                            margin: "0 auto",
                        }}
                    />
                </div>

                {/* header */}
                <div className="p-12 b-bottom">
                    <div className="row space-between g-12">
                        <div className="col" style={{ gap: 2, minWidth: 0 }}>
                            <div className="f-md f-bold text-primary">{title}</div>
                            <div className="f-xs text-muted">
                                Выбрано: <span className="f-bold text-primary">{value?.length || 0}</span>
                            </div>
                        </div>

                        <div className="row g-8">
                            <button className="btn btn-sm" onClick={clearAll}>
                                Сброс
                            </button>
                            <button className="btn btn-sm" onClick={selectAll}>
                                Все
                            </button>
                            {showDone ? (
                                <button className="btn btn-sm btn-primary" onClick={onClose}>
                                    Готово
                                </button>
                            ) : (
                                <button className="btn btn-sm btn-ghost" onClick={onClose}>
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* search */}
                    <div style={{ marginTop: 10 }}>
                        <input
                            className="input"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={searchPlaceholder || placeholder}
                            autoFocus
                        />
                    </div>
                </div>

                {/* list */}
                <div ref={listRef} style={{ overflow: "auto", maxHeight: "calc(78vh - 130px)" }}>
                    {filtered.length === 0 ? (
                        <div className="p-16 text-muted f-sm">Ничего не найдено</div>
                    ) : (
                        filtered.map((o) => {
                            const checked = selectedSet.has(o.id);
                            return (
                                <div
                                    key={String(o.id)}
                                    onClick={() => toggle(o.id)}
                                    className="row space-between p-12 b-bottom"
                                    style={{
                                        cursor: "pointer",
                                        background: checked ? "rgba(29,155,240,0.10)" : "transparent",
                                    }}
                                >
                                    <div className="col" style={{ gap: 2, minWidth: 0 }}>
                                        <div className="f-sm f-semibold text-primary" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {o.label}
                                        </div>
                                        {o.subLabel ? (
                                            <div className="f-xs text-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {o.subLabel}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* checkmark */}
                                    <div
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 8,
                                            border: `1px solid ${checked ? "rgba(29,155,240,.55)" : "var(--border)"}`,
                                            background: checked ? "rgba(29,155,240,.14)" : "transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 900,
                                            color: "var(--primary)",
                                            flexShrink: 0,
                                            marginLeft: 12,
                                        }}
                                        aria-hidden
                                    >
                                        {checked ? "✓" : ""}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* safe-area bottom */}
                <div style={{ height: 10 }} />
            </div>
        </div>
    );
}
