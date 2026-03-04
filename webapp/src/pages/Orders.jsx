import React, { use, useEffect } from "react";
import { api } from "../app/api";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { nav } from "../app/router";
import { AddButton } from "../components/UI";
import { callPhone, openYandexRouteFromMyLocation } from "../app/functions";

export default function Orders() {
  const [state, setState] = React.useState({});
  const queryClient = new QueryClient();
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['orders'],
    queryFn: () => {
      return api.get('/orders/list' + (state.search ? '?search=' + state.search : ''))
        .then(res => {
          // alert(JSON.stringify(red.data[0]))
          return res.data
        })
    }
  })
  let filtered = data
  useEffect(() => {
    let t = setTimeout(() => refetch(), 800);
    return () => clearTimeout(t);
  }, [state.search])

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

        {!isFetching && filtered && filtered.map(e => (<div className="card">

          <div class="row space-between">
            <div class="col">
              <div class="f-md f-semibold">{e.client.name}</div>
              <div class="f-sm text-secondary">{e.client.address}</div>
            </div>

            <div class="badge" style={{ height: 28 }}>
              {e.status.ru}
            </div>
          </div>

          <div class="row space-between" style={{ padding: 3 }}>
            <div class="col">
              <div class="f-sm text-secondary">Дата</div>
              <div class="f-sm f-medium">{new Date(e.deliveryDate || e.createdAt).toLocaleString()}</div>
            </div>

            <div class="col" style={{ textAlign: 'right' }}>
              <div class="f-sm text-secondary">Бутылей</div>
              <div class="f-sm f-bold text-brand">{e.totalAmount} шт</div>
            </div>
          </div>

          <div class="row g-12" style={{ width: '100%' }}>
            <button class="btn btn-primary btn-xs r-xs" onClick={() => nav('/order/view', { query: { orderId: e.id } })}
              style={{ borderRadius: 10 }}>
              Подробнее
            </button>

            <button class="btn btn-ghost btn-xs r-xs" onClick={() => callPhone(e.client.phone)}
              style={{ borderRadius: 10 }}>
              Позвонить
            </button>

            {e.statusId == 5 &&
              <button class="btn btn-primary btn-xs r-xs"
                onClick={() => {
                  api.post('/orders/change-status', {
                    id: e.id,
                    statusId: 3
                  }).then(() => {
                    alert('Статус изменен на "В пути"');
                    queryClient.invalidateQueries(['map']);
                    refetch();
                  }).catch(e => {
                    alert('Ошибка при изменении статуса' + (e.message || JSON.stringify(e)))
                  }).finally(() => {
                    if (confirm('Открыть маршрут в Яндекс.Картах?')) {
                      openYandexRouteFromMyLocation([
                        { lat: e.location.latitude, lon: e.location.longitude },
                      ], "auto");
                    }
                  })
                }}
                style={{ borderRadius: 10, marginLeft: 'auto' }}>
                В путь
              </button>}
            {e.statusId == 3 &&
              <>
                {/* <button class="btn btn-primary btn-xs r-xs"
                  onClick={() => {
                    openYandexRouteFromMyLocation([
                      { lat: e.location.latitude, lon: e.location.longitude },
                    ], "auto");
                  }}
                  style={{ borderRadius: 10, marginLeft: 'auto', backgroundColor: 'var(--warning)' }}>
                  Остановить
                </button> */}
                <button class="btn btn-primary btn-xs r-xs"
                  onClick={() => {
                    openYandexRouteFromMyLocation([
                      { lat: e.location.latitude, lon: e.location.longitude },
                    ], "auto");
                  }}
                  style={{ borderRadius: 10, marginLeft: 'auto', backgroundColor: 'var(--warning)' }}>
                  Маршрут
                </button>
              </>
            }

            {/* {e.client.phone2 && <button class="btn btn-ghost btn-sm r-sm" onClick={() => callPhone(e.client.phone2)}>
              Позвонить2
            </button>} */}
          </div>

        </div>))}

        {isFetching && <div class="row center" style={{ padding: 50 }}>
          Loading...
        </div>}
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
