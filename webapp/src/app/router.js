// router.js

// Табовые страницы (живут внутри TabsLayout, должны сохранять state)
const TAB_NAMES = new Set(["home", "orders", "clients", "map"]);

function decodeSafe(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

function encodeSafe(s) {
  try { return encodeURIComponent(s); } catch { return String(s); }
}

function parseQuery(search) {
  const q = {};
  if (!search) return q;

  const sp = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  for (const [k, v] of sp.entries()) q[k] = v;
  return q;
}

function buildQuery(query) {
  if (!query) return "";
  const sp = new URLSearchParams();

  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });

  const s = sp.toString();
  return s ? `?${s}` : "";
}

function splitHash() {
  // "#/client/view?id=12&next=%2Forders" -> { pathname: "/client/view", search: "?id=12&next=..." }
  const raw = (window.location.hash || "#/home").replace(/^#/, ""); // "/x?y"
  const [pathPart, searchPart] = raw.split("?");
  const pathname = pathPart?.startsWith("/") ? pathPart : `/${pathPart || ""}`;
  const search = searchPart ? `?${searchPart}` : "";
  return { pathname, search };
}

function normalizePath(path) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * match(pattern, pathname)
 * pattern: "/orders/:id" or "/client/create"
 * pathname: "/orders/123"
 */
function matchPattern(pattern, pathname) {
  const p = normalizePath(pattern).split("/").filter(Boolean);
  const a = normalizePath(pathname).split("/").filter(Boolean);

  if (p.length !== a.length) return null;

  const params = {};
  for (let i = 0; i < p.length; i++) {
    const pp = p[i];
    const aa = a[i];
    if (pp.startsWith(":")) {
      params[pp.slice(1)] = decodeSafe(aa);
    } else if (pp !== aa) {
      return null;
    }
  }
  return params;
}

/**
 * Роуты:
 * - public: login
 * - tab: основные табы
 * - overlay: любые страницы поверх табов (чтобы табы не размонтировались)
 */
const ROUTES = [
  // PUBLIC
  { name: "login", pattern: "/login", type: "public" },

  // TABS
  { name: "home", pattern: "/home", type: "tab", tab: "home" },
  { name: "orders", pattern: "/orders", type: "tab", tab: "orders" },
  { name: "clients", pattern: "/clients", type: "tab", tab: "clients" },
  { name: "map", pattern: "/map", type: "tab", tab: "map" },

  // OVERLAY (non-tab)
  { name: "orderDetails", pattern: "/order/view", type: "overlay" },      // ?id=
  { name: "profile", pattern: "/profile", type: "overlay" },

  { name: "clientCreate", pattern: "/client/create", type: "overlay" },
  { name: "clientDetails", pattern: "/client/view", type: "overlay" },    // ?id=

  { name: "orderCreate", pattern: "/order/create", type: "overlay" },
  { name: "orderConfirm", pattern: "/order/confirm", type: "overlay" },
  { name: "orderHistory", pattern: "/order/history", type: "overlay" },

  { name: "settings", pattern: "/settings", type: "overlay" },

  { name: "users", pattern: "/users", type: "overlay" },
  { name: "userCreate", pattern: "/user/create", type: "overlay" },
  { name: "userDetails", pattern: "/user/view", type: "overlay" },        // ?id=
];

/**
 * parseHash() -> единый объект маршрута
 * {
 *   name, type, tab, params, query, path
 * }
 */
export function parseHash() {
  const { pathname, search } = splitHash();
  const query = parseQuery(search);

  for (const r of ROUTES) {
    const params = matchPattern(r.pattern, pathname);
    if (params) {
      return {
        name: r.name,
        type: r.type || (r.tab ? "tab" : (r.public ? "public" : "overlay")),
        tab: r.tab || null,
        params,
        query,
        path: pathname,
      };
    }
  }

  // fallback -> home tab
  return {
    name: "home",
    type: "tab",
    tab: "home",
    params: {},
    query: {},
    path: "/home",
  };
}

/**
 * nav():
 * 1) nav("clientCreate", { query:{ next:"/orders" } })
 * 2) nav("/client/create", { query:{ ... } })
 * 3) nav({ name:"userDetails", query:{ id: 5 } })
 */
export function nav(to, opts = {}) {
  let { replace = false, params, query } = opts;

  let patternOrPath = "";

  if (typeof to === "string") {
    if (to.startsWith("#")) {
      // прямой hash
      if (replace) window.location.replace(to);
      else window.location.hash = to.slice(1);
      return;
    }

    if (to.startsWith("/")) {
      patternOrPath = to; // прямой путь
    } else {
      const route = ROUTES.find((r) => r.name === to);
      patternOrPath = route ? route.pattern : "/home";
      // если это таб-имя (home/orders/clients/map) — можно тоже вести по имени
      // но мы и так нашли pattern
    }
  } else if (to && typeof to === "object") {
    const route = ROUTES.find((r) => r.name === to.name);
    patternOrPath = route ? route.pattern : "/home";

    params = { ...(to.params || {}), ...(params || {}) };
    query = { ...(to.query || {}), ...(query || {}) };
  } else {
    patternOrPath = "/home";
  }

  // подставляем :params (если такие появятся в будущем)
  const finalParams = params || {};
  let path = normalizePath(patternOrPath).replace(
    /:([A-Za-z0-9_]+)/g,
    (_, key) => encodeSafe(finalParams?.[key] ?? "")
  );

  const qs = buildQuery(query);
  const next = `#${path}${qs}`;

  if (replace) window.location.replace(next);
  else window.location.hash = next;
}

export function ensureDefaultHash() {
  if (!window.location.hash) nav("/home", { replace: true });
}

export function getRoutes() {
  return ROUTES.slice();
}

/**
 * Для Telegram BackButton:
 * - показываем только на overlay страницах
 * - target берём из query.next, иначе null (=> history.back)
 */
export function getBackTarget(route) {
  if (!route) return null;
  if (route.type === "public" || route.name === "login") return null;

  const nextRaw = route.query?.next;
  if (!nextRaw) return null;

  // next может быть "/orders", "#/orders", "%2Forders"
  const next = decodeSafe(nextRaw);

  // нормализуем: разрешаем "#/x" и "/x"
  if (next.startsWith("#/")) return next;     // оставляем как hash
  if (next.startsWith("/")) return next;      // path
  if (next.startsWith("http")) return next;   // если вдруг захочешь внешнюю ссылку (тогда обработаешь отдельно)
  return next;
}

/**
 * Утилита: текущий активный таб по route
 * - если route.type === tab -> route.tab
 * - если overlay -> по query.tab или fallback home
 */
export function getActiveTab(route) {
  if (!route) return "home";
  if (route.type === "tab" && route.tab) return route.tab;

  // иногда удобно: открывать overlay "поверх" конкретного таба
  const tab = route.query?.tab;
  if (tab && TAB_NAMES.has(tab)) return tab;

  return "home";
}
