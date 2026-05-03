import os from 'os';

const handler = async (m, { conn }) => {
  const memory = process.memoryUsage();
  const db = global.db?.data || {};
  const users = Object.keys(db.users || {}).length;
  const chatsInDb = Object.keys(db.chats || {}).length;
  const settings = Object.keys(db.settings || {}).length;
  const plugins = Object.values(global.plugins || {});
  const enabledPlugins = plugins.filter((plugin) => plugin && !plugin.disabled).length;
  const disabledPlugins = plugins.length - enabledPlugins;
  const activeChats = Object.entries(conn.chats || {}).filter(([, chat]) => chat?.isChats);
  const groups = activeChats.filter(([id]) => id.endsWith('@g.us')).length;
  const privateChats = activeChats.length - groups;
  const heapUsedPercent = memory.heapTotal
    ? Math.round((memory.heapUsed / memory.heapTotal) * 100)
    : 0;
  const responseTime = getResponseTime(m.messageTimestamp);

  const lines = [
    '*Astrid Health*',
    '',
    `Status: ${heapUsedPercent >= 90 ? 'Needs attention' : 'OK'}`,
    `Uptime: ${formatDuration(process.uptime())}`,
    `Response time: ${responseTime === null ? 'unknown' : `${responseTime} ms`}`,
    '',
    '*Runtime*',
    `Node: ${process.version}`,
    `Platform: ${os.type()} ${os.release()} (${os.arch()})`,
    `PID: ${process.pid}`,
    `Load average: ${os.loadavg().map((value) => value.toFixed(2)).join(', ')}`,
    '',
    '*Memory*',
    `RSS: ${formatBytes(memory.rss)}`,
    `Heap: ${formatBytes(memory.heapUsed)} / ${formatBytes(memory.heapTotal)} (${heapUsedPercent}%)`,
    `External: ${formatBytes(memory.external)}`,
    '',
    '*Bot Data*',
    `Users: ${users}`,
    `Database chats: ${chatsInDb}`,
    `Settings records: ${settings}`,
    `Active chats: ${activeChats.length} (${groups} groups, ${privateChats} private)`,
    `Plugins: ${enabledPlugins} enabled, ${disabledPlugins} disabled`,
  ];

  await m.reply(lines.join('\n'));
};

handler.help = ['health', 'diagnostics'];
handler.tags = ['info'];
handler.command = /^(health|diagnostics|diag|runtime)$/i;
handler.owner = true;

export default handler;

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function formatDuration(seconds = 0) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds / 3600) % 24;
  const minutes = Math.floor(seconds / 60) % 60;
  const remainingSeconds = Math.floor(seconds % 60);
  const parts = [
    days && `${days}d`,
    hours && `${hours}h`,
    minutes && `${minutes}m`,
    `${remainingSeconds}s`,
  ].filter(Boolean);

  return parts.join(' ');
}

function getResponseTime(messageTimestamp) {
  if (!messageTimestamp) return null;
  const timestamp = typeof messageTimestamp.toNumber === 'function'
    ? messageTimestamp.toNumber()
    : Number(messageTimestamp);

  if (!Number.isFinite(timestamp)) return null;
  const timestampMs = timestamp > 9999999999 ? timestamp : timestamp * 1000;
  return Math.max(0, Date.now() - timestampMs);
}
