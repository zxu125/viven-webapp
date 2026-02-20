import { useEffect, useState } from "react";

export default function useTelegramTheme() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();

    setTheme(tg.colorScheme);

    tg.onEvent("themeChanged", () => {
      setTheme(tg.colorScheme);
    });
  }, []);

  return theme;
}
