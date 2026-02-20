function Chip({ text, bg = "rgba(0,0,0,.08)" }) {
    return (
        <span
            style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: bg,
                fontSize: 12,
                fontWeight: 700,
            }}
        >
            {text}
        </span>
    );
}

function Section({ title, children }) {
    return (
        <div style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.65, marginBottom: 8 }}>
                {title}
            </div>
            <div
                style={{
                    border: "1px solid rgba(0,0,0,.06)",
                    borderRadius: 14,
                    padding: 12,
                    background: "rgba(0,0,0,.02)",
                }}
            >
                {children}
            </div>
        </div>
    );
}

function Row({ left, right }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0" }}>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{left}</div>
            <div style={{ fontSize: 13, fontWeight: 800, textAlign: "right" }}>{right}</div>
        </div>
    );
}

function PrimaryButton({ text, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                flex: 1,
                height: 44,
                borderRadius: 14,
                border: "none",
                fontWeight: 900,
                fontSize: 14,
                background: disabled
                    ? "rgba(0,0,0,.12)"
                    : "var(--tg-theme-button-color, #2AABEE)",
                color: disabled ? "rgba(0,0,0,.45)" : "var(--tg-theme-button-text-color, #fff)",
            }}
        >
            {text}
        </button>
    );
}

function GhostButton({ text, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,.10)",
                fontWeight: 900,
                fontSize: 14,
                background: "transparent",
                color: "var(--tg-theme-text-color, #111)",
            }}
        >
            {text}
        </button>
    );
}

export function ClientSheetContent({
    client,
    stock,
    activeOrder,
    onCall,
    onCreateOrder,
    onConfirmOrder,
}) {
    const hasActive = !!activeOrder;

    return (
        <div>
            {/* quick summary */}
            <div style={{ padding: "12px 14px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip text={client.phone ?? "Без номера"} bg="rgba(42,171,238,.12)" />
                <Chip text={`Тара: ${stock?.empty ?? 0} пуст / ${stock?.full ?? 0} полн`} />
                {hasActive ? <Chip text={`Есть заказ #${activeOrder.code}`} bg="rgba(255, 193, 7, .22)" /> : <Chip text="Заказов нет" />}
            </div>

            <Section title="Контакты">
                <Row left="Телефон" right={client.phone || "—"} />
                <Row left="Имя" right={client.name || "—"} />
            </Section>

            <Section title="Остаток бутылей">
                <Row left="Полные" right={stock?.full ?? 0} />
                <Row left="Пустые" right={stock?.empty ?? 0} />
                <Row left="Долг/баланс" right={stock?.debt ?? 0} />
            </Section>

            <Section title="Адрес">
                <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>
                    {client.address || "—"}
                </div>
                {client.comment ? (
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                        {client.comment}
                    </div>
                ) : null}
            </Section>

            {hasActive ? (
                <Section title="Активный заказ">
                    <Row left="Статус" right={activeOrder.statusRu} />
                    <Row left="Кол-во" right={activeOrder.count} />
                    <Row left="Сумма" right={activeOrder.total} />
                </Section>
            ) : null}

            {/* sticky actions */}
            <div
                style={{
                    position: "sticky",
                    bottom: 0,
                    padding: 14,
                    background: "var(--tg-theme-bg-color, #fff)",
                    borderTop: "1px solid rgba(0,0,0,.06)",
                    display: "flex",
                    gap: 10,
                }}
            >
                <GhostButton text="Позвонить" onClick={onCall} />
                <PrimaryButton text="Создать заказ" onClick={onCreateOrder} />
                <PrimaryButton
                    text="Подтвердить"
                    onClick={onConfirmOrder}
                    disabled={!hasActive}
                />
            </div>
        </div>
    );
}
