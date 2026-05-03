import express from 'express';
import {createServer} from 'http';
import path from 'path';
import {Socket} from 'socket.io';
import {toBuffer} from 'qrcode';
import fetch from 'node-fetch';

function connect(conn, PORT) {
  const app = global.app = express();
  console.log(app);
  const server = global.server = createServer(app);
  let _qr = 'The QR code is invalid, the QR code has possibly already been scanned.';

  conn.ev.on('connection.update', function appQR({qr}) {
    if (qr) _qr = qr;
  });

  app.get('/health', (req, res) => {
    const uptime = process.uptime() * 1000;
    const memUsage = process.memoryUsage();
    const dbSize = global.db?.data ? Object.keys(global.db.data).length : 0;
    res.json({
      status: 'ok',
      uptime: uptime,
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss
      },
      database: {
        loaded: !!global.db?.data,
        keys: dbSize
      },
      connection: {
        connected: !!conn?.user,
        jid: conn?.user?.jid || null
      }
    });
  });

  app.use(async (req, res) => {
    res.setHeader('content-type', 'image/png');
    res.end(await toBuffer(_qr));
  });

  server.listen(PORT, () => {
    console.log('[ ℹ️ ] The application is listening on port', PORT, '(ignore if you have already scanned the QR code)');
    if (opts['keepalive']) keepAlive();
  });
}

function pipeEmit(event, event2, prefix = '') {
  const old = event.emit;
  event.emit = function(event, ...args) {
    old.emit(event, ...args);
    event2.emit(prefix + event, ...args);
  };
  return {
    unpipeEmit() {
      event.emit = old;
    }};
}

function keepAlive() {
  const url = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  if (/(\/\/|\.)undefined\./.test(url)) return;
  setInterval(() => {
    fetch(url).catch(console.error);
  }, 5 * 1000 * 60);
}

export default connect;
