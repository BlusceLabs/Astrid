import fs from "fs";
import { performance } from "perf_hooks";

const handler = async (m, { conn, usedPrefix }) => {
  const datas = global
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`))
  const tradutor = _translate.plugins.info_estado
  const start = performance.now();

  const _uptime = process.uptime() * 1000;
  const uptime = clockString(_uptime);
  const totalusrReg = Object.values(global.db.data.users).filter((user) => user.registered == true).length;
  const totalusr = Object.keys(global.db.data.users).length;
  const chats = Object.entries(conn.chats).filter(
    ([id, data]) => id && data.isChats,
  );
  const groups = chats.filter(([id]) => id.endsWith("@g.us"));
  const { restrict, antiCall, antiprivado, modejadibot } =
    global.db.data.settings[conn.user.jid] || {};
  const { autoread, gconly, pconly, self } = global.opts || {};
  const rtime = (performance.now() - start).toFixed(3);
  const info = ` ${tradutor.texto1[0]}

  ${tradutor.texto1[1]} hoodDevs
  ${tradutor.texto1[2]} +5219996125657
  ${tradutor.texto1[3]} paypal.me/hoodDevs

  ${tradutor.texto1[4]} ${rtime}
  ${tradutor.texto1[5]} ${uptime}
  ${tradutor.texto1[6]} ${usedPrefix}
  ${tradutor.texto1[7]} ${self ? "private" : "public"}
  ${tradutor.texto1[8]} ${totalusrReg}
  ${tradutor.texto1[9]} ${totalusr}
  ${tradutor.texto1[10]} ${(conn.user.jid == global.conn.user.jid ? '' : `Sub-bot of:\n ▢ +${global.conn.user.jid.split`@`[0]}`) || 'Not a sub-bot'}
 
  ${tradutor.texto1[11]} ${chats.length - groups.length}
  ${tradutor.texto1[12]} ${groups.length}
  ${tradutor.texto1[13]} ${chats.length}
 
  ${tradutor.texto1[14]} ${autoread ? "enabled" : "disabled"}
  ${tradutor.texto1[15]} ${restrict ? "enabled" : "disabled"}
  ${tradutor.texto1[16]} ${pconly ? "enabled" : "disabled"}
  ${tradutor.texto1[17]} ${gconly ? "enabled" : "disabled"}
  ${tradutor.texto1[18]} ${antiprivado ? "enabled" : "disabled"}
  ${tradutor.texto1[19]} ${antiCall ? "enabled" : "disabled"}
  ${tradutor.texto1[20]} ${modejadibot ? "enabled" : "disabled"}`.trim();
  await m.reply(info);
};

handler.command = /^(ping|info|status|estado|infobot)$/i;
export default handler;

function clockString(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, 0)).join(":");
}
