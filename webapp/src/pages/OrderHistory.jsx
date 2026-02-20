import React, { use, useEffect } from "react";
import { api } from "../app/api";
import { useQuery } from "@tanstack/react-query";
import { nav } from "../app/router";
import { AddButton } from "../components/UI";
import { RefreshCw } from "lucide-react";

export default function OrderHIstory({ query }) {
    const [state, setState] = React.useState({});
    const { data, refetch } = useQuery({
        queryKey: ['ordersHistory', query.clientId],
        queryFn: () => {
            return api.post('/orders/history', {
                clientId: query.clientId,
                userId: query.userId,
                state: query.state,
                searchText: state.search
            }).then(res => res.data)
        }
    })
    let filtered = data?.filter(e => {
        if (!state.search) return true;
        return e.client.name?.toLowerCase().includes(state.search?.toLowerCase()) || e.user.name?.toLowerCase().includes(state.search?.toLowerCase())
    })
    useEffect(() => {
        refetch()
    }, [state.search, query.clientId])

    return (
        <div>

            <div class="topbar p-16 row space-between">
                <div class="col">
                    {query.clientId ?
                        <div class="f-xl f-bold">История заказов: {query.name}</div>
                        : <div class="f-xl f-bold">История заказов</div>}
                </div>

                <div class="badge badge-brand">
                    {data?.length} заказов
                </div>
            </div>

            <div class="p-16 col g-16" style={{ position: 'relative' }}>

                <input
                    class="input r-md"
                    placeholder="Поиск по клиенту или адресу"
                    onChange={e => setState(s => ({ ...s, search: e.target.value }))}
                />
                <RefreshCw size={24} style={{ position: 'absolute', top: 29, right: 36 }} color="grey" onClick={()=>alert(1)} />
            </div>
            <div class="p-16 col g-16" style={{ height: 'calc(100vh - 150px)', overflow: 'scroll', marginTop: -10 }}>
                {filtered && filtered.map(e => (<div className="card">

                    <div class="row space-between">
                        <div class="col">
                            <div class="f-lg f-semibold">{e.client.name}</div>
                            <div class="f-sm text-secondary">{e.client.address}</div>
                        </div>

                        <div class={`badge ${e.statusId == 2 ? 'badge-success' : 'badge-danger'}`}>
                            {e.status.ru}
                        </div>
                    </div>

                    <div class="row space-between p-12" style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <div class="col">
                            <div class="f-sm text-secondary">Пользователь</div>
                            <div class="f-md f-medium">{e.user?.name}</div>
                        </div>

                        <div class="col" style={{ textAlign: 'right' }}>
                            <div class="f-sm text-secondary">Бутылей</div>
                            <div class="f-md f-bold text-brand">{e.totalAmount} шт</div>
                        </div>
                    </div>

                    <div class="row g-12">
                        <button class="btn btn-primary btn-sm r-sm" onClick={() => nav('/order/view', { query: { orderId: e.id } })}>
                            Подробнее
                        </button>
                    </div>
                </div>))}
            </div>
        </div>
    );
}
