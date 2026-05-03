<h1 align="center">Astrid</h1>

<p align="center">
  Community-maintained WhatsApp bot built on Node.js and Baileys.
</p>

<p align="center">
  <strong>Actively maintained project</strong><br />
  Astrid is being maintained and improved, with ongoing fixes, updates, and contributor support.
</p>

<p align="center">
  <a href="https://github.com/hoodDevs/Astrid/graphs/contributors">Contributors</a>
  ·
  <a href="https://github.com/hoodDevs/Astrid/issues">Issues</a>
  ·
  <a href="https://github.com/hoodDevs/Astrid/pulls">Pull Requests</a>
  ·
  <a href="https://github.com/hoodDevs/Astrid/commits">Commit Activity</a>
</p>

<p align="center">
  <a href="https://www.buymeacoffee.com/midknightmantra">
    <img alt="Support Astrid" src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000" />
  </a>
  <a href="https://api.whatsapp.com/send?phone=+254732722385&text=.menu">
    <img alt="Try Demo" src="https://img.shields.io/badge/Try%20Demo-25D366?style=for-the-badge&logo=whatsapp&logoColor=ffffff" />
  </a>
  <a href="https://github.com/hoodDevs/Astrid/issues/new?labels=Bug">
    <img alt="Report Bug" src="https://img.shields.io/badge/Report%20Bug-EA4335?style=for-the-badge&logo=github&logoColor=ffffff" />
  </a>
  <a href="https://github.com/hoodDevs/Astrid/issues/new?labels=Enhancement">
    <img alt="Request Feature" src="https://img.shields.io/badge/Request%20Feature-2563EB?style=for-the-badge&logo=github&logoColor=ffffff" />
  </a>
</p>

## Overview

Astrid is a modular WhatsApp bot with a large plugin set for utilities, media tools, games, moderation, downloads, AI commands, stickers, and English-language responses. The codebase is centered around:

- `index.js`: interactive boot flow and process supervisor
- `main.js`: connection setup, database wiring, plugin loading, and runtime behavior
- `plugins/`: command handlers and features
- `config.js`: bot metadata, owner numbers, language, and global settings

## Project Status

> [!NOTE]
> Astrid is actively maintained, and improvements and fixes are ongoing.

> [!IMPORTANT]
> This project is not affiliated with, endorsed by, or associated with WhatsApp or Meta.

What that means in practice:

- Some commands may stop working when third-party services or APIs change.
- Session/login issues can happen after WhatsApp protocol updates.
- Regular maintenance helps keep the project usable, but external service changes can still cause breakage.

## Requirements

Before running the bot locally, make sure you have:

- A current LTS version of Node.js and `npm`
- `ffmpeg`
- `ImageMagick`
- `webp` tools/libwebp
- A writable working directory for `AstridSession/` and `database.json`

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/hoodDevs/Astrid.git
cd Astrid
```

2. Install dependencies:

```bash
npm install
```

3. Start the bot:

```bash
npm start
```

On first launch, `index.js` will prompt you to choose one login method:

- `1` for QR login
- `2` for 8-digit pairing code login

Session data is stored in `AstridSession/`. Main bot data is stored in `database.json`.

## Run Modes

The scripts currently defined in `package.json` are:

```bash
npm start      # standard startup
npm run qr     # force QR-based startup
npm run code   # force pairing-code startup
```

If you want the bot to expose a QR image over HTTP for hosted environments, start it with:

```bash
node index.js --server
```

By default, the server listens on `PORT`, `SERVER_PORT`, or `3000`.

## Configuration

The main project-level settings live in `config.js`. That file currently controls things such as:

- Owner numbers
- Default language
- Branding strings and sticker metadata
- Session folder name
- API base URLs used by some commands

If you are self-hosting a fork, `config.js` is the first file you will likely customize.

## Data and Persistence

Astrid uses local JSON persistence out of the box:

- Auth/session files: `AstridSession/`
- Main database: `database.json`

`main.js` also supports a remote database URL through the `--db` runtime option, but the default behavior is local file storage.

If your session becomes invalid, the usual recovery path is to remove `AstridSession/` and log in again.

## Deployment

One-click deployment options included in this repository:

[![Deploy to Glitch](https://img.shields.io/badge/Deploy%20to%20Glitch-2800FF?style=for-the-badge&logo=glitch&logoColor=white)](https://glitch.com/edit/#!/import/github/hoodDevs/Astrid)
[![Deploy to Heroku](https://img.shields.io/badge/Deploy%20to%20Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white)](https://www.heroku.com/deploy?template=https://github.com/hoodDevs/Astrid)
[![Deploy to Koyeb](https://img.shields.io/badge/Deploy%20to%20Koyeb-121212?style=for-the-badge&logo=koyeb&logoColor=white)](https://app.koyeb.com/deploy?type=git&name=astrid&repository=https://github.com/hoodDevs/Astrid)
[![Deploy to Replit](https://img.shields.io/badge/Deploy%20to%20Replit-F26207?style=for-the-badge&logo=replit&logoColor=white)](https://repl.it/github/hoodDevs/Astrid)
[![Deploy to Render](https://img.shields.io/badge/Deploy%20to%20Render-46E3B7?style=for-the-badge&logo=render&logoColor=0A0A0A)](https://dashboard.render.com/blueprint/new?repo=https://github.com/hoodDevs/Astrid)

Repository deployment files already present:

- `Dockerfile`
- `Procfile`
- `render.yaml`
- `app.json`
- `replit.nix`

## Documentation

Additional docs already included in the repo:

- [English guide](src/docs/README_en.md)

## Community and Support

Official project/community links referenced in the codebase:

<p align="center">
  <a href="https://whatsapp.com/channel/0029Vaein6eInlqIsCXpDs3y">
    <img alt="WhatsApp Channel" src="https://img.shields.io/badge/WhatsApp%20Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=ffffff" />
  </a>
  <a href="https://github.com/hoodDevs/Astrid/issues">
    <img alt="GitHub Issues" src="https://img.shields.io/badge/GitHub%20Issues-F59E0B?style=for-the-badge&logo=github&logoColor=111827" />
  </a>
  <a href="https://github.com/hoodDevs/Astrid">
    <img alt="Repository" src="https://img.shields.io/badge/Repository-111827?style=for-the-badge&logo=github&logoColor=ffffff" />
  </a>
</p>

## Contributors

See the full [contributors graph](https://github.com/hoodDevs/Astrid/graphs/contributors).

## Lead Developer

<p align="center">
  <a href="https://github.com/hoodDevs">
    <img
      src="https://github.com/hoodDevs.png?size=180"
      alt="hoodDevs profile picture"
      width="180"
      style="border-radius: 50%;"
    />
  </a>
</p>

<p align="center">
  <a href="https://github.com/hoodDevs">hoodDevs</a>
</p>
