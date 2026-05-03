/* Donation info */

const handler = async (m, { conn, usedPrefix, command }) => {
 try {   
   const donar = `╭─「 💖 *DONATIONS* 💖 」
│
│ Hello *${m?.name}*! 👋
│
│ Enjoying this project? 🤖✨
│ Help us keep it running!
│
├─「 💳 *Donation methods* 」
│
│ • PayPal: paypal.me/hoodDevs 💰
│
│ 💬 *Other ways to help:*
│ Contact me: @5219996125657
│ Number: wa.me/5219996125657
│
│ 📝 *Note:* Every donation
│ helps us grow together 🌱
│
╰─「 *Thanks for your support!* 🙏 」`.trim();

   const doc = ['pdf', 'zip', 'vnd.openxmlformats-officedocument.presentationml.presentation', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'vnd.openxmlformats-officedocument.wordprocessingml.document'];
   const document = doc[Math.floor(Math.random() * doc.length)];
   
   const buttonMessage = {
     'document': {url: `https://github.com/hoodDevs/Astrid`},
     'mimetype': `application/${document}`,
     'fileName': `💖 DONATIONS 💖`,
     'fileLength': 99999999999999,
     'pageCount': 200,
     'contextInfo': {
       'forwardingScore': 200,
       'isForwarded': true,
       'mentionedJid': conn.parseMention(donar),
       'externalAdReply': {
         'mediaUrl': 'https://github.com/hoodDevs/Astrid',
         'mediaType': 2,
         'previewType': 'pdf',
         'title': '💖 DONATIONS - Support the project',
         'body': wm,
         'thumbnail': imagen1,
         'sourceUrl': 'https://www.youtube.com/channel/UCSTDMKjbm-EmEovkygX-lCA'}},
     'caption': donar,
     'footer': wm,
     'headerType': 6
   };
   
   conn.sendMessage(m.chat, buttonMessage, {quoted: m});
   
 } catch {
   const simpleMsg = `💖 *DONATIONS*

Hello *${m?.name}*! 

Enjoying this bot? Help us keep it active!

🎯 *Why donate?*
• Keep the server running
• Fund new features
• Improve speed
• Support 24/7

💳 *Methods:*
• PayPal: paypal.me/hoodDevs

💬 *Other ways to help:*
Contact me: @5219996125657

Thanks for your support! 🙏`;
   
   m.reply(simpleMsg);
 }
};
handler.help = ['donate'];
handler.tags = ['info'];
handler.command = /^(donate|donar|apoyar|donación|donacion|apoyo|ayuda|colaborar|contribuir)$/i
export default handler;
