import fetch from 'node-fetch';
import fs from 'fs';

const handler = async (m, {conn, args, text}) => {
  const datas = global
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`))
  const tradutor = _translate.plugins.downloader_pptiktok

  if (!text) throw `${tradutor.texto1}`;
  try {
    const res = await fetch(`${global.BASE_API_DELIRIUS}/download/tiktok-profile?username=${text}`);
    const data = await res.json();
    if (data && data.data && data.data.avatar) {
      await conn.sendFile(m.chat, data.data.avatar, 'error.jpg', `${tradutor.texto2} ${text}*`, m, false);
    } else {
      throw 'No avatar found';
    }
  } catch {
    await m.reply(`${tradutor.texto3}` || 'Error downloading profile picture');
  }
};
handler.help = ['tiktokfoto'].map((v) => v + ' <username>');
handler.tags = ['downloader'];
handler.command = /^(tiktokfoto|pptiktok)$/i;
export default handler;