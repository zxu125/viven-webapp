import { useEffect, useState } from "react";
import { nav } from "../app/router.js";
import { api } from "../app/api.js";
import { Edit, MapPin, Pin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { parseGeoCoords } from "../app/functions.js";
import YandexLocationPickerModal from "../components/YandexLocationPickerModal.jsx";
import SelectField from "../components/SelectField.jsx";

export default function ClientDetails({ query }) {
    const [client, setClient] = useState(null);
    const [regions, setRegions] = useState(null);
    const [isloading, setIsLoading] = useState(true);
    const [mode, setMode] = useState("view"); // view|edit
    const [mapOpen, setMapOpen] = useState(false);

    const queryClient = useQueryClient();
    useEffect(() => {
        async function _() {
            try {
                let o = await api.get("/clients/view?id=" + query.clientId)
                o.data.quantity = o.data.stock?.quantity || 0;
                setClient(o.data);
                let r = await api.get("/region/list")
                setRegions(r.data);
                // alert(JSON.stringify(o.data))
                setIsLoading(false);
            } catch (e) {
                alert(JSOn.stringify(e))
            }
        }
        _()
    }, [query]);
    if (isloading) return <div style={{ padding: 16 }}>Loading...</div>;
    return (
        <div>
            <div class="topbar p-16 row space-between">
                <div class="col">
                    <div class="f-xl f-bold">
                        Клиент: {client.name}
                    </div>
                </div>
                <div>
                    {mode == 'view' ? <Edit
                        size={22} class="cursor-pointer"
                        onClick={() => setMode('edit')} />
                        :
                        <div class="row g-8">
                            <button onClick={() => setMode('view')} class="btn btn-sm">Отмена</button>

                            <button onClick={() => {
                                api.post('/clients/edit', {
                                    id: client.id,
                                    name: client.name,
                                    phone: client.phone,
                                    phone2: client.phone2,
                                    totalAmount: client.totalAmount,
                                    stockQuantity: client.quantity,
                                    deliveryNote: client.deliveryNote,
                                    address: client.address,
                                    regionId: client.region?.id,
                                    location: client.location,
                                }).then(() => {
                                    queryClient.invalidateQueries(['clients']);
                                    nav("/clients");
                                }).catch(e => {
                                    alert(e.response?.data?.message || e.message || 'Ошибка при сохранении' + JSON.stringify(e))
                                }
                                )
                            }} class="btn btn-sm btn-primary">Сохранить</button>
                        </div>
                    }
                </div>
            </div>
            <div style={{ height: '85vh', overflow: "scroll" }}>
                {mode == 'view' ? <div class="p-16 col g-16">
                    <div class="card">
                        <div class="f-lg f-bold text-primary" style={{ marginBottom: 6 }}>
                            Инфо
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">ИД</div>
                                <div class="f-lg f-semibold">{client.name}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Номер</div>
                                <div class="f-lg f-semibold">{client.phone}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Номер 2</div>
                                <div class="f-lg f-semibold">{client.phone2 || '-'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="f-lg f-bold text-primary" style={{ marginBottom: 6 }}>
                            Детали
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Остаток</div>
                                <div class="f-lg f-semibold">{client.quantity || '-'}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Адрес</div>
                                <div class="f-lg f-semibold">{client.address || '-'}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Локация</div>
                                <div class="f-lg f-semibold">{client.location?.latitude + ' ' + client.location?.longitude}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Регион</div>
                                <div class="f-lg f-semibold">{client.region?.name || '-'}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Примечание</div>
                                <div class="f-lg f-semibold">{client.deliveryNote || '-'}</div>
                            </div>
                        </div>
                    </div>
                    {client.order ?
                        <button class="btn btn-primary" onClick={() => nav('/order/view', { query: { orderId: client.order.id } })}>
                            Просмотр заказа
                        </button> :
                        <button class="btn btn-primary" onClick={() => nav('/order/create', { query: { clientId: client.id } })}>
                            Новый заказ
                        </button>
                    }
                    <button class="btn" onClick={() => nav('/order/history', { query: { clientId: client.id, name: client.name } })}>
                        История заказов
                    </button>
                </div>
                    :
                    <div class="p-16 col g-16">
                        <div class="card">
                            <div class="row space-between">
                                <div>
                                    <div class="f-sm text-secondary">ИД</div>
                                    <input class="input" value={client.name}
                                        onChange={e => {
                                            // alert(e.target.value)
                                            setClient(s => ({ ...s, name: e.target.value }))
                                        }} />
                                </div>
                            </div>
                            <div class="row space-between">
                                <div>
                                    <div class="f-sm text-secondary">Номер</div>
                                    <input class="input" value={client.phone} onChange={e => setClient(s => ({ ...s, phone: e.target.value }))} />
                                </div>
                            </div>
                            <div class="row space-between">
                                <div>
                                    <div class="f-sm text-secondary">Номер 2</div>
                                    <input class="input" value={client.phone2} onChange={e => setClient(s => ({ ...s, phone2: e.target.value }))} />
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="row space-between">
                                <div>
                                    <div class="f-sm text-secondary">Остаток</div>
                                    <input class="input" value={client.quantity} onChange={e => setClient(s => ({ ...s, quantity: e.target.value }))} />
                                </div>
                            </div>
                            <div class="row space-between">
                                <div>
                                    <div class="f-sm text-secondary">Адрес</div>
                                    <input class="input" value={client.address} onChange={e => setClient(s => ({ ...s, address: e.target.value }))} />
                                </div>
                            </div>
                            <div class="row space-between">
                                <div>
                                    <div class="f-sm text-secondary">Регион</div>
                                    <SelectField
                                        label="Регион"
                                        title="Выберите регион"
                                        value={client.region?.id}
                                        options={regions.map(r => ({ label: r.name, value: r.id }))}
                                        onChange={(v) => {
                                            let r = regions.find(r => r.id == v);
                                            setClient(s => ({
                                                ...s,
                                                region: r ?? s.region,
                                            }))
                                        }}
                                        placeholder="Выберите регион"
                                    />
                                </div>
                            </div>
                            <div class="row space-between">
                                <div>
                                    <div class="f-sm text-secondary">Локация</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <input class="input" value={(client.location?.latitude || '') + ' ' + (client.location?.longitude || '')} onChange={e => setClient(s => ({ ...s, location: parseGeoCoords(e.target.value) }))} />
                                        <MapPin size={36} color="grey" onClick={() => setMapOpen(true)} />
                                    </div>
                                </div>
                            </div>
                            <div class="row space-between">
                                <div>
                                    <div class="f-sm text-secondary">Примечание</div>
                                    <textarea class="input" value={client.deliveryNote} onChange={e => setClient(s => ({ ...s, deliveryNote: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
            <YandexLocationPickerModal
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                initialPoint={{ lat: client.location.latitude, lon: client.location.longitude, zoom: 12 }}
                onPick={(p) => { setClient(s => ({ ...s, location: { latitude: p.lat, longitude: p.lon } })) }}
            />
        </div >
    );
}