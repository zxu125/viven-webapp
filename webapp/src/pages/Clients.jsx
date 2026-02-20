import React, { use, useEffect } from "react";
import { api } from "../app/api";
import { useQuery } from "@tanstack/react-query";
import { nav } from "../app/router";
import { AddButton } from "../components/UI";

export default function Home() {
    const [state, setState] = React.useState({});
    const { data } = useQuery({
        queryKey: ['clients'],
        queryFn: () => { return api.get('/clients/list').then(res => res.data) }
    })
    let filtered = data?.filter(e => {
        if (!state.search) return true;
        return e.name?.toLowerCase().includes(state.search?.toLowerCase()) || e.address?.toLowerCase().includes(state.search?.toLowerCase())
    })

    return (
        <div>
            <div class="topbar p-16 row space-between">
                <div class="col">
                    <div class="f-xl f-bold">Клиенты</div>
                </div>

                <div class="badge badge-brand">
                    {data?.length || 0} клиентов
                </div>
            </div>

            <div class="p-16 col g-16" >
                <input
                    class="input r-md"
                    placeholder="Поиск по клиенту или адресу"
                    onChange={e => setState(s => ({ ...s, search: e.target.value }))}
                />
            </div>
            <div class="p-16 col g-16" style={{ height: 'calc(100vh - 200px)', overflow: 'scroll', marginTop: -10 }}>
                {filtered && filtered.map(e => (
                    <div className="card" onClick={() => nav('/client/view', { query: { clientId: e.id } })}>

                        <div class="row space-between">
                            <div class="col">
                                <div class="f-lg f-semibold">{e.name}</div>
                                <div class="f-sm text-secondary">{e.address}</div>
                            </div>
                        </div>

                        <div class="row space-between p-12" style={{ paddingLeft: 0, paddingRight: 0 }}>
                            <div class="col">
                                <div class="f-md f-medium">{e.phone}</div>
                            </div>

                            <div class="col" style={{ textAlign: 'right' }}>
                                {/* <div class="f-sm text-secondary">Бутылей</div>
                            <div class="f-md f-bold text-brand">{e.totalAmount} шт</div> */}
                            </div>
                        </div>

                        {/* <div class="row g-12">
                        <button class="btn btn-primary r-md btn-sm" onClick={() => nav('/orders/' + e.id)}>
                            Подробнее
                        </button>

                        <button class="btn btn-ghost r-md">
                            Позвонить
                        </button>
                    </div> */}

                    </div>))}
            </div>


            <div style={{
                position: 'absolute',
                bottom: 90,
                right: 10,
            }}>
                <AddButton onClick={() => nav('/client/create')} />
            </div>
        </div>
    );
}
