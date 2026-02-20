import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isAuthed as isAuthedLocal } from "../app/auth";        // твоя isAuthed() по access token
import { tryRefresh } from "../app/api-lib/tryRefresh";        // refresh по cookie
import { api } from "../app/api";                      // твой axios instance
import { clearTokens } from "../app/auth";                     // или где у тебя clearTokens

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // unknown -> мы ещё не проверили (bootstrap)
    const [status, setStatus] = useState("unknown"); // "unknown" | "authed" | "guest"

    // ✅ Bootstrap один раз: access валиден? иначе пробуем refresh cookie
    useEffect(() => {
        let cancelled = false;

        (async () => {
            // 1) access живой
            if (isAuthedLocal()) {
                if (!cancelled) setStatus("authed");
                return;
            }

            // 2) access нет/истёк -> пробуем refresh
            try {
                await tryRefresh();
                if (!cancelled) setStatus("authed");
            } catch {
                if (!cancelled) setStatus("guest");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // ✅ logout должен менять состояние
    async function logout() {
        try {
            await api.post("/auth/logout"); // должен очистить cookie rt на сервере
        } catch (e) {
            // даже если ошибка — локально всё равно разлогиним
        }
        clearTokens();   // удаляем access из localStorage
        setStatus("guest");
    }

    // ✅ после успешного login — дерни это
    function onLoggedIn() {
        setStatus("authed");
    }

    // ✅ полезно дергать если refresh умер или сервер сказал "не авторизован"
    function forceGuest() {
        clearTokens();
        setStatus("guest");
    }

    const value = useMemo(
        () => ({
            status,
            authed: status === "authed",
            logout,
            onLoggedIn,
            forceGuest,
            setStatus, // иногда удобно руками, но можно не использовать
        }),
        [status]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}