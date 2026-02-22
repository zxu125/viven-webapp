import "dotenv/config";
import express from "express";
import { Telegraf, Markup } from "telegraf";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const PORT = Number(process.env.PORT || 3000);

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is missing in .env");
if (!WEBAPP_URL) throw new Error("WEBAPP_URL is missing in .env");

const bot = new Telegraf(BOT_TOKEN);

const sessions = new Map();
/*
sessions.get(chatId) = {
  step: "idle" | "wait_name" | "wait_location",
  name: string
}
*/

function getSession(chatId) {
  if (!sessions.has(chatId)) sessions.set(chatId, { step: "idle", name: "" });
  return sessions.get(chatId);
}

bot.command("newclient", async (ctx) => {
  const chatId = ctx.chat.id;
  const s = getSession(chatId);
  s.step = "wait_name";
  s.name = "";

  await ctx.reply("Введите имя клиента (например: Ислом Абдуллаев):");
});

bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;
  const s = getSession(chatId);

  // если не в сценарии — игнор/или обычный ответ
  if (s.step !== "wait_name") return;

  const name = (ctx.message.text || "").trim();
  if (name.length < 2) {
    await ctx.reply("Имя слишком короткое. Введите имя клиента еще раз:");
    return;
  }

  s.name = name;
  s.step = "wait_location";

  await ctx.reply(
    `Ок, клиент: "${name}". Теперь отправьте локацию (кнопка ниже).`,
    Markup.keyboard([
      Markup.button.locationRequest("📍 Отправить локацию"),
      Markup.button.text("❌ Отмена"),
    ])
      .oneTime()
      .resize()
  );
});

bot.on("location", async (ctx) => {
  const chatId = ctx.chat.id;
  const s = getSession(chatId);

  if (s.step !== "wait_location") {
    await ctx.reply("Сначала используйте команду /newclient");
    return;
  }

  const { latitude, longitude } = ctx.message.location;
  await ctx.reply(`Получил локацию: ${latitude}, ${longitude}. Сохраняю...`, Markup.removeKeyboard());
  Markup.removeKeyboard()
  return
  try {
    // отправляем на nodejs сервер
    const payload = {
      tgUserId: ctx.from?.id,
      chatId,
      name: s.name,
      lat: latitude,
      lon: longitude,
      // можно добавить username/phone если есть
      username: ctx.from?.username || null,
    };

    const r = await axios.post(`${API_BASE}/tg/newclient`, payload, {
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    // сброс сценария
    s.step = "idle";
    s.name = "";

    await ctx.reply(
      `✅ Клиент создан: ${r.data?.clientId ? `ID ${r.data.clientId}` : "готово"}`,
      Markup.removeKeyboard()
    );
  } catch (e) {
    await ctx.reply(
      `❌ Не получилось сохранить на сервере. Попробуйте еще раз или /newclient заново.`,
      Markup.removeKeyboard()
    );
  }
});

bot.hears("❌ Отмена", async (ctx) => {
  const chatId = ctx.chat.id;
  const s = getSession(chatId);
  s.step = "idle";
  s.name = "";
  await ctx.reply("Отменено.", Markup.removeKeyboard());
});

const app = express();

app.get("/", (req, res) => res.send("OK"));

app.listen(PORT, async () => {
  console.log("HTTP server on port", PORT);
  // локально удобно запускать polling:
  await bot.launch();
  console.log("Bot launched (polling)");
});
console.log(sessions)

// graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
