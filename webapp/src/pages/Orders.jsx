import React, { use, useEffect } from "react";
import { api } from "../app/api";
import { useQuery } from "@tanstack/react-query";
import { nav } from "../app/router";
import { AddButton } from "../components/UI";
import { callPhone } from "../app/functions";

export default function Orders() {
  const [state, setState] = React.useState({});
  const { data } = useQuery({
    queryKey: ['orders'],
    queryFn: () => { return api.get('/orders/list').then(res => res.data) }
  })
  let filtered = data?.filter(e => {
    if (!state.search) return true;
    return e.client.name?.toLowerCase().includes(state.search?.toLowerCase()) || e.client.address?.toLowerCase().includes(state.search?.toLowerCase())
  })
  useEffect(() => {
    // alert(JSON.stringify(data?.[0]))
  }, [data])

  return (
    <div>

      <div class="topbar p-16 row space-between">
        <div class="col">
          <div class="f-xs text-secondary">Сегодня</div>
          <div class="f-xl f-bold">Мои доставки</div>
        </div>

        <div class="badge badge-brand">
          {data?.length} заказов
        </div>
      </div>

      <div class="p-16 col g-16">

        <input
          class="input r-md"
          placeholder="Поиск по клиенту или адресу"
          onChange={e => setState(s => ({ ...s, search: e.target.value }))}
        />
      </div>
      <div class="p-16 col g-16" style={{ height: 'calc(100vh - 200px)', overflow: 'scroll', marginTop: -10 }}>

        {filtered && filtered.map(e => (<div className="card">

          <div class="row space-between">
            <div class="col">
              <div class="f-lg f-semibold">{e.client.name}</div>
              <div class="f-sm text-secondary">{e.client.address}</div>
            </div>

            <div class="badge">
              {e.status.ru}
            </div>
          </div>

          <div class="row space-between p-12" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div class="col">
              <div class="f-sm text-secondary">Дата</div>
              <div class="f-md f-medium">{new Date(e.deliveryDate || e.createdAt).toLocaleString()}</div>
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

            <button class="btn btn-ghost btn-sm r-sm" onClick={() => callPhone(e.client.phone)}>
              Позвонить
            </button>

            {/* {e.client.phone2 && <button class="btn btn-ghost btn-sm r-sm" onClick={() => callPhone(e.client.phone2)}>
              Позвонить2
            </button>} */}
          </div>

        </div>))}
      </div>



      <div style={{
        position: 'absolute',
        bottom: 90,
        right: 10,
      }}>
        <AddButton onClick={() => nav('/order/create')} />
      </div>
    </div>
  );
}
