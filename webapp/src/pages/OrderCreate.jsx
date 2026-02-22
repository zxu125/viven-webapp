import { useEffect, useState } from "react";
import { nav } from "../app/router.js";
import { api } from "../app/api.js";
import { Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import SelectField from "../components/SelectField.jsx";

export default function OrderCreate({ query }) {
    const [mode, setMode] = useState("view"); // view|edit
    // return 'vasya'
    const [order, setOrder] = useState({
        client: {
            name: '',
            phone: '',
            phone2: '',
            address: ''
        },
        totalAmount: 0,
        note: '',
    });
    const [clients, setClients] = useState([]);
    const [isloading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();
    useEffect(() => {
        async function _() {
            try {
                let o = await api.get("/clients/list")
                setClients(o.data);
                setIsLoading(false);
                if (query.clientId) {
                    let c = o.data.find(c => c.id == query.clientId);
                    if (c) {
                        setOrder(s => ({ ...s, client: c }))
                    }
                }
            } catch (e) {
                // alert(JSOn.stringify(e))
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
                        Заказ
                    </div>
                </div>
                <div>
                    <div class="row g-8">
                        <button onClick={() => {
                            setIsLoading(true);
                            // api.post(`/orders/${order.client.order ? 'edit' : 'add'}`, {
                            api.post('/orders/add', {
                                id: order.client.order?.id,
                                totalAmount: order.totalAmount,
                                note: order.note,
                                priority: order.priority,
                                orderDate: new Date(),
                                clientId: order.client.id
                            }).then(() => {
                                alert('Сохранено');
                                queryClient.invalidateQueries(['orders']);
                                queryClient.invalidateQueries(['map']);
                                nav("/orders");
                            }).catch(e => {
                                setIsLoading(false);
                                alert(e.response?.data?.message || e.message || 'Ошибка при сохранении' + JSON.stringify(e))
                            }
                            )
                        }} class="btn btn-sm btn-primary">
                            Сохранить
                        </button>
                    </div>
                </div>
            </div>
            <div style={{ height: '85vh', overflow: "scroll" }}>
                <div class="p-16 col g-16">
                    <div class="card">
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">
                                    ИД
                                </div>
                                <SelectField
                                    // label="Клиент"
                                    title="Выберите клиента"
                                    value={order.client?.id}
                                    options={clients.map(c => ({ label: c.name, value: c.id }))}
                                    onChange={(v) => {
                                        let c = clients.find(c => c.id === v);
                                        setOrder(s => ({
                                            ...s,
                                            client: c ?? s.client,
                                            totalAmount: c.order ? c.order.totalAmount : 0,
                                            note: c.order ? c.order.note : '',
                                        }))
                                    }}
                                    placeholder="Выберите клиента"
                                />
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Номер</div>
                                <input readOnly={true} class="input disabled" value={order.client.phone} />
                            </div>
                        </div>
                        {order.client.phone2 && <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Номер 2</div>
                                <input readOnly={true} class="input disabled" value={order.client.phone2} />
                            </div>
                        </div>}
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Адрес</div>
                                <input readOnly={true} class="input disabled" value={order.client.address} />
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Бутылей</div>
                                <input type="number" class="input" value={Number(order.totalAmount)} onChange={e => setOrder(s => ({ ...s, totalAmount: Math.max(0, Number(e.target.value)) }))} />
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Цена</div>
                                <input type="number" readOnly={true} class="input disabled" value={order.totalAmount * 17000} />
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Примечание</div>
                                <textarea class="input" value={order.note} onChange={e => setOrder(s => ({ ...s, note: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
