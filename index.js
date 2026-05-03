import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { setupMaster, fork } from 'cluster';
import cfonts from 'cfonts';
import readline from 'readline';
import yargs from 'yargs';
import chalk from 'chalk'; 
import fs from 'fs'; 
import './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { say } = cfonts;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let isRunning = false;
let childProcess = null;

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

console.log(chalk.yellow.bold('—◉ㅤStarting system...'));

function verifyOrCreateAuthFolder() {
  const authPath = join(__dirname, global.authFile);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }
}

function verifyCredsJson() {
  const credsPath = join(__dirname, global.authFile, 'creds.json');
  return fs.existsSync(credsPath);
}

function formatPhoneNumber(number) {
  let formattedNumber = number.replace(/[^\d+]/g, '');
  if (formattedNumber.startsWith('+52') && !formattedNumber.startsWith('+521')) {
    formattedNumber = formattedNumber.replace('+52', '+521');
  } else if (formattedNumber.startsWith('52') && !formattedNumber.startsWith('521')) {
    formattedNumber = `+521${formattedNumber.slice(2)}`;
  } else if (formattedNumber.startsWith('52') && formattedNumber.length >= 12) {
    formattedNumber = `+${formattedNumber}`;
  } else if (!formattedNumber.startsWith('+')) {
    formattedNumber = `+${formattedNumber}`;
  }
  return formattedNumber;
}

function isValidNumber(phoneNumber) {
  const regex = /^\+\d{7,15}$/;
  return regex.test(phoneNumber);
}

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  say('The Astrid\nBot', {
    font: 'chrome',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  say(`Bot created by hoodDevs`, {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  verifyOrCreateAuthFolder();

  if (verifyCredsJson()) {
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }

  const option = await question(chalk.yellowBright.bold('—◉ㅤSelect an option (number only):\n') + chalk.white.bold('1. Using QR code\n2. Using 8-digit text code\n—> '));

  if (option === '2') {
    const phoneNumber = await question(chalk.yellowBright.bold('\n—◉ㅤEnter your WhatsApp number:\n') + chalk.white.bold('◉ㅤExample: +5219992095479\n—> '));
    const numeroTelefono = formatPhoneNumber(phoneNumber);
    
    if (!isValidNumber(numeroTelefono)) {
      console.log(chalk.bgRed(chalk.white.bold('[ ERROR ] Invalid number. Ensure you have entered your number in international format starting with the country code.\n—◉ㅤExample:\n◉ +5219992095479\n')));
      process.exit(0);
    }
    
    process.argv.push('--phone=' + numeroTelefono);
    process.argv.push('--method=code');
  } else if (option === '1') {
    process.argv.push('--method=qr');
  }
  
  const args = [join(__dirname, file), ...process.argv.slice(2)];
  setupMaster({ exec: args[0], args: args.slice(1) });
  forkProcess(file);
}

function forkProcess(file) {
  childProcess = fork();

  childProcess.on('message', (data) => {
    console.log(chalk.green.bold('—◉ㅤRECEIVED:'), data);
    switch (data) {
      case 'reset':
        console.log(chalk.yellow.bold('—◉ㅤReset request received...'));
        childProcess.removeAllListeners();
        childProcess.kill('SIGTERM');
        isRunning = false;
        setTimeout(() => start(file), 1000);
        break;
      case 'uptime':
        childProcess.send(process.uptime());
        break;
    }
  });

  childProcess.on('exit', (code, signal) => {
    console.log(chalk.yellow.bold(`—◉ㅤSecondary process terminated (${code || signal})`));
    isRunning = false;
    childProcess = null;
    
    if (code !== 0 || signal === 'SIGTERM') {
      console.log(chalk.yellow.bold('—◉ㅤRestarting process...'));
      setTimeout(() => start(file), 1000);
    }
  });

  const opts = yargs(process.argv.slice(2)).argv;
  if (!opts.test) {
    rl.on('line', (line) => {
      childProcess.emit('message', line.trim());
    });
  }
}

try {
  start('main.js');
} catch (error) {
  console.error(chalk.red.bold('[ ERROR CRÍTICO ]:'), error);
  process.exit(1);
}
