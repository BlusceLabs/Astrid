import os
import re

replacements = [
    ("Astrid-Bot-MD", "Astrid-Bot-MD"),
    ("astrid-bot-md", "astrid-bot-md"),
    ("Astrid-Bot", "Astrid-Bot"),
    ("Astrid - Bot", "Astrid - Bot"),
    ("Astrid Bot", "Astrid Bot"),
    ("Astrid Bot", "Astrid Bot"),
    ("AstridSession", "AstridSession"),
    ("AstridCoins", "AstridCoins"),
    ("ASTRID", "ASTRID")
]

# Order matters: more specific first.
# Added "The Mystic\nBot" -> "Astrid\nBot" for index.js
replacements.insert(0, ("The Mystic\nBot", "Astrid\nBot"))

# Mystic -> Astrid (when it refers to the bot or coins)
# I will use word boundary and check case.
mystic_to_astrid = [
    (re.compile(r'\bMystic\b'), "Astrid"),
    (re.compile(r'\bmystic\b'), "astrid"),
]

github_url_old = "github.com/hoodDevs/Astrid"
github_url_new = "github.com/hoodDevs/Astrid"

def apply_replacements(content):
    # Update command regex specifically as requested
    content = re.sub(r'/\^\(openai\|chatgpt\|ia\|mystic\|astridbot\)\$/i', r'/^(openai|chatgpt|ia|astrid|astridbot)$/i', content)
    
    # Apply fixed replacements
    for old, new in replacements:
        content = content.replace(old, new)
    
    # Apply github URL replacement specifically just in case
    content = content.replace(github_url_old, github_url_new)
    
    # Apply Mystic -> Astrid carefully
    # We want to avoid breaking things that aren't bot or coins, but mostly in this project "Mystic" refers to the bot.
    # The user said "when it refers to the bot or coins".
    # Looking at grep, most cases are bot or coins.
    
    # I'll do a simple replacement for now and then verify.
    # Actually, the user rules already covered many specific cases.
    # Let's see what's left for "Mystic".
    
    # For now, let's stick to the specific ones and then handle the generic "Mystic" -> "Astrid".
    content = re.sub(r'\bMystic\b', 'Astrid', content)
    content = re.sub(r'\bmystic\b', 'astrid', content)
    
    return content

files_to_process = [
    "./api.js",
    "./app.json",
    "./config.js",
    "./.github/FUNDING.yml",
    "./.gitignore",
    "./handler.js",
    "./index.js",
    "./main.js",
    "./package-lock.json",
    "./README.md",
    "./render.yaml",
    "./src/docs/README_en.md",
    "./src/JSON/chatgpt_indicciones.txt",
    "./src/libraries/simple.js",
    "./src/libraries/sticker.js",
    "./src/libraries/subBotManager.js",
    "./web/es.html",
    "./web/Guias/Linux/es.html",
    "./web/Guias/Linux/ingles.html",
    "./web/Guias/Termux/es.html",
    "./web/Guias/Termux/ingles.html",
    "./web/Guias/Utilidades/.bashrc",
    "./web/Guias/Utilidades/EXEcutable/Instalador.bat",
    "./web/Guias/Utilidades/EXEcutable/NSIS.nsi",
    "./web/Guias/Utilidades/astrid.sh",
    "./web/Guias/Utilidades/Termux.sh",
    "./web/Guias/Utilidades/update.sh",
    "./web/Guias/Wiki/es.html",
    "./web/Guias/Windows/es.html",
    "./web/Guias/Windows/ingles.html",
    "./web/ingles.html"
]

# Also search for all files in plugins/ because of the command regex request
for root, dirs, files in os.walk("./plugins"):
    for file in files:
        if file.endswith(".js"):
            files_to_process.append(os.path.join(root, file))

# Remove duplicates
files_to_process = list(set(files_to_process))

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = apply_replacements(content)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
