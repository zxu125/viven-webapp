import { useEffect, useState } from "react";
import { nav } from "../app/router.js";
import { api } from "../app/api.js";
import { Edit, MapPin, Pin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { parseGeoCoords } from "../app/functions.js";
import YandexLocationPickerModal from "../components/YandexLocationPickerModal.jsx";
import SelectField from "../components/SelectField.jsx";

export default function ClientDetails() {
    const [regions, setRegions] = useState(null);

    const [client, setClient] = useState({
        id: null,
        name: '',
        phone: '',
        phone2: '',
        totalAmount: 0,
        quantity: 0,
        deliveryNote: '',
        address: '',
        location: null,
    });
    const [isloading, setIsLoading] = useState(true);
    const [mapOpen, setMapOpen] = useState(false);

    const queryClient = useQueryClient();

    useEffect(() => {
        async function _() {
            try {
                let r = await api.get("/region/list")
                setRegions(r.data);
                setIsLoading(false);
            } catch (e) {
                alert(JSOn.stringify(e))
            }
        }
        _()
    }, []);

    if (isloading) return <div style={{ padding: 16 }}>Loading...</div>;
    return (
        <div>
            <div class="topbar p-16 row space-between">
                <div class="col">
                    <div class="f-xl f-bold">
                        Новый клиент
                    </div>
                </div>
                <div>
                    <div class="row g-8">
                        <button onClick={() => {
                            api.post('/clients/add', {
                                name: client.name,
                                phone: client.phone,
                                phone2: client.phone2,
                                totalAmount: client.totalAmount,
                                stockQuantity: client.quantity,
                                deliveryNote: client.deliveryNote,
                                address: client.address,
                                locations: [client.location],
                                regionId: client.region?.id
                            }).then(() => {
                                queryClient.invalidateQueries(['clients']);
                                nav("/clients");
                            }).catch(e => {
                                alert('Ошибка при сохранении: ' + JSON.stringify(e.response?.data?.error) || e.response?.data?.message || e.message)
                            }
                            )
                        }} class="btn btn-sm btn-primary">Сохранить</button>
                    </div>
                </div>
            </div>
            <div style={{ height: '85vh', overflow: "scroll" }}>
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
                                <div class="f-sm text-secondary">Адрес</div>
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
            </div>
            <YandexLocationPickerModal
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                initialCenter={{ lat: 41.311081, lon: 69.240562, zoom: 12 }}
                onPick={(p) => { alert(JSON.stringify(p)); setClient(s => ({ ...s, location: { latitude: p.lat, longitude: p.lon } })) }}
            />
        </div >
    );
}