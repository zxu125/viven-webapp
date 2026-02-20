import React from "react";
import { nav } from "../app/router";
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
export default function Home() {
  const [count, setCount] = React.useState(0);
  const { logout } = useAuth();
  return (
    <div>

      <div class="topbar p-16 row space-between">
        <div class="col">
          <div class="f-xl f-bold">Главная</div>
        </div>

      </div>

      <div class="p-16 col g-16">
        <div class='card' style={{ border: 'none' }}>
          <div style={{ padding: 8, width: '50%' }}>
            <div class="row space-between">
              <div class="f-lg">Заказы:</div>
              <div class="f-lg">16</div>
            </div>
            <div class="row space-between" style={{ marginTop: 10 }}>
              <div class="f-lg">Остатки:</div>
              <div class="f-lg">50</div>
            </div>
          </div>
        </div>
        <div class="card" style={{ marginTop: 9 }}>
          <div class="f-md f-bold b-bottom row space-between" style={{ paddingBottom: 11, width: '100%' }}
            onClick={() => nav("/clients")}>
            <p>Клиенты</p>
            <ChevronRight style={{ cursor: "pointer" }} size={19} />
          </div>
          <div class="f-md f-bold b-bottom row space-between" style={{ paddingBottom: 11, paddingTop: 11, width: '100%' }}
            onClick={() => nav("/map")}>
            <p>Карта</p>
            <ChevronRight style={{ cursor: "pointer" }} size={19} />
          </div>
          <div class="f-md f-bold b-bottom row space-between" style={{ paddingBottom: 11, paddingTop: 11, width: '100%' }}
            onClick={() => nav("/orders")}>
            <p>Заказы</p>
            <ChevronRight style={{ cursor: "pointer" }} size={19} />
          </div>
          <div class="f-md f-bold b-bottom row space-between" style={{ paddingBottom: 11, paddingTop: 11, width: '100%' }}
            onClick={() => nav("/order/history")}>
            <p>История заказов</p>
            <ChevronRight style={{ cursor: "pointer" }} size={19} />
          </div>
          <div class="f-md f-bold row space-between" style={{ paddingTop: 11, width: '100%' }}
            onClick={() => nav("/users")}>
            <p>Пользователи</p>
            <ChevronRight style={{ cursor: "pointer" }} size={19} />
          </div>
        </div>
        <div class="f-lg f-bold row space-between p-16"
          style={{
            marginTop: -9,
            width: '40%',
            color: 'var(--danger)'
          }}
          onClick={() => {
            alert(1)
            if (confirm('vaska')) logout().then(() => nav("/login"));
          }}>
          <p>Выход</p>
          <LogOut style={{ cursor: "pointer" }} size={24} />
        </div>
      </div>

    </div>
  );
}
