import axios from 'axios';
import fetch from 'node-fetch';
import fs from 'fs';

const handler = async (m, {conn, args, usedPrefix, command}) => {
  const datas = global
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`))
  const tradutor = _translate.plugins.downloader_igstory

  if (!args[0]) throw `${tradutor.texto1}\n*${usedPrefix + command} luisitocomunica*`;
  await m.reply(global.wait);
  
  try {
    const res = await axios.get(`${global.BASE_API_DELIRIUS}/download/instagram-story?username=${args[0]}`, { timeout: 30000 });
    const data = res.data;
    
    if (data && data.data && Array.isArray(data.data)) {
      for (const i of data.data) {
        try {
          const mediaRes = await axios.head(i.url);
          const mime = mediaRes.headers['content-type'];
          if (/image/.test(mime)) {
            await conn.sendFile(m.chat, i.url, 'story.jpg', null, m);
          } else if (/video/.test(mime)) {
            await conn.sendFile(m.chat, i.url, 'story.mp4', null, m);
          }
        } catch (e) {
          console.error('Error sending media:', e.message);
        }
      }
    } else {
      throw new Error('No data');
    }
  } catch (error) {
    console.error('IG Story error:', error);
    try {
      const res2 = await fetch(`https://api.lolhuman.xyz/api/igstory/${args[0]}?apikey=${lolkeysapi}`);
      const anu = await res2.json();
      const anuku = anu.result;
      if (anuku == '') return m.reply(`${tradutor.texto2}`);
      for (const i of anuku) {
        const res = await axios.head(i);
        const mime = res.headers['content-type'];
        if (/image/.test(mime)) {
          await conn.sendFile(m.chat, i, 'error.jpg', null, m);
        }
        if (/video/.test(mime)) {
          await conn.sendFile(m.chat, i, 'error.mp4', null, m);
        }
      }
    } catch {
      m.reply(`${tradutor.texto2}`);
    }
  }
};
handler.help = ['igstory <username>'];
handler.tags = ['downloader'];
handler.command = ['igstory', 'ighistoria'];
export default handler;
