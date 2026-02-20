import React, { useMemo, useState } from "react";
import { BottomSheetSelect } from "./BottomSheetSelect";

/**
 * SelectField
 * props:
 *  label?: string
 *  value?: string|number|null
 *  options: Array<{ value, label, subtitle? }>
 *  onChange: (value, item) => void
 *  title?: string (заголовок модалки)
 *  placeholder?: string (на поле)
 *  searchable?: boolean
 *  disabled?: boolean
 *  error?: string
 */
export default function SelectField({
    label,
    value,
    options,
    onChange,
    title = "Выберите",
    placeholder = "Нажмите чтобы выбрать",
    searchable = true,
    disabled = false,
    error,
}) {
    const [open, setOpen] = useState(false);

    const selected = useMemo(
        () => options.find((o) => o.value === value) ?? null,
        [options, value]
    );

    return (
        <div style={{ width: "100%" }}>
            {label ? <div style={s.label}>{label}</div> : null}

            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(true)}
                class="input"
                style={{
                    // ...s.fieldBtn,
                    ...(disabled ? s.disabled : null),
                    ...(error ? s.errorBorder : null),
                    width: "100%",
                    minWidth: 200
                }}
            >
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ ...s.valueText, ...(selected ? null : s.placeholder) }}>
                        {selected ? selected.label : placeholder}
                    </div>
                    {selected?.subtitle ? (
                        <div style={s.subText}>{selected.subtitle}</div>
                    ) : null}
                </div>
                {/* <div style={s.chev}>▾</div> */}
            </button>

            {error ? <div style={s.errorText}>{error}</div> : null}

            <BottomSheetSelect
                open={open}
                onClose={() => setOpen(false)}
                title={title}
                options={options}
                maxHeight={400}
                value={value}
                onChange={onChange}
                searchable={searchable}
                placeholder="Поиск..."
            />
        </div>
    );
}

const s = {
    label: {
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 6,
        opacity: 0.85,
    },
    fieldBtn: {
        width: "100%",
        border: "1px solid rgba(0,0,0,0.14)",
        borderRadius: 14,
        padding: "12px 12px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        textAlign: "left",
    },
    valueText: {
        fontSize: 15,
        fontWeight: 700,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    placeholder: { opacity: 0.55, fontWeight: 600 },
    subText: { fontSize: 12, opacity: 0.7, marginTop: 2 },
    chev: { fontSize: 16, opacity: 0.65, flexShrink: 0 },
    disabled: { opacity: 0.6, cursor: "not-allowed" },
    errorBorder: { border: "1px solid rgba(255,0,0,0.45)" },
    errorText: { marginTop: 6, fontSize: 12, color: "#b00020" },
};
