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
      alert(e2?.message || "Login error");
      setErr(e2?.message || "Login error");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || !username || !password || !tgSession;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.h2}>Вход</h2>

        {tgUser && (
          <div style={styles.tgBox}>
            Telegram: <b>{tgUser.first_name}</b> (id: {tgUser.id})
          </div>
        )}

        {!tgSession && (
          <div style={styles.warn}>
            Открой эту страницу из Telegram (кнопка бота). Handshake не получен.
          </div>
        )}

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            Логин
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="username"
            />
          </label>

          <label style={styles.label}>
            Пароль
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          <div style={styles.error}>Error: {err} </div>
          <div>{disabled}</div>
          <button style={styles.btn} disabled={disabled}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>

        <div style={styles.hint}>
          После входа accessToken хранится в памяти. Refresh делается через cookie.
        </div>
      </div>
    </div>
  );
}

async function safeJson(r) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 16,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#aaa",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
  h2: { margin: "0 0 12px" },
  tgBox: {
    background: "#e6ffed",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  warn: {
    background: "#aaa",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  form: { display: "grid", gap: 10 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    height: 42,
    borderRadius: 12,
    border: "1px solid #ddd",
    padding: "0 12px",
    outline: "none",
    fontSize: 16,
  },
  error: {
    background: "#ffecec",
    color: "#a40000",
    padding: 10,
    borderRadius: 12,
    fontSize: 14,
  },
  btn: {
    height: 44,
    borderRadius: 12,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    opacity: 1,
  },
  hint: { marginTop: 10, color: "#666", fontSize: 12, lineHeight: 1.4 },
};
