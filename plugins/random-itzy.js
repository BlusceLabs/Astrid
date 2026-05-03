import axios from 'axios';
const handler = async (m, {conn, args, usedPrefix, command}) => {
  const res = (await axios.get(`https://raw.githubusercontent.com/hoodDevs/Astrid/master/src/JSON/itzy.json`)).data;
  const astrid = await res[Math.floor(res.length * Math.random())];
  conn.sendFile(m.chat, astrid, 'error.jpg', `_${command}_`, m);
};
// conn.sendButton(m.chat, `_${command}_`, author, astrid, [['🔄 𝚂𝙸𝙶𝚄𝙸𝙴𝙽𝚃𝙴 🔄', `/${command}`]], m)}
handler.help = ['itzy', 'kpopitzy'];
handler.tags = ['internet'];
handler.command = /^(itzy|kpopitzy)$/i;
export default handler;
