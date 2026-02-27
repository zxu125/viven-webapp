export function callPhone(phone) {
    const clean = String(phone || "").replace(/[^\d+]/g, "");
    if (!clean) return;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent
    );

    const telUrl = `tel:${clean}`;
    if (isMobile) {
        // В Telegram WebApp лучше через openLink
        if (window.Telegram?.WebApp?.openLink) {
            try {
                window.Telegram.WebApp.openLink(telUrl);
            } catch (e) {
                navigator.clipboard.writeText(clean)

                alert(`Номер скопирован: ${clean}`);
            }
        } else {
            // window.location.href = telUrl;
        }
    } else {
        // Десктоп — можно заменить на модалку
        alert("Невозможно совершить звоног");
    }

}

export function toDatetimeLocal(isoUtc) {
    const d = new Date(isoUtc);
    const pad = (n) => String(n).padStart(2, "0");
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
}

export function toDateInputValue(date) {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDatetimeLocal(localValue) {
    const d = new Date(localValue);
    return d.toISOString();
}

export function openTelegramByPhone(phone) {
    const clean = String(phone || "").replace(/[^\d]/g, "");
    if (!clean) return;

    const url = `https://t.me/+${clean}`;

    // если есть Telegram WebApp API
    if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(url);
        return;
    }

    const w = window.open(url, "_blank");
    if (!w) window.location.href = url;
}


export function parseGeoCoords(input) {
    if (typeof input !== "string") return null;

    // Нормализуем: убираем NBSP и лишние пробелы
    const s = input.replace(/\u00A0/g, " ").trim();

    // --- Формат A: есть направления (С/Ю/В/З или N/S/E/W) ---
    // Пример: "41,41321° С, 69,19317° В"
    const dirRegex = /(\d+(?:[.,]\d+)?)\s*°?\s*([СЮВЗNSEW])/gi;
    const dirMatches = [...s.matchAll(dirRegex)];
    if (dirMatches.length >= 2) {
        const toNum = (numStr) => parseFloat(numStr.replace(",", "."));

        const applySign = (num, dir) => {
            const d = dir.toUpperCase();
            return (d === "Ю" || d === "S" || d === "З" || d === "W") ? -num : num;
        };

        const latRaw = toNum(dirMatches[0][1]);
        const latDir = dirMatches[0][2];
        const lonRaw = toNum(dirMatches[1][1]);
        const lonDir = dirMatches[1][2];

        const latitude = applySign(latRaw, latDir);
        const longitude = applySign(lonRaw, lonDir);

        return (Number.isFinite(latitude) && Number.isFinite(longitude)) ? { latitude, longitude } : null;
    }

    // --- Формат B: просто две десятичные координаты ---
    // Пример: "41.422715, 69.165293" или "41.422715 69.165293"
    // Разрешаем и запятые как разделитель между числами, и пробелы
    const simpleRegex = /^\s*([+-]?\d+(?:\.\d+)?)\s*[,\s]\s*([+-]?\d+(?:\.\d+)?)\s*$/;
    const m = s.match(simpleRegex);
    if (m) {
        const latitude = parseFloat(m[1]);
        const longitude = parseFloat(m[2]);
        return (Number.isFinite(latitude) && Number.isFinite(longitude)) ? { latitude, longitude } : null;
    }

    return null;
}

export function openYandexRoute(points, mode = "auto") {
    if (!Array.isArray(points) || points.length < 2) return;

    // WEB: rtext = "lat,lon~lat,lon~lat,lon..."
    const rtext = points.map(p => `${p.lat},${p.lon}`).join("~");
    const webUrl = `https://yandex.ru/maps/?rtext=${encodeURIComponent(rtext)}&rtt=${encodeURIComponent(mode)}`;

    // APP (Яндекс.Карты): иногда работает, иногда нет (особенно внутри Telegram на iOS)
    const appUrlMaps = `yandexmaps://maps.yandex.ru/?rtext=${encodeURIComponent(rtext)}&rtt=${encodeURIComponent(mode)}`;

    // APP (Яндекс.Навигатор): хорошо подходит для маршрутов и поддерживает via-точки параметрами
    // Формируем build_route_on_map с промежуточными точками (via)
    const from = points[0];
    const to = points[points.length - 1];
    const vias = points.slice(1, -1);

    const viaParams = vias
        .map((p, i) => `lat_via_${i}=${encodeURIComponent(p.lat)}&lon_via_${i}=${encodeURIComponent(p.lon)}`)
        .join("&");

    const appUrlNavi =
        `yandexnavi://build_route_on_map?lat_from=${encodeURIComponent(from.lat)}&lon_from=${encodeURIComponent(from.lon)}` +
        `&lat_to=${encodeURIComponent(to.lat)}&lon_to=${encodeURIComponent(to.lon)}` +
        (viaParams ? `&${viaParams}` : "");

    // В Telegram WebApp deep-link схемы часто блокируются через openLink,
    // поэтому пробуем scheme через location.href, а потом падаем на web.
    const tg = window.Telegram?.WebApp;

    const openWeb = () => {
        if (tg?.openLink) tg.openLink(webUrl);
        else window.open(webUrl, "_blank");
    };

    // 1) пробуем Яндекс.Карты
    window.location.href = appUrlMaps;

    // 2) если не открылось — пробуем Навигатор, потом web
    setTimeout(() => {
        // попытка №2 (Навигатор)
        window.location.href = appUrlNavi;

        // 3) финальный fallback на web
        setTimeout(openWeb, 700);
    }, 700);
}
