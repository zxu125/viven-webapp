import { useEffect, useState } from "react";
import { nav } from "../app/router.js";
import { api } from "../app/api.js";
import { Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function OrderDetails({ query }) {
  const orderId = query.orderId;
  const [order, setOrder] = useState(null);
  const [savedOrder, setSavedOrder] = useState(null);
  const [isloading, setIsLoading] = useState(true);
  const [mode, setMode] = useState("view"); // view|edit
  const queryClient = useQueryClient();
  // return <div class="p-16 col g-16">{orderId}</div>;
  useEffect(() => {
    async function _() {
      try {
        let o = await api.get("/orders/view/" + orderId)
        o.data.cancelled = [1, 2].includes(o.data.statusId);
        // alert(JSON.stringify(o.data))
        setOrder(o.data);
        setSavedOrder(o.data);
        setIsLoading(false);
      } catch (e) {
        // alert(JSOn.stringify(e))
      }
    }
    _()
  }, [orderId]);
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
          {!order.cancelled && (mode == 'view' ? <Edit
            size={22} class="cursor-pointer"
            onClick={() => {
              setMode('edit')
            }} />
            :
            <div class="row g-8">
              <button onClick={() => {
                setOrder(savedOrder);
                setMode('view')
              }} class="btn btn-sm">Отмена</button>

              <button onClick={() => {
                api.post('/orders/edit', {
                  id: order.id,
                  totalAmount: order.totalAmount,
                  note: order.note,
                  priority: order.priority
                }).then(() => {
                  queryClient.invalidateQueries(['orders']);
                  queryClient.invalidateQueries(['ordersHistory']);
                  queryClient.invalidateQueries(['map']);
                  nav("/orders");
                }).catch(e => {
                  alert('Ошибка при сохранении' + e.response?.data?.message || e.message || JSON.stringify(e))
                }
                )
              }} class="btn btn-sm btn-primary">Сохранить</button>
            </div>
          )
          }
        </div>
      </div>
      <div style={{ height: '85vh', overflow: "scroll" }}>
        {mode == 'view' ? <div class="p-16 col g-16">
          <div class="card">
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">ИД</div>
                <div class="f-lg f-semibold">{order.client.name}</div>
              </div>
            </div>
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Номер</div>
                <div class="f-lg f-semibold">{order.client.phone}</div>
              </div>
            </div>
            {order.client.phone2 && <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Номер 2</div>
                <div class="f-lg f-semibold">{order.client.phone2}</div>
              </div>
            </div>}
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Адрес</div>
                <div class="f-lg f-semibold">{order.client.address || '-'}</div>
              </div>
            </div>
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Дата заказа</div>
                <div class="f-lg f-semibold">{new Date(order.orderDate || order.createdAt).toLocaleDateString() || '-'}</div>
              </div>
            </div>
            {order.cancelled && <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Дата {order.statusId == 2 ? 'доставки' : 'отмены'}</div>
                <div class="f-lg f-semibold">{new Date(order.completedDate).toLocaleDateString() || '-'}</div>
              </div>
            </div>}
          </div>

          <div class="card">
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Статус</div>
                <div class="f-lg f-semibold" style={{ color: order.status.textColor }}>{order.status.ru}</div>
              </div>
            </div>
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Бутылей</div>
                <div class="f-lg f-semibold">{order.totalAmount}</div>
              </div>
            </div>
            {order.statusId == 2 &&
              <>
                <div class="row space-between">
                  <div>
                    <div class="f-sm text-secondary">Дано</div>
                    <div class="f-lg f-semibold">{order.delivery?.countGiven + '' || '-'}</div>
                  </div>
                </div>
                <div class="row space-between">
                  <div>
                    <div class="f-sm text-secondary">Взято</div>
                    <div class="f-lg f-semibold">{order.delivery?.countGotten + '' || '-'}</div>
                  </div>
                </div>
              </>
            }
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Цена</div>
                <div class="f-lg f-semibold">{order.price + '' || '-'} сум</div>
              </div>
            </div>
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Текущий остаток</div>
                <div class="f-lg f-semibold">{order.currentStock + '' || '-'}</div>
              </div>
            </div>
            <div class="row space-between">
              <div>
                <div class="f-sm text-secondary">Примечание</div>
                <div class="f-md f-semibold">{order.note || '-'}</div>
              </div>
            </div>
          </div>

          <button class="btn btn-ghost" onClick={() => nav("/client/view", { query: { clientId: order.client.id } })}>
            Подробнее о клиенте
          </button>
          {![1, 2].includes(order.statusId) &&
            <>
              <button class="btn btn-primary" onClick={() => nav("/order/confirm", { query: { orderId: order.id, confirm: true, next: '/order/view?orderId=' + order.id } })}>
                Подтвердить заказ
              </button>
              <button class="btn btn-danger" onClick={() => nav("/order/confirm", { query: { orderId: order.id, confirm: false, next: '/order/view?orderId=' + order.id } })}>
                Отменить заказ
              </button>
            </>
          }
        </div>
          :
          <div class="p-16 col g-16">
            <div class="card">
              <div class="row space-between">
                <div>
                  <div class="f-sm text-secondary">ИД</div>
                  <input readOnly={true} class="input disabled" value={order.client.name} onChange={e => setOrder(s => ({ ...s, client: { ...s.client, name: e.target.value } }))} />
                </div>
              </div>
              <div class="row space-between">
                <div>
                  <div class="f-sm text-secondary">Номер</div>
                  <input readOnly={true} class="input disabled" value={order.client.phone} onChange={e => setOrder(s => ({ ...s, client: { ...s.client, phone: e.target.value } }))} />
                </div>
              </div>
              {order.client.phone2 && <div class="row space-between">
                <div>
                  <div class="f-sm text-secondary">Номер 2</div>
                  <input readOnly={true} class="input disabled" value={order.client.phone2} onChange={e => setOrder(s => ({ ...s, client: { ...s.client, phone2: e.target.value } }))} />
                </div>
              </div>}
              <div class="row space-between">
                <div>
                  <div class="f-sm text-secondary">Адрес</div>
                  <input readOnly={true} class="input disabled" value={order.client.address} onChange={e => setOrder(s => ({ ...s, client: { ...s.client, address: e.target.value } }))} />
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
                  <input type="number" readOnly={true} class="input disabled" value={order.totalAmount * order.productPrice} />
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
        }
      </div>
    </div>
  );
}
