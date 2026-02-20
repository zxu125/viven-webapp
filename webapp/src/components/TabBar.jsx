import { Home, List, Map, User, Users } from "lucide-react";

function TabBtn({ active, children, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`tabbtn ${active ? "tabbtn--active" : ""}`}
    >
      <Icon size={20}
        style={{
          color: active ? "black" : "gray",
        }} />
      <span style={{
        fontSize: "12px",
        color: active ? "black" : "gray",
      }}>
        {children}
      </span>
    </button>
  );
}

export default function TabBar({ tab, onTab, ref }) {
  return (
    <div className="tabbar" ref={ref} style={{zIndex:9999}}>
      <TabBtn
        active={tab === "home"}
        icon={Home}
        onClick={() => onTab("home")}
      >
        Home
      </TabBtn>

      <TabBtn
        active={tab === "map"}
        icon={Map}
        onClick={() => onTab("map")}
      >
        Map
      </TabBtn>

      <TabBtn
        active={tab === "orders"}
        icon={List}
        onClick={() => onTab("orders")}
      >
        Orders
      </TabBtn>

      <TabBtn
        active={tab === "clients"}
        icon={Users}
        onClick={() => onTab("clients")}
      >
        Clients
      </TabBtn>
    </div>
  );
}
