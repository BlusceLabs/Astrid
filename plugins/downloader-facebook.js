import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

let handler = async (m, { args, conn, text, usedPrefix, command }) => {
    const idioma = global.db.data.users[m.sender].language || global.defaultLenguaje;
    const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
    const tradutor = _translate.plugins.descargas_facebook;

  if (!text) throw `_*${tradutor.texto1[0]}*_\n\n*${tradutor.texto1[1]}*\n\n*${tradutor.texto1[2]}* ${usedPrefix + command} https://www.facebook.com/share/v/1E5R3gRuHk/`;
    
    try {
        const response = await axios.get(`${global.BASE_API_DELIRIUS}/download/facebook?url=${encodeURIComponent(text)}`, { timeout: 30000 });
        const data = response.data;
        
        if (data && data.data && data.data.download) {
            const downloadUrl = data.data.download;
            await conn.sendMessage(m.chat, { video: { url: downloadUrl }, caption: `*📥 Facebook Download*\n> Download by Astrid Bot` }, { quoted: m });
        } else {
            throw new Error('No download URL found');
        }
    } catch (error) {
        console.error('Facebook download error:', error);
        return await conn.sendMessage(m.chat, { text: `*[❌] Error downloading Facebook video. Try again later.*` }, { quoted: m });
    }
};

handler.command = /^(facebook|fb|facebookdl|fbdl|facebook2|fb2|facebookdl2|fbdl2|facebook3|fb3|facebookdl3|fbdl3|facebook4|fb4|facebookdl4|fbdl4|facebook5|fb5|facebookdl5|fbdl5)$/i;
handler.tags = ['downloader'];
handler.help = ['facebook'];
export default handler;
