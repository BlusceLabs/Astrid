const handler = async (m, { isAdmin }) => {
 global.db.data.users[m.sender].language = 'en'
 if (m.isGroup && isAdmin) {
  global.db.data.chats[m.chat].language = 'en'
 }
 m.reply(`*[ ℹ️ ] Astrid is now English-only.*\n\nLanguage switching has been removed and all bot responses now use English.`)
};

handler.help = ['lang'];
handler.tags = ['info'];
handler.command = ['lang', 'langgroup'];

export default handler;
