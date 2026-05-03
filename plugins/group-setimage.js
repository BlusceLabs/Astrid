import Jimp from 'jimp';

const handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  try {
    const quoted = m.quoted ? m.quoted : m;
    if (!m.quoted || !quoted.mimetype?.includes('image')) throw '*⚠️ Reply to an image to set it as the group photo.*';

    const mime = (quoted.msg || quoted).mimetype || '';
    const imageBuffer = await quoted.download();

    if (!m.isGroup) throw '*❗ This command can only be used in groups.*';

    const image = await Jimp.read(imageBuffer);
    const resized = image.getWidth() > image.getHeight() ? image.resize(720, Jimp.AUTO) : image.resize(Jimp.AUTO, 720);
    const jpegBuffer = await resized.getBufferAsync(Jimp.MIME_JPEG);

    await conn.updateProfilePicture(m.chat, jpegBuffer);

    await m.reply('✅ *Group photo updated successfully.*');
  } catch (err) {
    console.error('❌ Error en setppgroup:', err);
    await m.reply(typeof err === 'string' ? err : '*❗ An error occurred while changing the group photo.*');
  }
};

handler.command = /^setimagen|setpp(gc|grup|group)$/i;
handler.help = ['setppgroup'];
handler.tags = ['group'];
handler.group = true;
handler.botAdmin = true;
handler.admin = true;
export default handler;
