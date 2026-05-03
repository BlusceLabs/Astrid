process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import './api.js';
import { createRequire } from 'module';
import path, { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import fs, { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { format } from 'util';
import pino from 'pino';
import Pino from 'pino';
import { Boom } from '@hapi/boom';
import { makeWASocket, protoType, serialize } from './src/libraries/simple.js';
import { initializeSubBots } from './src/libraries/subBotManager.js';
import { Low, JSONFile } from 'lowdb';
import store from './src/libraries/store.js';
import LidResolver from './src/libraries/LidResolver.js';

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, PHONENUMBER_MCC } = await import("baileys");
import readline from 'readline';
import NodeCache from 'node-cache';
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
let stopped = 'close';
protoType();
serialize();
const msgRetryCounterMap = new Map();
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

global.tools = {
  downloader: {
    ytmp3: async (url) => {
      const ytmp33 = (await import('./src/libraries/ytmp33.js')).default;
      const result = await ytmp33(url);
      if (result.status) {
        return { status: true, download: result.resultados.descargar };
      }
      throw new Error(result.error || 'Download failed');
    },
    ytmp4: async (url) => {
      const ytmp44 = (await import('./src/libraries/ytmp44.js')).default;
      const result = await ytmp44(url);
      if (result.status) {
        return { status: true, download: result.resultados.descargar };
      }
      throw new Error(result.error || 'Download failed');
    }
  }
};

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
}; global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};
global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '');
global.timestamp = { start: new Date };
global.videoList = [];
global.videoListXXX = [];
const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!/.]')
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`));

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise((resolve) => setInterval(async function () {
      if (!global.db.READ) {
        clearInterval(this);
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
      }
    }, 1 * 1000));
  }
  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {}),
  };
  global.db.chain = chain(global.db.data);
};
loadDatabase();

/* ------------------------------------------------*/

/**
 * Auxiliary class for LID data access from JSON
 */
class LidDataManager {
  constructor(cacheFile = './src/lidsresolve.json') {
    this.cacheFile = cacheFile;
  }

  /**
   * Load data from JSON file
   */
  loadData() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        return JSON.parse(data);
      }
      return {};
    } catch (error) {
      console.error('❌ Error loading LID cache:', error.message);
      return {};
    }
  }

  /**
   * Get user information by LID
   */
  getUserInfo(lidNumber) {
    const data = this.loadData();
    return data[lidNumber] || null;
  }

  /**
   * Get user information by JID
   */
  getUserInfoByJid(jid) {
    const data = this.loadData();
    for (const [key, entry] of Object.entries(data)) {
      if (entry && entry.jid === jid) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Find LID by JID
   */
  findLidByJid(jid) {
    const data = this.loadData();
    for (const [key, entry] of Object.entries(data)) {
      if (entry && entry.jid === jid) {
        return entry.lid;
      }
    }
    return null;
  }

  /**
   * List all valid users
   */
  getAllUsers() {
    const data = this.loadData();
    const users = [];
    
    for (const [key, entry] of Object.entries(data)) {
      if (entry && !entry.notFound && !entry.error) {
        users.push({
          lid: entry.lid,
          jid: entry.jid,
          name: entry.name,
          country: entry.country,
          phoneNumber: entry.phoneNumber,
          isPhoneDetected: entry.phoneDetected || entry.corrected,
          timestamp: new Date(entry.timestamp).toLocaleString()
        });
      }
    }
    
    return users.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get statistics
   */
  getStats() {
    const data = this.loadData();
    let valid = 0, notFound = 0, errors = 0, phoneNumbers = 0, corrected = 0;
    
    for (const [key, entry] of Object.entries(data)) {
      if (entry) {
        if (entry.phoneDetected || entry.corrected) phoneNumbers++;
        if (entry.corrected) corrected++;
        if (entry.notFound) notFound++;
        else if (entry.error) errors++;
        else valid++;
      }
    }
    
    return {
      total: Object.keys(data).length,
      valid,
      notFound,
      errors,
      phoneNumbers,
      corrected,
      cacheFile: this.cacheFile,
      fileExists: fs.existsSync(this.cacheFile)
    };
  }

  /**
   * Get users by country
   */
  getUsersByCountry() {
    const data = this.loadData();
    const countries = {};
    
    for (const [key, entry] of Object.entries(data)) {
      if (entry && !entry.notFound && !entry.error && entry.country) {
        if (!countries[entry.country]) {
          countries[entry.country] = [];
        }
        
        countries[entry.country].push({
          lid: entry.lid,
          jid: entry.jid,
          name: entry.name,
          phoneNumber: entry.phoneNumber
        });
      }
    }
    
    // Sort users within each country
    for (const country of Object.keys(countries)) {
      countries[country].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return countries;
  }
}

// LID data manager instance
const lidDataManager = new LidDataManager();

/**
 * ENHANCED FUNCTION: Process text to resolve LIDs - ROBUST VERSION
 */
async function processTextMentions(text, groupId, lidResolver) {
  if (!text || !groupId || !text.includes('@')) return text;
  
  try {
    // More comprehensive regex to capture different mention formats
    const mentionRegex = /@(\d{8,20})/g;
    const mentions = [...text.matchAll(mentionRegex)];

    if (!mentions.length) return text;

    let processedText = text;
    const processedMentions = new Set();
    const replacements = new Map(); // Replacement cache for this text

    // Process all mentions first
    for (const mention of mentions) {
      const [fullMatch, lidNumber] = mention;
      
      if (processedMentions.has(lidNumber)) continue;
      processedMentions.add(lidNumber);
      
      const lidJid = `${lidNumber}@lid`;

      try {
        const resolvedJid = await lidResolver.resolveLid(lidJid, groupId);
        
        if (resolvedJid && resolvedJid !== lidJid && !resolvedJid.endsWith('@lid')) {
          const resolvedNumber = resolvedJid.split('@')[0];
          
          // Validate that the resolved number is different from the original LID
          if (resolvedNumber && resolvedNumber !== lidNumber) {
            replacements.set(lidNumber, resolvedNumber);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing LID mention ${lidNumber}:`, error.message);
      }
    }

    // Apply all replacements
    for (const [lidNumber, resolvedNumber] of replacements.entries()) {
      // Use global regex to replace ALL occurrences
      const globalRegex = new RegExp(`@${lidNumber}\\b`, 'g'); // \\b for word boundary
      processedText = processedText.replace(globalRegex, `@${resolvedNumber}`);
    }

    return processedText;
  } catch (error) {
    console.error('❌ Error in processTextMentions:', error);
    return text;
  }
}

/**
 * AUXILIARY FUNCTION: Process message content recursively
 */
async function processMessageContent(messageContent, groupChatId, lidResolver) {
  if (!messageContent || typeof messageContent !== 'object') return;

  const messageTypes = Object.keys(messageContent);
  
  for (const msgType of messageTypes) {
    const msgContent = messageContent[msgType];
    if (!msgContent || typeof msgContent !== 'object') continue;

    // Process main text
    if (typeof msgContent.text === 'string') {
      try {
        const originalText = msgContent.text;
        msgContent.text = await processTextMentions(originalText, groupChatId, lidResolver);
      } catch (error) {
        console.error('❌ Error processing text:', error);
      }
    }

    // Process caption
    if (typeof msgContent.caption === 'string') {
      try {
        const originalCaption = msgContent.caption;
        msgContent.caption = await processTextMentions(originalCaption, groupChatId, lidResolver);
      } catch (error) {
        console.error('❌ Error processing caption:', error);
      }
    }

    // Process contextInfo
    if (msgContent.contextInfo) {
      await processContextInfo(msgContent.contextInfo, groupChatId, lidResolver);
    }
  }
}

/**
 * AUXILIARY FUNCTION: Process contextInfo recursively
 */
async function processContextInfo(contextInfo, groupChatId, lidResolver) {
  if (!contextInfo || typeof contextInfo !== 'object') return;

  // Process mentionedJid in contextInfo
  if (contextInfo.mentionedJid && Array.isArray(contextInfo.mentionedJid)) {
    const resolvedMentions = [];
    for (const jid of contextInfo.mentionedJid) {
      if (typeof jid === 'string' && jid.endsWith?.('@lid')) {
        try {
          const resolved = await lidResolver.resolveLid(jid, groupChatId);
          resolvedMentions.push(resolved && !resolved.endsWith('@lid') ? resolved : jid);
        } catch (error) {
          resolvedMentions.push(jid);
        }
      } else {
        resolvedMentions.push(jid);
      }
    }
    contextInfo.mentionedJid = resolvedMentions;
  }

  // Process participant in contextInfo
  if (typeof contextInfo.participant === 'string' && contextInfo.participant.endsWith?.('@lid')) {
    try {
      const resolved = await lidResolver.resolveLid(contextInfo.participant, groupChatId);
      if (resolved && !resolved.endsWith('@lid')) {
        contextInfo.participant = resolved;
      }
    } catch (error) {
      console.error('❌ Error resolving participant in contextInfo:', error);
    }
  }

  // Process quoted messages recursively
  if (contextInfo.quotedMessage) {
    await processMessageContent(contextInfo.quotedMessage, groupChatId, lidResolver);
  }

  // Process other fields that may contain text
  if (typeof contextInfo.stanzaId === 'string') {
    contextInfo.stanzaId = await processTextMentions(contextInfo.stanzaId, groupChatId, lidResolver);
  }
}

/**
 * ENHANCED FUNCTION: Process complete message more exhaustively
 */
async function processMessageForDisplay(message, lidResolver) {
  if (!message || !lidResolver) return message;
  
  try {
    const processedMessage = JSON.parse(JSON.stringify(message)); // Deep copy
    const groupChatId = message.key?.remoteJid?.endsWith?.('@g.us') ? message.key.remoteJid : null;
    
    if (!groupChatId) return processedMessage;

    // 1. Resolve participant LID
    if (processedMessage.key?.participant?.endsWith?.('@lid')) {
      try {
        const resolved = await lidResolver.resolveLid(processedMessage.key.participant, groupChatId);
        if (resolved && resolved !== processedMessage.key.participant && !resolved.endsWith('@lid')) {
          processedMessage.key.participant = resolved;
        }
      } catch (error) {
        console.error('❌ Error resolving participant:', error);
      }
    }

    // 2. Process mentionedJid at root level
    if (processedMessage.mentionedJid && Array.isArray(processedMessage.mentionedJid)) {
      const resolvedMentions = [];
      for (const jid of processedMessage.mentionedJid) {
        if (typeof jid === 'string' && jid.endsWith?.('@lid')) {
          try {
            const resolved = await lidResolver.resolveLid(jid, groupChatId);
            resolvedMentions.push(resolved && !resolved.endsWith('@lid') ? resolved : jid);
          } catch (error) {
            resolvedMentions.push(jid);
          }
        } else {
          resolvedMentions.push(jid);
        }
      }
      processedMessage.mentionedJid = resolvedMentions;
    }

    // 3. Process message content
    if (processedMessage.message) {
      await processMessageContent(processedMessage.message, groupChatId, lidResolver);
    }

    return processedMessage;
  } catch (error) {
    console.error('❌ Error processing message for display:', error);
    return message;
  }
}

/**
 * AUXILIARY FUNCTION: Extract all text from a message for debugging
 */
function extractAllText(message) {
  if (!message?.message) return '';
  
  let allText = '';
  
  const extractFromContent = (content) => {
    if (!content) return '';
    let text = '';
    
    if (content.text) text += content.text + ' ';
    if (content.caption) text += content.caption + ' ';
    
    if (content.contextInfo?.quotedMessage) {
      const quotedTypes = Object.keys(content.contextInfo.quotedMessage);
      for (const quotedType of quotedTypes) {
        const quotedContent = content.contextInfo.quotedMessage[quotedType];
        text += extractFromContent(quotedContent);
      }
    }
    
    return text;
  };
  
  const messageTypes = Object.keys(message.message);
  for (const msgType of messageTypes) {
    allText += extractFromContent(message.message[msgType]);
  }
  
  return allText.trim();
}

/**
 * ENHANCED FUNCTION: Intercept messages with better error handling
 */
async function interceptMessages(messages, lidResolver) {
  if (!Array.isArray(messages)) return messages;

  const processedMessages = [];
  
  for (const message of messages) {
    try {
      // Process with lidResolver if it exists
      let processedMessage = message;
      
      if (lidResolver && typeof lidResolver.processMessage === 'function') {
        try {
          processedMessage = await lidResolver.processMessage(message);
        } catch (error) {
          console.error('❌ Error in lidResolver.processMessage:', error);
          // Continue with manual processing
        }
      }
      
      // Additional processing for display
      processedMessage = await processMessageForDisplay(processedMessage, lidResolver);
      
      processedMessages.push(processedMessage);
    } catch (error) {
      console.error('❌ Error intercepting message:', error);
      processedMessages.push(message);
    }
  }

  return processedMessages;
}

const { state, saveCreds } = await useMultiFileAuthState(global.authFile);
const version22 = await fetchLatestBaileysVersion();
console.log(version22)
const version = version22?.version || [2, 3000, 1033893291]; 
let phoneNumber = global.botnumber || process.argv.find(arg => arg.startsWith('--phone='))?.split('=')[1];
const methodCodeQR = process.argv.includes('--method=qr');
const methodCode = !!phoneNumber || process.argv.includes('--method=code');
const MethodMobile = process.argv.includes("mobile");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolver) => rl.question(text, resolver));

let option;
if (methodCodeQR) option = '1';
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${global.authFile}/creds.json`)) {
  do {
    option = await question('[ ℹ️ ] Select an option:\n1. With QR code\n2. With 8-digit text code\n---> ');
    if (!/^[1-2]$/.test(option)) {
      console.log('[ ⚠️ ] Please select only 1 or 2.\n');
    }
  } while (option !== '1' && option !== '2' || fs.existsSync(`./${global.authFile}/creds.json`));
}

const filterStrings = [
  "Q2xvc2luZyBzdGFsZSBvcGVu",
  "Q2xvc2luZyBvcGVuIHNlc3Npb24=",
  "RmFpbGVkIHRvIGRlY3J5cHQ=",
  "U2Vzc2lvbiBlcnJvcg==",
  "RXJyb3I6IEJhZCBNQUM=",
  "RGVjcnlwdGVkIG1lc3NhZ2U="
];

console.info = () => { };
console.debug = () => { };
['log', 'warn', 'error'].forEach(methodName => {
  const originalMethod = console[methodName];
  console[methodName] = function () {
    const message = arguments[0];
    if (typeof message === 'string' && filterStrings.some(filterString => message.includes(Buffer.from(filterString, 'base64').toString()))) {
      arguments[0] = "";
    }
    originalMethod.apply(console, arguments);
  };
});

process.on('uncaughtException', (err) => {
  if (filterStrings.includes(Buffer.from(err.message).toString('base64'))) return;
  console.error('Uncaught Exception:', err);
});

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: option == '1' ? true : methodCodeQR ? true : false,
  mobile: MethodMobile,
  browser: option === '1' ? ['Astrid-Bot-MD', 'Safari', '2.0.0'] : methodCodeQR ? ['Astrid-Bot-MD', 'Safari', '2.0.0'] : ['Ubuntu', 'Chrome', '20.0.04'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
  },
  markOnlineOnConnect: false,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  getMessage: async (key) => {
    try {
      let jid = jidNormalizedUser(key.remoteJid);
      let msg = await store.loadMessage(jid, key.id);
      return msg?.message || "";
    } catch (error) {
      return "";
    }
  },
  msgRetryCounterCache: msgRetryCounterCache || new Map(),
  userDevicesCache: userDevicesCache || new Map(),
  defaultQueryTimeoutMs: 30000,
  cachedGroupMetadata: (jid) => global.conn.chats[jid] ?? {},
  keepAliveIntervalMs: 55000,
  maxIdleTimeMs: 60000,
  version,
};

global.conn = makeWASocket(connectionOptions);
const lidResolver = new LidResolver(global.conn);

// Execute analysis and automatic correction on initialization (SILENT)
setTimeout(async () => {
  try {
    if (lidResolver) {
      // Execute automatic phone number correction (no logs)
      lidResolver.autoCorrectPhoneNumbers();
    }
  } catch (error) {
    console.error('❌ Error in initial analysis:', error.message);
  }
}, 5000);

if (!fs.existsSync(`./${global.authFile}/creds.json`)) {
  if (option === '2' || methodCode) {
    option = '2';
    if (!conn.authState.creds.registered) {
      if (MethodMobile) throw new Error('Pairing code cannot be used with the mobile API');

      let phoneNumberInput;
      if (!!phoneNumber) {
        phoneNumberInput = phoneNumber.replace(/[^0-9]/g, '');
        if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumberInput.startsWith(v))) {
          console.log(chalk.bgBlack(chalk.bold.redBright("Start with the country code of your WhatsApp number.\nExample: +447700900000\n")));
          process.exit(0);
        }
      } else {
        while (true) {
          phoneNumberInput = await question(chalk.bgBlack(chalk.bold.yellowBright('Please write your WhatsApp number.\nExample: +447700900000\n')));
          phoneNumberInput = phoneNumberInput.replace(/[^0-9]/g, '');
          if (phoneNumberInput.match(/^\d+$/) && Object.keys(PHONENUMBER_MCC).some(v => phoneNumberInput.startsWith(v))) break;
          console.log(chalk.bgBlack(chalk.bold.redBright("Please write your WhatsApp number.\nExample: +447700900000.\n")));
        }
        rl.close();
      }

      setTimeout(async () => {
        let code = await conn.requestPairingCode(phoneNumberInput);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(chalk.yellow('[ ℹ️ ] enter the pairing code in WhatsApp.'));
        console.log(chalk.black(chalk.bgGreen(`Your pairing code: `)), chalk.black(chalk.white(code)));
      }, 3000);
    }
  }
}

conn.isInit = false;
conn.well = false;
conn.logger.info(`[　ℹ️　] Loading...\n`);

if (!opts['test']) {
  if (global.db) {
    let dbWritePending = false;
    let dbWriteTimeout = null;
    const debouncedDbWrite = async () => {
      if (dbWritePending) return;
      dbWritePending = true;
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (global.db.data) await global.db.write();
      dbWritePending = false;
    };
    setInterval(debouncedDbWrite, 30000);
    if (opts['autocleartmp'] && (global.support || {}).find) {
      const tmp = [os.tmpdir(), 'tmp', 'jadibts'];
      tmp.forEach((filename) => cp.spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete']));
    }
  }
}

if (opts['server']) (await import('./server.js')).default(global.conn, PORT);

function clearTmp() {
  const tmp = [join(__dirname, './src/tmp')];
  const filename = [];
  tmp.forEach((dirname) => readdirSync(dirname).forEach((file) => filename.push(join(dirname, file))));
  return filename.map((file) => {
    const stats = statSync(file);
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 3)) return unlinkSync(file);
    return false;
  });
}

const dirToWatchccc = path.join(__dirname, './');
function deleteCoreFiles(filePath) {
  const coreFilePattern = /^core\.\d+$/i;
  const filename = path.basename(filePath);
  if (coreFilePattern.test(filename)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file ${filePath}:`, err);
    });
  }
}
fs.watch(dirToWatchccc, (eventType, filename) => {
  if (eventType === 'rename') {
    const filePath = path.join(dirToWatchccc, filename);
    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) deleteCoreFiles(filePath);
    });
  }
});

function purgeSession() {
  let prekey = [];
  let directorio = readdirSync("./AstridSession");
  let filesFolderPreKeys = directorio.filter(file => file.startsWith('pre-key-'));
  prekey = [...prekey, ...filesFolderPreKeys];
  filesFolderPreKeys.forEach(files => unlinkSync(`./AstridSession/${files}`));
}

function purgeSessionSB() {
  try {
    let listaDirectorios = readdirSync('./jadibts/');
    let SBprekey = [];
    listaDirectorios.forEach(directorio => {
      if (statSync(`./jadibts/${directorio}`).isDirectory()) {
        let DSBPreKeys = readdirSync(`./jadibts/${directorio}`).filter(fileInDir => fileInDir.startsWith('pre-key-'));
        SBprekey = [...SBprekey, ...DSBPreKeys];
        DSBPreKeys.forEach(fileInDir => unlinkSync(`./jadibts/${directorio}/${fileInDir}`));
      }
    });
  } catch (err) {
    console.log(chalk.bold.red(`[ ℹ️ ] Something went wrong during deletion, files not deleted`));
  }
}

function purgeOldFiles() {
  const directories = ['./AstridSession/', './jadibts/'];
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  directories.forEach(dir => {
    readdirSync(dir, (err, files) => {
      if (err) throw err;
      files.forEach(file => {
        const filePath = path.join(dir, file);
        stat(filePath, (err, stats) => {
          if (err) throw err;
          if (stats.isFile() && stats.mtimeMs < oneHourAgo && file !== 'creds.json') {
            unlinkSync(filePath, err => {
              if (err) throw err;
            });
          }
        });
      });
    });
  });
}

let isFirstConnection = false;
let qrAlreadyShown = false;
let qrTimeout = null;

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update;
  stopped = connection;
  if (isNewLogin) conn.isInit = true;
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    await global.reloadHandler(true).catch(console.error);
    global.timestamp.connect = new Date;
  }
  if (global.db.data == null) loadDatabase();
  if ((update.qr != 0 && update.qr != undefined) || methodCodeQR) {
    if (option == '1' || methodCodeQR) {
      if (!qrAlreadyShown) {
        console.log(chalk.yellow('[　ℹ️　　] Scan the QR code.'));
        qrAlreadyShown = true;
      }
      if (qrTimeout) clearTimeout(qrTimeout);
      qrTimeout = setTimeout(() => {
        qrAlreadyShown = false;
      }, 60000);
    }
  }
  if (connection == 'open') {
    console.log(chalk.yellow('[　ℹ️　　] Connected correctly.'));
    isFirstConnection = true;
    qrAlreadyShown = false;
    if (qrTimeout) {
      clearTimeout(qrTimeout);
      qrTimeout = null;
    }
    if (!global.subBotsInitialized) {
      global.subBotsInitialized = true;
      try {
        await initializeSubBots();
      } catch (error) {
        console.error(chalk.red('[ ⚠️ ] Error initializing sub-bots:'), error);
      }
    }
  }
  let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
  const lastErrors = {};
  const errorTimers = {};
  const errorCounters = {};
  function shouldLogError(errorType) {
    if (!errorCounters[errorType]) errorCounters[errorType] = { count: 0, lastShown: 0 };
    const now = Date.now();
    const errorData = errorCounters[errorType];
    if (errorData.count >= 5) return false;
    if (now - errorData.lastShown < 2000) return false;
    errorData.count++;
    errorData.lastShown = now;
    return true;
  }
  if (reason == 405) {
    //await fs.unlinkSync("./AstridSession/" + "creds.json");
    console.log(chalk.bold.redBright(`[ ⚠️ ] Connection replaced, please wait a moment, I am restarting...\nIf errors appear, restart with: npm start`));
    //process.send('reset');
  }
  if (connection === 'close') {
    if (reason === DisconnectReason.badSession) {
      if (shouldLogError('badSession')) {
        conn.logger.error(`[ ⚠️ ] Incorrect session, please delete the folder ${global.authFile} and scan again.`);
      }
      await global.reloadHandler(true).catch(console.error);
    } else if (reason === DisconnectReason.connectionClosed) {
      if (shouldLogError('connectionClosed')) {
        conn.logger.warn(`[ ⚠️ ] Connection closed, reconnecting...`);
      }
      await global.reloadHandler(true).catch(console.error);
    } else if (reason === DisconnectReason.connectionLost) {
      if (shouldLogError('connectionLost')) {
        conn.logger.warn(`[ ⚠️ ] Connection lost with the server, reconnecting...`);
      }
      await global.reloadHandler(true).catch(console.error);
    } else if (reason === DisconnectReason.connectionReplaced) {
      if (shouldLogError('connectionReplaced')) {
        conn.logger.error(`[ ⚠️ ] Connection replaced, another new session has been opened. Please close the current session first.`);
      }
      await global.reloadHandler(true).catch(console.error);
    } else if (reason === DisconnectReason.loggedOut) {
      if (shouldLogError('loggedOut')) {
        conn.logger.error(`[ ⚠️ ] Connection closed, please delete the folder ${global.authFile} and scan again.`);
      }
    } else if (reason === DisconnectReason.restartRequired) {
      if (isFirstConnection) {
        if (shouldLogError('restartRequired')) {
          //conn.logger.info(`[ ⚠️ ] First start: Ignoring restartRequired (possible false positive)`);
        }
        isFirstConnection = false;
      } else {
        if (shouldLogError('restartRequired')) {
          conn.logger.info(`[ ⚠️ ] Restart required, reconnecting...`);
        }
        await global.reloadHandler(true).catch(console.error);
      }
    } else if (reason === DisconnectReason.timedOut) {
      if (shouldLogError('timedOut')) {
        conn.logger.warn(`[ ⚠️ ] Connection timed out, reconnecting...`);
      }
      await global.reloadHandler(true).catch(console.error);
    } else {
      const unknownError = `unknown_${reason || ''}_${connection || ''}`;
      if (shouldLogError(unknownError)) {
        conn.logger.warn(`[ ⚠️ ] Unknown disconnection reason. ${reason || ''}: ${connection || ''}`);
      }
      await global.reloadHandler(true).catch(console.error);
    }
  }
}

process.on('uncaughtException', (error) => {
  const filterStrings = [
    "Q2xvc2luZyBzdGFsZSBvcGVu",
    "Q2xvc2luZyBvcGVuIHNlc3Npb24=",
    "RmFpbGVkIHRvIGRlY3J5cHQ=",
    "U2Vzc2lvbiBlcnJvcg==",
    "RXJyb3I6IEJhZCBNQUM=",
    "RGVjcnlwdGVkIG1lc3NhZ2U="
  ];
  if (error.message && filterStrings.some(f => error.message.includes(Buffer.from(f, 'base64').toString()))) return;
  console.error('Uncaught Exception:', error);
  if (global.conn?.ws?.socket?.readyState === 1) {
    global.reloadHandler?.(true).catch(console.error);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  if (reason?.message?.includes?.('lid') || reason?.message?.includes?.('LID')) return;
  console.error('Unhandled Rejection:', reason);
});

let isInit = true;
let handler = await import('./handler.js');

global.reloadHandler = async function (restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
    if (Object.keys(Handler || {}).length) handler = Handler;
  } catch (e) {
    console.error(e);
  }
  if (restatConn) {
    const oldChats = global.conn.chats;
    try {
      global.conn.ws.close();
    } catch { }
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions, { chats: oldChats });
    store?.bind(conn);
    // Reinitialize lidResolver with the new connection
    lidResolver.conn = global.conn;
    isInit = true;
  }
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler);
    conn.ev.off('group-participants.update', conn.participantsUpdate);
    conn.ev.off('groups.update', conn.groupsUpdate);
    conn.ev.off('message.delete', conn.onDelete);
    conn.ev.off('call', conn.onCall);
    conn.ev.off('connection.update', conn.connectionUpdate);
    conn.ev.off('creds.update', conn.credsUpdate);
  }

  conn.welcome = '👋 Welcome!\n@user';
  conn.bye = '👋 Goodbye!\n@user';
  conn.spromote = '*[ ℹ️ ] @user was promoted to administrator.*';
  conn.sdemote = '*[ ℹ️ ] @user was demoted from administrator.*';
  conn.sDesc = '*[ ℹ️ ] The group description has been modified.*';
  conn.sSubject = '*[ ℹ️ ] The group name has been modified.*';
  conn.sIcon = '*[ ℹ️ ] The group profile picture has been changed.*';
  conn.sRevoke = '*[ ℹ️ ] The group invitation link has been reset.*';

  const originalHandler = handler.handler.bind(global.conn);
  // ENHANCED HANDLER with robust LID processing
  conn.handler = async function (chatUpdate) {
    try {
      if (chatUpdate.messages) {
        // DEBUG: Log to track processing
        //console.log(`🔄 Processing ${chatUpdate.messages.length} messages...`);
        
        // Intercept and process messages to resolve LIDs
        chatUpdate.messages = await interceptMessages(chatUpdate.messages, lidResolver);

        // Additional specific processing for LIDs in groups
        for (let i = 0; i < chatUpdate.messages.length; i++) {
          const message = chatUpdate.messages[i];
          
          if (message?.key?.remoteJid?.endsWith('@g.us')) {
            try {
              // Process full message once more to ensure everything is resolved
              const fullyProcessedMessage = await processMessageForDisplay(message, lidResolver);
              chatUpdate.messages[i] = fullyProcessedMessage;
              
              // DEBUG: Check if there are unresolved LID mentions
              const messageText = extractAllText(fullyProcessedMessage);
              if (messageText && messageText.includes('@') && /(@\d{8,20})/.test(messageText)) {
                const lidMatches = messageText.match(/@(\d{8,20})/g);
                if (lidMatches) {
                  //console.log(`⚠️ Possible unresolved LIDs: ${lidMatches.join(', ')}`);
                }
              }
            } catch (error) {
              console.error('❌ Error in final message processing:', error);
            }
          }
        }
      }
      
      return await originalHandler(chatUpdate);
    } catch (error) {
      console.error('❌ Error in handler interceptor:', error);
      return await originalHandler(chatUpdate);
    }
  };

  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
  conn.onDelete = handler.deleteUpdate.bind(global.conn);
  conn.onCall = handler.callUpdate.bind(global.conn);
  conn.connectionUpdate = connectionUpdate.bind(global.conn);
  conn.credsUpdate = saveCreds.bind(global.conn, true);

  const currentDateTime = new Date();
  const messageDateTime = new Date(conn.ev);
  if (currentDateTime >= messageDateTime) {
    const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0]);
  } else {
    const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0]);
  }

  conn.ev.on('messages.upsert', conn.handler);
  conn.ev.on('group-participants.update', conn.participantsUpdate);
  conn.ev.on('groups.update', conn.groupsUpdate);
  conn.ev.on('message.delete', conn.onDelete);
  conn.ev.on('call', conn.onCall);
  conn.ev.on('connection.update', conn.connectionUpdate);
  conn.ev.on('creds.update', conn.credsUpdate);
  isInit = false;
  return true;
};

// Add utility functions to conn for access from plugins
conn.lid = {
  /**
   * Get user information by LID
   */
  getUserInfo: (lidNumber) => lidDataManager.getUserInfo(lidNumber),
  
  /**
   * Get user information by JID
   */
  getUserInfoByJid: (jid) => lidDataManager.getUserInfoByJid(jid),
  
  /**
   * Find LID by JID
   */
  findLidByJid: (jid) => lidDataManager.findLidByJid(jid),
  
  /**
   * List all users
   */
  getAllUsers: () => lidDataManager.getAllUsers(),
  
  /**
   * Get statistics
   */
  getStats: () => lidDataManager.getStats(),
  
  /**
   * Get users by country
   */
  getUsersByCountry: () => lidDataManager.getUsersByCountry(),
  
  /**
   * Validate phone number
   */
  validatePhoneNumber: (phoneNumber) => {
    if (!lidResolver.phoneValidator) return false;
    return lidResolver.phoneValidator.isValidPhoneNumber(phoneNumber);
  },
  
  /**
   * Detect if an LID is a phone number
   */
  detectPhoneInLid: (lidString) => {
    if (!lidResolver.phoneValidator) return { isPhone: false };
    return lidResolver.phoneValidator.detectPhoneInLid(lidString);
  },
  
  /**
   * Force cache save
   */
  forceSave: () => {
    try {
      lidResolver.forceSave();
      return true;
    } catch (error) {
      console.error('Error saving LID cache:', error);
      return false;
    }
  },
  
  /**
   * Show full cache information
   */
  getCacheInfo: () => {
    try {
      const stats = lidDataManager.getStats();
      const analysis = lidResolver.analyzePhoneNumbers();
      
      return `📱 *LID CACHE STATISTICS*

📊 *General:*
• Total entries: ${stats.total}
• Valid entries: ${stats.valid}
• Not found: ${stats.notFound}
• With errors: ${stats.errors}

📞 *Phone numbers:*
• Detected: ${stats.phoneNumbers}
• Corrected: ${stats.corrected}
• Problematic: ${analysis.stats.phoneNumbersProblematic}

🗂️ *Cache:*
• File: ${stats.cacheFile}
• Exists: ${stats.fileExists ? 'Yes' : 'No'}

🌍 *Detected countries:*
${Object.entries(lidDataManager.getUsersByCountry())
  .slice(0, 5)
  .map(([country, users]) => `• ${country}: ${users.length} users`)
  .join('\n')}`;
    } catch (error) {
      return `❌ Error obtaining information: ${error.message}`;
    }
  },
  
  /**
   * Correct phone numbers automatically
   */
  forcePhoneCorrection: () => {
    try {
      const result = lidResolver.autoCorrectPhoneNumbers();
      
      if (result.corrected > 0) {
        return `✅ ${result.corrected} phone numbers were automatically corrected.`;
      } else {
        return '✅ No phone numbers requiring correction were found.';
      }
    } catch (error) {
      return `❌ Error in automatic correction: ${error.message}`;
    }
  },
  
  /**
   * Resolve LID manually
   */
  resolveLid: async (lidJid, groupChatId) => {
    try {
      return await lidResolver.resolveLid(lidJid, groupChatId);
    } catch (error) {
      console.error('Error resolving LID:', error);
      return lidJid;
    }
  },
  
  /**
   * Process text to resolve mentions (auxiliary function for plugins)
   */
  processTextMentions: async (text, groupId) => {
    try {
      return await processTextMentions(text, groupId, lidResolver);
    } catch (error) {
      console.error('Error processing mentions in text:', error);
      return text;
    }
  }
};

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'));
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename));
      const module = await import(file);
      global.plugins[filename] = module.default || module;
    } catch (e) {
      conn.logger.error(e);
      delete global.plugins[filename];
    }
  }
}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error);

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(` updated plugin - '${filename}'`);
      else {
        conn.logger.warn(`deleted plugin - '${filename}'`);
        return delete global.plugins[filename];
      }
    } else conn.logger.info(`new plugin - '${filename}'`);
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`);
    else {
      try {
        const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
        global.plugins[filename] = module.default || module;
      } catch (e) {
        conn.logger.error(`error require plugin '${filename}\n${format(e)}'`);
      } finally {
        global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)));
      }
    }
  }
};
Object.freeze(global.reload);
watch(pluginFolder, global.reload);
await global.reloadHandler();

setInterval(async () => {
  if (stopped === 'close' || !conn || !conn?.user) return;
  await clearTmp();
}, 180000);

setInterval(async () => {
  if (stopped === 'close' || !conn || !conn?.user) return;
  const _uptime = process.uptime() * 1000;
  const uptime = clockString(_uptime);
  const bio = `• Active: ${uptime} | Astrid-Bot-MD`;
  await conn?.updateProfileStatus(bio).catch((_) => _);
}, 60000);

// Clean and optimize LID cache every 30 minutes
setInterval(async () => {
  if (stopped === 'close' || !conn || !conn?.user || !lidResolver) return;
  
  try {
    const stats = lidDataManager.getStats();
    
    // If the cache has more than 800 entries, perform cleaning
    if (stats.total > 800) {
      // Delete old entries (more than 7 days) that have not been found
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;
      
      for (const [key, entry] of lidResolver.cache.entries()) {
        if (entry.timestamp < sevenDaysAgo && (entry.notFound || entry.error)) {
          lidResolver.cache.delete(key);
          if (entry.jid && lidResolver.jidToLidMap.has(entry.jid)) {
            lidResolver.jidToLidMap.delete(entry.jid);
          }
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        lidResolver.markDirty();
      }
    }
    
    // Run automatic correction occasionally
    if (Math.random() < 0.1) { // 10% probability
      const correctionResult = lidResolver.autoCorrectPhoneNumbers();
    }
  } catch (error) {
    console.error('❌ Error in LID cache cleaning:', error.message);
  }
}, 30 * 60 * 1000); // Every 30 minutes

function clockString(ms) {
  const d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [d, 'd ', h, 'h ', m, 'm ', s, 's '].map((v) => v.toString().padStart(2, 0)).join('');
}

// Improved process exit handling
const gracefulShutdown = () => {
  if (lidResolver?.isDirty) {
    try {
      lidResolver.forceSave();
    } catch (error) {
      console.error('❌ Error saving LID cache:', error.message);
    }
  }
};

process.on('exit', gracefulShutdown);

process.on('SIGINT', () => {
  gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  gracefulShutdown();
  process.exit(0);
});

// Handling of uncaught LID-related errors
process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.message && reason.message.includes('lid')) {
    console.error('❌ Uncaught LID-related error:', reason);
  }
});

async function _quickTest() {
  const test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version']),
  ].map((p) => {
    return Promise.race([
      new Promise((resolve) => {
        p.on('close', (code) => {
          resolve(code !== 127);
        });
      }),
      new Promise((resolve) => {
        p.on('error', (_) => resolve(false));
      })]);
  }));
  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
  global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find };
  Object.freeze(global.support);
}
