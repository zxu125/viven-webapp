import React, { useEffect, useRef } from "react";
import BottomSheet from "../components/BottomSheet";
import { useQuery } from "@tanstack/react-query";
import { api } from "../app/api";
import { ClientSheetContent } from "../components/ClientSheetContent";
import { Filter, Navigation, Pencil, Phone, Route, Send } from "lucide-react";
import { nav } from "../app/router";
import { callPhone, openTelegramByPhone, openYandexRoute, toDateInputValue } from "../app/functions";
import useTelegramTheme from "../hooks/useTelegramTheme";
import SelectMultiOption from "../components/SelectMultiOption";

export function Map() {
    const [regions, setRegions] = React.useState(null);

    const containerRef = useRef(null);
    const [regionSelectOpen, setRegionSelectOpen] = React.useState(false);
    const [filters, setFilters] = React.useState({
        // beginDate: toDateInputValue(new Date()),
        endDate: toDateInputValue(new Date()),
        statusId: 5,

    })
    const [navig, setNavig] = React.useState({
        active: false,
        points: []
    })
    const [showMapButtons, setShowMapButtons] = React.useState(true);
    const mapRef = useRef(null);
    const markersRef = useRef([]); // храним созданные маркеры
    const { data } = useQuery({
        queryKey: ["map"],
        queryFn: () => api.get('/map/all').then(res => res.data),
    });
    const [filteredData, setFilteredData] = React.useState([])
    const [points, setPoints] = React.useState([]);
    const [filterOpen, setFilterOpen] = React.useState(false);

    function handleNavig() {
        setNavig({ active: false });
        setShowMapButtons(true);
        try {
            markersRef.current.forEach(p => p.el.style.transform = 'scale(1)');
        } catch (e) {
            alert('Ошибка при построении маршрута' + (e.message || JSON.stringify(e)))
        }
        openYandexRoute(navig.points.map(p => ({ lat: p.location.latitude, lon: p.location.longitude })), "auto");
    }

    useEffect(() => {
        data && applyFilters(filters);
        setSelectedPoint(null);
    }, [data]);
    useEffect(() => {
        setPoints(filteredData?.map(p => ({
            name: (p.client.name + '').slice(0, 3),
            coords: [p.location.longitude, p.location.latitude],
            ...p
        })) || []);
    }, [filteredData]);

    useEffect(() => {
        async function _() {
            try {
                let r = await api.get("/region/list")
                setRegions(r.data);
            } catch (e) {
                alert(JSON.stringify(e))
            }
        }
        _()
    }, []);

    const [selectedPoint, setSelectedPoint] = React.useState(null);
    function handlePointClick(e) {
        if (navig.active) {
            let points = navig.points;
            if (points.find(p => p.id == e.id)) points = points.filter(p => p.id != e.id);
            else points.push(e)
            setNavig(n => ({ ...n, points }))
        } else {
            setSelectedPoint(e);
        }
    }
    function applyFilters(filters) {
        setFilteredData(data.filter(e => {
            if (filters.statusId && (!e.order || filters.statusId != e.order.statusId)) return false;
            if (filters.noOrder && e.order) return false;
            if (filters.regions?.length && !filters.regions.map(r => r.id).includes(e.client.region?.id)) return false;
            if (filters.beginDate && (!e.order || new Date(filters.beginDate) > new Date(e.order?.deliveryDate))) return false;
            if (filters.endDate && (!e.order || new Date(new Date(filters.endDate).getTime() + 3600 * 24 * 1000) < new Date(e.order?.deliveryDate))) return false;
            return true
        }))
    }
    // ✅ 1) Создаём карту один раз
    useEffect(() => {
        let cancelled = false;

        (async () => {
            await window.ymaps3?.ready;
            if (cancelled) return;

            if (!containerRef.current) return;
            if (mapRef.current) return; // ✅ защита

            const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3;

            const tg = window.Telegram?.WebApp;
            if (!tg) return;

            tg.ready();

            mapRef.current = new YMap(containerRef.current, {
                location: { center: [69.2401, 41.2995], zoom: 11 },
                theme: tg.colorScheme || "light",
            });

            mapRef.current.addChild(new YMapDefaultSchemeLayer());
            mapRef.current.addChild(new YMapDefaultFeaturesLayer());
        })();

        return () => {
            cancelled = true;
            // при желании: containerRef.current.innerHTML = "";
            mapRef.current = null;
            markersRef.current = [];
        };
    }, []);

    // ✅ 2) Обновляем маркеры только когда меняются points
    useEffect(() => {
        try {
            const map = mapRef.current;
            if (!map) return;
            if (!window.ymaps3) return;

            const { YMapMarker } = window.ymaps3;

            // удалить старые маркеры
            markersRef.current.forEach((m) => map.removeChild(m.m));
            markersRef.current = [];

            // добавить новые
            function createMaskedMarkerEl({ label = "Z01", color = "#43d7ff" } = {}) {
                const root = document.createElement("div");
                const size = 44;
                root.style.width = size + "px";
                root.style.height = size + "px";
                root.style.top = size * -1 + "px"; // смещаем вверх на половину размера
                root.style.left = size / 2 * -1 + "px"; // смещаем влево на половину размера
                root.style.position = "relative";
                root.style.cursor = "pointer";
                root.className = ".map-marker"
                // root.style.backgroundColor = "red";

                const icon = document.createElement("div");
                icon.style.width = "44px";
                icon.style.height = "44px";
                icon.style.backgroundColor = color;

                const url = "/src/assets/map-marker.png";

                // стандарт
                icon.style.mask = `url(${url}) no-repeat center`;
                icon.style.maskSize = "contain";

                // safari
                icon.style.setProperty("-webkit-mask", `url(${url}) no-repeat center`);
                icon.style.setProperty("-webkit-mask-size", "contain");

                const text = document.createElement("div");
                text.textContent = label;
                text.style.position = "absolute";
                text.style.top = "50%";
                text.style.left = "50%";
                text.style.transform = "translate(-50%, -60%)";
                text.style.fontSize = "12px";
                text.style.fontWeight = "700";
                text.style.color = "#fff";
                text.style.pointerEvents = "none";

                root.appendChild(icon);
                root.appendChild(text);

                return root;
            }


            // usage
            const newMarkers = points.map((p) => {
                const el = createMaskedMarkerEl({
                    label: p.name ?? "Z01",
                    color: "#43d7ff",
                });
                el.addEventListener("click", function (e) {
                    e.stopPropagation();
                    const point = p; // твой объект точки, который ты пушишь/фильтруешь
                    setNavig(prev => {
                        if (!prev.active) {
                            setSelectedPoint(point)
                            return prev
                        }; // или можно тут setSelectedPoint, но лучше вне

                        const exists = prev.points.some(p => p.client?.id == point.client?.id);
                        if (exists) el.style.transform = 'scale(1)';
                        else el.style.transform = 'scale(1.3)';
                        const points = exists
                            ? prev.points.filter(p => p.client?.id != point.client?.id)
                            : [...prev.points, point];

                        return { ...prev, points };
                    });
                });
                let m = new YMapMarker({ coordinates: p.coords }, el);
                return { m, el };
            });


            newMarkers.forEach((m) => map.addChild(m.m));
            markersRef.current = newMarkers;
        } catch (e) {

        }
    }, [points]);

    return <div>
        <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />
        <BottomSheet
            isOpen={selectedPoint}
            // closeOnBackdrop={true}
            onClose={() => setSelectedPoint(null)}
            height="60vh">
            {selectedPoint &&
                <div style={{ paddingLeft: 16, paddingRight: 16, height: '50vh', position: 'relative' }}>
                    <div className="row space-between" style={{ gap: 10 }}>
                        <div className="col w-full" style={{ gap: 4, minWidth: 0, width: '100%' }}>
                            <div className="f-xl f-bold text-primary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {selectedPoint?.name}
                            </div>

                            <div className="f-sm text-secondary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {selectedPoint?.address}
                            </div>

                            <div className="row space-between w-full">
                                <div className="row g-8" style={{ marginTop: 6, flexWrap: "wrap", justifyContent: 'space-between' }}>
                                    <span className="badge badge-brand">
                                        {selectedPoint?.client?.phone}
                                    </span>
                                </div>
                                <div class="row g-8">
                                    <button className="btn btn-sm"
                                        onClick={() => {
                                            callPhone(selectedPoint?.client?.phone);
                                        }}
                                    // href={"tel:" + selectedPoint?.client?.phone}
                                    >
                                        <Phone size={16} />
                                    </button>
                                    <button className="btn btn-sm" onClick={() => {
                                        openTelegramByPhone(selectedPoint?.client?.phone);
                                    }}>
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                            {selectedPoint?.client?.phone2 &&
                                <div className="row space-between w-full">
                                    <div className="row g-8" style={{ marginTop: 6, flexWrap: "wrap", justifyContent: 'space-between' }}>
                                        <span className="badge badge-brand">
                                            {selectedPoint?.client?.phone2}
                                        </span>
                                    </div>
                                    <div class="row g-8">
                                        <button className="btn btn-sm" onClick={() => {
                                            callPhone(selectedPoint?.client?.phone);
                                        }}>
                                            <Phone size={16} />
                                        </button>
                                        <button className="btn btn-sm" onClick={() => {
                                            openTelegramByPhone(selectedPoint?.client?.phone);
                                        }}>
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            }
                        </div>

                    </div>

                    {/* stock */}
                    <div className="b-top row space-between" style={{ marginTop: 12, paddingTop: 12 }}>
                        <div className="row g-12">
                            <div className="col" style={{ gap: 2 }}>
                                <div className="f-xs text-muted">Остаток</div>
                                <div className="f-lg f-bold text-success">{selectedPoint.quantity}</div>
                            </div>

                            {/* <div className="col" style={{ gap: 2 }}>
                                <div className="f-xs text-muted">Запрошено</div>
                                <div className="f-lg f-bold text-warning">{selectedPoint.order?.totalAmount||'-'}</div>
                            </div> */}
                        </div>

                        {/* маленькая кнопка открыть детали/редакт */}
                        <button className="btn btn-sm" onClick={() => nav('/client/view', { query: { clientId: selectedPoint.client.id } })}>
                            <Pencil />
                        </button>
                    </div>

                    {selectedPoint.order &&
                        <div className="b-top" style={{ marginTop: 12, paddingTop: 12 }}>
                            <div className="row space-between">
                                <div className="row g-8" style={{ flexWrap: "wrap" }}>
                                    <span className="badge badge-warning">{selectedPoint.order.status.ru}</span>
                                    <span className="badge">{new Date(selectedPoint.order.orderDate).toLocaleDateString()}</span>
                                </div>

                                <div className="f-sm f-bold text-primary">{selectedPoint.order.price} сум</div>
                            </div>

                            <div className="f-xs text-muted" style={{ marginTop: 6 }}>
                                {selectedPoint.order.totalAmount} × 19L
                            </div>
                        </div>}

                    {/* ACTIONS bottom */}
                    <div
                        className="b-top"
                        style={{
                            background: "var(--surface)",
                            paddingTop: 10,
                            // position: "absolute",
                            // bottom: 64,
                            width: "100%",
                            paddingBottom: 10,
                            marginLeft: 'auto',
                            marginRight: 'auto',
                        }}
                    >
                        <div className="row g-8">

                            <button className="btn btn-primary f-sm" style={{ flex: 3 }} onClick={() => {
                                if (selectedPoint.order) {
                                    nav('/order/view', { query: { orderId: selectedPoint.order.id } })
                                } else {
                                    nav('/order/create', { query: { clientId: selectedPoint.client.id } })
                                }
                            }}>
                                Заказ
                            </button>

                            {/* показывай только если есть активный заказ */}
                            {selectedPoint.order && <><button
                                className="btn f-sm"
                                style={{
                                    flex: 3,
                                    background: "var(--success)",
                                    borderColor: "transparent",
                                    color: "#fff",
                                }}
                                onClick={() => { nav('/order/confirm', { query: { orderId: selectedPoint.order.id, confirm: true } }) }}
                            >
                                Подтвердить
                            </button>
                                <button
                                    className="btn f-sm"
                                    style={{
                                        flex: 3,
                                        background: "var(--danger)",
                                        borderColor: "transparent",
                                        color: "#fff",
                                    }}
                                    onClick={() => { nav('/order/confirm', { query: { orderId: selectedPoint.order.id, confirm: false } }) }}
                                >
                                    Отменить
                                </button></>}
                        </div>
                    </div>
                </div>}
        </BottomSheet>
        <BottomSheet
            isOpen={filterOpen}
            closeOnBackdrop={true}
            onClose={() => setFilterOpen(false)}
            height="70vh"
        >
            <div style={{ paddingLeft: 16, paddingRight: 16, height: 300, position: 'relative' }}>
                <div className="row space-between" style={{ gap: 10 }}>
                    <div className="col w-full" style={{ gap: 4, minWidth: 0, width: '100%', overflow: 'visible' }}>
                        <div className="f-lg text-primary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Статус
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                overflowX: "auto",
                                padding: "4px 4px",
                                // backgroundColor: "red",
                                whiteSpace: "nowrap",
                                width: 'calc(100% + 35px)'
                            }}
                            class="no-thumb"
                        >
                            <div
                                style={{
                                    flex: "0 0 auto",
                                    padding: "6px 16px",
                                    borderRadius: 20,
                                    boxShadow: "0px 1px 4px 0px var(--surface-2)"
                                }}
                                className={!filters.statusId && !filters.noOrder ? 'bg-brand' : 'bg-surface'}
                                onClick={() => setFilters((f) => ({ ...f, statusId: null, noOrder: null }))}
                            >
                                Все
                            </div>
                            <div
                                style={{
                                    flex: "0 0 auto",
                                    padding: "6px 16px",
                                    borderRadius: 20,
                                    boxShadow: "0px 1px 4px 0px var(--surface-2)"
                                }}
                                className={filters.statusId == 5 ? 'bg-brand' : 'bg-surface'}
                                onClick={() => setFilters((f) => ({ ...f, statusId: 5 }))}
                            >
                                Новый
                            </div>

                            <div
                                style={{
                                    flex: "0 0 auto",
                                    padding: "6px 16px",
                                    borderRadius: 20,
                                    boxShadow: "0px 1px 4px 0px var(--surface-2)"
                                }}
                                className={filters.statusId == 3 ? 'bg-brand' : 'bg-surface'}
                                onClick={() => setFilters((f) => ({ ...f, statusId: 3 }))}
                            >
                                В пути
                            </div>
                            <div
                                style={{
                                    flex: "0 0 auto",
                                    padding: "6px 16px",
                                    borderRadius: 20,
                                    boxShadow: "0px 1px 4px 0px var(--surface-2)",
                                    marginRight: 20
                                }}
                                className={filters.noOrder ? 'bg-brand' : 'bg-surface'}
                                onClick={() => setFilters((f) => ({ ...f, statusId: null, noOrder: true }))}
                            >
                                Без заказа
                            </div>
                        </div>
                        <div className="f-lg text-primary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Дата заказа
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">От</div>
                                <input class="input" type="date" value={filters.beginDate} onChange={(e) => setFilters(f => ({ ...f, beginDate: e.target.value }))} />
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">До</div>
                                <input class="input" value={filters.endDate} type="date" onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ width: '100%' }}>
                            <div class="f-sm text-secondary">Регионы</div>
                            <div class="" style={{ marginTop: 6, width: '100%' }}>
                                {filters.regions?.map(r => (
                                    <span class="badge badge-secondary" style={{ margin: 2 }}>
                                        {r.name}
                                    </span>
                                ))}
                                <button class="btn btn-sm" onClick={() => setRegionSelectOpen(true)}>
                                    Изменить
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginTop: 40 }}>
                            <button class="btn btn-primary" style={{ flex: 1 }} onClick={() => { applyFilters(filters); setFilterOpen(false) }}>Применить</button>
                            <button class="btn btn-primary" style={{ flex: 1 }} onClick={() => { setFilters({}); applyFilters({}); setFilterOpen(false) }}>Сбросить</button>
                        </div>
                    </div>
                </div>
            </div>
        </BottomSheet >
        {showMapButtons && <div style={{
            position: 'fixed',
            display: 'flex',
            gap: 7,
            flexDirection: 'column',
            right: 10,
            top: 90,
        }}>
            <button style={{
                borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                // width: 50, height: 50
                padding: 10,
                boxShadow: '0px 1px 2px var(--surface-2)'
            }}
                onClick={() => setFilterOpen(true)}>
                <Filter size={22} color="var(--primary-2)" />
            </button>
            <button style={{
                borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                // width: 50, height: 50
                padding: 10,
                boxShadow: '0px 1px 4px var(--surface-2)'
            }}>
                <Navigation size={22} color="var(--primary-2)" onClick={() => { setShowMapButtons(false); setSelectedPoint(null); setNavig({ active: true, points: [] }) }} />
            </button>
        </div>}
        {navig.active && <div style={{
            position: 'fixed',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            right: 10,
            left: 10,
            top: 10,
        }}>
            <div style={{
                padding: 5,
                borderRadius: 12,
                backgroundColor: 'var(--surface)',
                flex: 1,
                boxShadow: '0px 1px 4px 0px var(--surface-2)'
            }}
                onClick={() => {
                    setShowMapButtons(true);
                    setNavig({ active: false });
                    markersRef.current.forEach(p => p.el.style.transform = 'scale(1)');
                }}>Отмена</div>
            <div style={{
                padding: 8,
                borderRadius: 12,
                backgroundColor: 'var(--surface)',
                flex: 3,
                boxShadow: '0px 1px 4px 0px var(--surface-2)'
            }}>Выбрано: {navig.points.length}</div>
            <div style={{
                padding: 5,
                borderRadius: 12,
                backgroundColor: 'var(--surface)',
                flex: 1,
                boxShadow: '0px 1px 4px 0px var(--surface-2)'
            }}
                onClick={() => {
                    handleNavig()
                }}>Готово</div>
        </div>
        }
        <SelectMultiOption
            open={regionSelectOpen}
            onClose={() => setRegionSelectOpen(false)}
            title="Выберите регионы"
            value={filters.regions?.map(r => r.id) || []}
            options={regions?.map(r => ({ label: r.name, id: r.id })) || []}
            onChange={(v) => {
                let selectedRegions = regions.filter(r => v.includes(r.id));
                setFilters(f => ({
                    ...f,
                    regions: selectedRegions,
                }))
            }}
        />
    </div >;
}
