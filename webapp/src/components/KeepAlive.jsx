export default function KeepAlive({ active, children }) {
    // важно: не размонтировать
    return <div style={{ display: active ? "block" : "none" }}>{children}</div>;
  }
  