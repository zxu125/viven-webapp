import { useEffect, useState } from "react";
import { nav } from "../app/router";
import { api } from "../app/api";
import { useQueryClient } from "@tanstack/react-query";

export default function ConfirmOrder({ query }) {
    const queryClient = useQueryClient();
    const confirm = query.confirm == 'true'
    const [data, setData] = useState({
        countGiven: 0,
        countGotten: 0,
        note: ''
    });
    return (
        <div>
            <div class="topbar p-16 row space-between">
                <div class="col">
                    <div class="f-xl f-bold">
                        {confirm ? 'Подтвердить' : 'Отменить'} заказ
                    </div>
                </div>

            </div>
            <div class="p-16 col g-16">
                <div class="card g-16">
                    {confirm && <><div class="row space-between">
                        <div>
                            <div class="f-sm text-secondary">Дано</div>
                            <input type="number" class="input" value={data.countGiven} onChange={e => setData(s => ({ ...s, countGiven: e.target.value }))} />
                        </div>
                    </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Взято</div>
                                <input type="number" class="input" value={data.countGotten} onChange={e => setData(s => ({ ...s, countGotten: e.target.value }))} />
                            </div>
                        </div></>}
                    <div class="row space-between">
                        <div>
                            <div class="f-sm text-secondary">Примечание</div>
                            <textarea class="input" value={data.note} onChange={e => setData(s => ({ ...s, note: e.target.value }))} />
                        </div>
                    </div>
                </div>
                <div class="row g-8">
                    <button class="btn btn-primary r-md" onClick={() => {
                        api.post(`/orders/${confirm ? 'complete-order' : 'cancel-order'}`, { id: query.orderId, ...data }).then(() => {
                            queryClient.invalidateQueries(['orders']);
                            queryClient.invalidateQueries(['ordersHistory']);
                            queryClient.invalidateQueries(['map']);
                            window.history.back();
                        }).catch(e => {
                            alert('Ошибка при подтверждении заказа' + (e.response?.data?.message || e.message || JSON.stringify(e)))
                        })
                    }}>
                        Подтвердить
                    </button>

                    <button class="btn btn-ghost r-md" onClick={() => nav(query.next)}>
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    )
}