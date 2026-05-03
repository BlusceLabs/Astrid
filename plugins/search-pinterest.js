/* 
/////////////////////////////////

 ☆ Código creado por: GabrielZks
 ☆ GitHub: github.com/glytglobal/
 ☆ Tipo: Buscador de Pinterest (Modo Carrusel)
 ☆ Descripción: Creado específicamente y adaptado
   a las funcionalidades de Astrid-Bot-MD, prohibida su
   venta, modificación sin autorización explícita y cambios de
   derechos de autor. Creative Commons (2025) -License-.

/////////////////////////////////
*/

const { proto, generateWAMessageFromContent, generateWAMessageContent } = (await import("baileys")).default;
import axios from 'axios';

const handler = async (m, { conn, usedPrefix, command, text }) => {
 if (!text) return conn.sendMessage(m.chat, { text: `*_< PINTEREST SEARCH />_*\n\n[ ❗ ] Enter a search term to find results.\nExample: ${usedPrefix + command} cats` }, { quoted: m });
 try {
 let { data } = await axios.get(`${global.APIs.stellar}/search/pinterest?query=${text}&apikey=${global.APIKeys[global.APIs.stellar]}`);
 let images = data.data;
 let push = [];
 for (let i = 0; i < images.length; i++) {
 let image = images[i];
 push.push({ 
 body: proto.Message.InteractiveMessage.Body.fromObject({ text: `\n□ Result number: ${i + 1}\n` }), 
 footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: global.pickbot }), 
 header: proto.Message.InteractiveMessage.Header.fromObject({ 
 title: '*_< PINTEREST SEARCH />_*', 
 hasMediaAttachment: true, 
 imageMessage: await generateWAMessageContent({ image: { url: image.mini } }, { upload: conn.waUploadToServer }).then(res => res.imageMessage) 
 }), 
 nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ 
 buttons: [ 
 { 
 "name": "cta_url", 
 "buttonParamsJson": `{"display_text":"View in high quality","url":"${image.hd}","merchant_url":"${image.hd}"}` 
    } 
   ] 
  }) 
 });
}

 let bot = generateWAMessageFromContent(m.chat, { 
 viewOnceMessage: { 
 message: { 
 messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, 
 interactiveMessage: proto.Message.InteractiveMessage.fromObject({ 
 body: proto.Message.InteractiveMessage.Body.create({ text: "*_< PINTEREST SEARCH />_*" }), 
 footer: proto.Message.InteractiveMessage.Footer.create({ text: `□ *Search:* ${text}\n□ *Requested by:* ${global.db.data.users[m.sender].name}` }), 
 header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }), 
 carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards: [ ...push ] }) 
  }) 
 } 
} 
}, { quoted: m });
 await conn.relayMessage(m.chat, bot.message, { messageId: bot.key.id });
 } catch (error) {
 console.error(error);
 conn.sendMessage(m.chat, { text: "*_< PINTEREST SEARCH />_*\n\n[❗] An error occurred while processing your request." }, { quoted: m });
 }
};

handler.help = ['pinterest'];
handler.tags = ['search'];
handler.command = ['pinterest', 'pin'];

export default handler;
