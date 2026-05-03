import ws from 'ws'

const handler = async (m, { conn, command }) => {
  const subBots = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn.user.jid)])];

  if (!subBots.includes(global.conn.user.jid)) {
    subBots.push(global.conn.user.jid);
  }

  const testi = (await m?.mentionedJid || [])[0];
  const who = testi ? testi : (m?.quoted ? await m?.quoted?.sender : false)
  const chat = global.db.data.chats[m.chat];

  if (command === 'setprimary') {
  if (!who) return conn.reply(m.chat, `❗ Please mention a bot to change the configuration.`, m);

  if (!subBots.includes(who)) return conn.reply(m.chat, `❗ The mentioned user is not a sub-bot.`, m);

    if (chat.setPrimaryBot === who) {
      return conn.reply(m.chat, `✅ @${who.split`@`[0]} is already the primary bot for this group.`, m, { mentions: [who] });
    }

    try {
      chat.setPrimaryBot = who;
      conn.reply(m.chat, `[❕] @${who.split`@`[0]} has been set as the primary bot for this group.`, m, { mentions: [who] });
    } catch (e) {
      await m.reply(`❗ An error occurred while setting the primary bot.`);
    }
  } else if (command === 'delprimary') {
    if (!chat.setPrimaryBot) {
      return conn.reply(m.chat, `❗ There is no primary bot set for this group.`, m);
    }

    try {
      const previousBot = chat.setPrimaryBot;
      delete chat.setPrimaryBot
      conn.reply(m.chat, `▶️ @${previousBot.split`@`[0]} has been removed as the primary bot for the group.`, m, { mentions: [previousBot] });
    } catch (e) {
      await m.reply(`❗ An error occurred while removing the primary bot.`);
    }
  }
};

handler.help = ['setprimary', 'delprimary'];
handler.tags = ['group'];
handler.command = ['setprimary', 'delprimary'];
handler.admin = true;

export default handler;
