import React, { useEffect, useRef } from "react";
import KeepAlive from "../components/KeepAlive.jsx";
import TabBar from "../components/TabBar.jsx";
import { nav, parseHash } from "../app/router.js";

import Home from "../pages/Home.jsx";
import Orders from "../pages/Orders.jsx";
import Profile from "../pages/Profile.jsx";
import useTelegramTheme from "../hooks/useTelegramTheme.js";
import { Map } from "../pages/Map.jsx";
import Clients from "../pages/Clients.jsx";

export default function TabsLayout({ tab, showTabbar, orderId }) {
  const [route, setRoute] = React.useState(() => parseHash());
  const theme = useTelegramTheme();
  const tabbar = useRef();
  useEffect(() => {
    if (!tabbar.current) return;
    const tabbarHeight = tabbar.current.offsetHeight;
  }, [route.isTab]);
  // state табов сохранится, потому что они не размонтируются
  return (
    <div className={`layout ${theme == 'light' ? 'theme-light' : 'theme-dark'}`}
      style={{
        width: "100vw",
        backgroundColor:'var(--bg)'
      }}>
      <div className="content bg">
        <KeepAlive active={tab === "home"}>
          <Home />
        </KeepAlive>

        <KeepAlive active={tab === "map"}>
          <Map />
        </KeepAlive>

        <KeepAlive active={tab === "orders"}>
          <Orders />
        </KeepAlive>

        <KeepAlive active={tab === "clients"}>
          <Clients />
        </KeepAlive>
      </div>

      {showTabbar && <TabBar ref={tabbar} tab={tab} onTab={(t) => nav(t)} />}
    </div>
  );
}
