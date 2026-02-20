import { api } from "../api";
import { setTokens, clearTokens } from "../auth";

export async function login(username, password, clientType, tgSession) {
    // ожидаем формат:
    // { accessToken: "...", refreshToken: "..." }
    const { data } = await api.post("/auth/login", { username, password, clientType, tgSession});
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data;
}

export async function logout() {
    await api.post("/auth/logout");
    clearTokens();
}
