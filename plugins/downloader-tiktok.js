import axios from 'axios';
import cheerio from 'cheerio';
import {generateWAMessageFromContent} from "baileys";
import fs from 'fs';

const handler = async (m, {conn, text, args, usedPrefix, command}) => {
  const datas = global
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`))
  const tradutor = _translate.plugins.descargas_tiktok

  if (!text) throw `${tradutor.texto1} _${usedPrefix + command} https://vt.tiktok.com/ZSSm2fhLX/_`;
  if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)) throw `${tradutor.texto2} _${usedPrefix + command} https://vt.tiktok.com/ZSSm2fhLX/_`;
  
  const texto = `${tradutor.texto3}`;
  
  try {
    const apiUrl = `https://api.tikmate.app/api/resolve?url=${encodeURIComponent(args[0])}`;
    const response = await axios.get(apiUrl);
    const data = response.data;
    
    if (data && data.video && data.video.download) {
      const downloadUrl = data.video.download;
      const cap = `${tradutor.texto8[0]} _${usedPrefix}tomp3_ ${tradutor.texto8[1]}`;
      await conn.sendMessage(m.chat, {video: {url: downloadUrl}, caption: cap}, {quoted: m});
    } else {
      throw new Error('No video found');
    }
  } catch {
    try {
      const ss = await axios.get(`${global.BASE_API_DELIRIUS}/download/tiktok?url=${encodeURIComponent(args[0])}`);
      const sss = ss.data;
      if (sss && sss.data && sss.data.download) {
        const cap = `${tradutor.texto8[0]} _${usedPrefix}tomp3_ ${tradutor.texto8[1]}`;
        await conn.sendMessage(m.chat, {video: {url: sss.data.download}, caption: cap}, {quoted: m});
      } else {
        throw `${tradutor.texto9}`;
      }
    } catch (err) {
      console.error('TikTok download error:', err);
      throw `${tradutor.texto9}`;
    }
  }
};
handler.command = /^(tiktok|ttdl|tiktokdl|tiktoknowm|tt|ttnowm|tiktokaudio)$/i;
export default handler;
