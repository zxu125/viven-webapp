import React from "react";
import { ensureDefaultHash, parseHash, nav, getBackTarget } from "./router";
import TabsLayout from "../layouts/TabsLayout";
import Login from "../pages/Login";

import ClientCreate from "../pages/ClientCreate";
import ClientDetails from "../pages/ClientDetails";
import OrderCreate from "../pages/OrderCreate";
import ConfirmOrder from "../pages/ConfirmOrder";
import OrderDetails from "../pages/OrderDetails";
import OrderHistory from "../pages/OrderHistory";
import Users from "../pages/Users";
import UserDetails from "../pages/UserDetails";
import UserCreate from "../pages/UserCreate";
import Profile from "../pages/Profile";

import useTelegramTheme from "../hooks/useTelegramTheme";
import { useAuth } from "../context/AuthContext";
 
export default function App() {
  const theme = useTelegramTheme();
  const { status, authed, onLoggedIn } = useAuth();

  const [route, setRoute] = React.useState(() => parseHash());

  // hash listener
  React.useEffect(() => {
    ensureDefaultHash();
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // auth guard
  React.useEffect(() => {
    if (status === "unknown") return;

    if (!authed && route.name !== "login") {
      nav("login", { replace: true, query: { next: route.path } });
    }

    if (authed && route.name === "login") {
      nav("/home", { replace: true });
    }
  }, [status, authed, route]);

  // Telegram BackButton: только на overlay когда authed
  React.useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();

    const shouldShow = authed && route.type === "overlay" && route.name !== "login";

    if (!shouldShow) {
      tg.BackButton.hide();
      return;
    }

    tg.BackButton.show();

    const handler = () => {
      const target = getBackTarget(route);

      if (target) {
        nav(target, { replace: true });
        return;
      }

      if (window.history.length > 1) window.history.back();
      else nav("/home", { replace: true });
    };

    tg.BackButton.onClick(handler);
    return () => tg.BackButton.offClick(handler);
  }, [route, authed]);

  // overlay wrapper
  function wrapOverlay(node) {
    return (
      <div
        className={`layout ${theme === "light" ? "theme-light" : "theme-dark"}`}
        style={{ width: "100vw" }}
      >
        {node}
      </div>
    );
  }

  function renderOverlay() {
    switch (route.name) {
      case "clientCreate":
        return wrapOverlay(<ClientCreate query={route.query} />);
      case "clientDetails":
        return wrapOverlay(<ClientDetails query={route.query} />);
      case "orderDetails":
        return wrapOverlay(<OrderDetails query={route.query} />);
      case "orderHistory":
        return wrapOverlay(<OrderHistory query={route.query} />);
      case "orderCreate":
        return wrapOverlay(<OrderCreate query={route.query} />);
      case "orderConfirm":
        return wrapOverlay(<ConfirmOrder query={route.query} />);
      case "users":
        return wrapOverlay(<Users query={route.query} />);
      case "userDetails":
        return wrapOverlay(<UserDetails query={route.query} />);
      case "userCreate":
        return wrapOverlay(<UserCreate query={route.query} />);
      case "profile":
        return <Profile />;
      default:
        return null;
    }
  }

  // render
  if (status === "unknown") return <div style={{ padding: 16 }}>Loading...</div>;

  if (route.name === "login") {
    return <Login onLoggedIn={onLoggedIn} />;
  }

  const overlay = renderOverlay();

  return (
    <>
      <TabsLayout
        tab={route.tab}
        route={route}
        showTabbar={route.type === "tab"}
      />

      {overlay && (
        <div style={overlayStyle}>
          <div style={overlayCardStyle}>{overlay}</div>
        </div>
      )}
    </>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "var(--surface)",
  display: "flex",
  justifyContent: "center",
  alignItems: "stretch",
  zIndex: 999,
};

const overlayCardStyle = {
  background: "var(--bg)",
  width: "100%",
  height: "100%",
};