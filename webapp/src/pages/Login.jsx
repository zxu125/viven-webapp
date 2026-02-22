import { useEffect, useMemo, useState } from "react";
import { login } from "../app/api-lib/auth";

const API_BASE = "/api"; // если webapp и api на одном домене: оставь "" (тот же origin)
export default function LoginPage({ onLoggedIn }) {
  const tg = useMemo(() => window.Telegram?.WebApp, []);
  const [tgSession, setTgSession] = useState(null);
  const [tgUser, setTgUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  // 1) TG handshake
  useEffect(() => {
    (async () => {

      try {
        setErr("");
        if (!tg) return; // если открыли не из Telegram — просто пропускаем
        tg.ready();
        tg.expand?.();

        const initData = tg.initData;
        if (!initData) return;

        const r = await fetch(`${API_BASE}/auth/tg/handshake`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ initData }),
        });
        if (!r.ok) {
          const j = await safeJson(r);
          throw new Error(j?.message || `Handshake failed (${r.status})`);
        }

        const j = await r.json();
        setTgSession(j.tgSession);
        setTgUser(j.tgUser || null);
      } catch (e) {
        setErr(e?.message || "Handshake error");
      }
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const r = await login(username, password, "webapp_tg", tgSession);
      onLoggedIn?.(r); // передадим наверх (accessToken/user)
    } catch (e2) {
      // alert(e2?.message || "Login error");
      setErr(e2?.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || !username || !password || !tgSession;

  return (
    <div class="bg-app">
      <div class="p-16 col g-16" style={{ width: '100vw', height: '100vh' }}>
        <div class="card" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <div class="f-lg text-primary">Вход</div>
          <div class="row space-between" style={{ marginTop: 10, width: "100%" }}>
            <div style={{ marginTop: 10, width: "100%" }}>
              <div class="f-sm text-secondary">Логин</div>
              <input class="input" type="text" value={username}
                onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>
          <div class="row space-between" style={{ marginTop: 10, width: "100%" }}>
            <div style={{ marginTop: 10, width: "100%" }}>
              <div class="f-sm text-secondary">Пароль</div>
              <input class="input" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          {err && <div class='text-sm text-danger' style={{ marginLeft: 12 }}>
            {err}
          </div>}
          <button class="btn btn-primary" onClick={submit} disabled={disabled}
            style={{ marginTop: 10, width: "100%" }}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </div>
      </div>
    </div >
  );
}

async function safeJson(r) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}
