# 🔐 Desi Pass Gen

> **Generate strong, memorable Hinglish passphrases — 100% client-side using the Web Crypto API.**

🌐 **Live Demo:** https://desipassgen.com

---

<p align="center">
  <img src="./public/og-image.png" alt="Desi Pass Gen Preview" width="100%">
</p>

---

## ✨ Features

- 🔒 100% client-side passphrase generation
- 🔐 Cryptographically secure randomness using `crypto.getRandomValues()`
- 🇮🇳 Curated 800-word Hinglish wordlist
- 🎲 Adjustable passphrase length (3–8 words)
- ➕ Optional numbers and symbols
- 📊 Real-time entropy estimation
- 🌙 Light & Dark themes
- 📋 One-click copy
- 📱 Fully responsive design
- 🚀 Open Source
- 🚫 No tracking
- 💾 No passphrase storage

---

## 🌍 Live Example

```text
Chai-Mast-Baarish-Yaar-Jugaad-42
```

---

# 🇮🇳 Why Desi Pass Gen?

Most password generators create strong but unreadable passwords like:

```text
Qx8!L#2@MnP
```

They're secure—but difficult to remember.

Desi Pass Gen generates memorable passphrases using familiar Hinglish words while maintaining strong cryptographic randomness.

The result is a passphrase that's significantly easier to remember without sacrificing security.

---

# 🔒 Core Principle: 100% Client-Side

This project has:

- ❌ No backend
- ❌ No database
- ❌ No accounts
- ❌ No analytics on generated passphrases
- ❌ No cloud processing

Everything happens entirely inside your browser.

Randomness comes from the Web Crypto API:

```ts
crypto.getRandomValues()
```


Nothing is ever:

- uploaded
- logged
- stored
- transmitted

You can verify this yourself:

1. Open Chrome DevTools.
2. Go to the **Network** tab.
3. Click **Generate**.

You'll see **zero network requests**.

---

# 🛡️ Security

Desi Pass Gen is designed around privacy.

- Uses the Web Crypto API
- No server-side generation
- No cookies for generated secrets
- No localStorage for passphrases
- Theme preference only is stored locally
- Open source and fully inspectable

---

# 📊 Entropy

Entropy is calculated using:

- Wordlist size
- Number of selected words
- Optional numbers
- Optional symbols

The calculator updates instantly as options change.

---

## How entropy is calculated

```
entropy (bits) = wordCount × log2(wordListLength)
               + (includeNumber ? log2(100) : 0)
               + (includeSymbol ? log2(symbolSetLength) : 0)
```

With the current 354-word list, each word contributes about 8.5 bits. See
[`/how-it-works`](src/pages/how-it-works.astro) for the full explanation.

# 📚 Wordlist

The word list (`src/data/wordlist.json`) is the product's core
differentiator. Contributions are welcome. A good entry should have:
single canonical spelling, 3-10 characters, no profanity/slurs/sensitive
terms, and a category of `food`, `people`, `emotion`, `action`, `nature`,
or `misc`.

---

# ⚙️ Tech Stack

- **Astro**
- **TypeScript**
- **Tailwind CSS v4**
- **Vitest**
- **Web Crypto API**

No backend.

No API.

No database.

Deploys as a fully static website.

---

# 📂 Project Structure

```text
/
├── src/
│
├── components/
│   └── GeneratorWidget.astro
│
├── data/
│   └── wordlist.json
│
├── layouts/
│   └── BaseLayout.astro
│
├── lib/
│   ├── generate.ts
│   └── generate.test.ts
│
├── pages/
│   ├── index.astro
│   ├── how-it-works.astro
│   └── faq.astro
│
├── styles/
│   └── global.css
│
└── package.json
```

---

# 🚀 Getting Started

Clone the repository.

```bash
git clone https://github.com/manuo9/desi-pass-gen.git
```

Install dependencies.

```bash
npm install
```

Run locally.

```bash
npm run dev
```

Open:

```text
http://localhost:4321
```

---

# 📦 Available Commands

| Command | Description |
|----------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build production site |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

---

# 🎯 Recommended Defaults

For most users:

- ✅ 6 words
- ✅ Random number enabled
- ✅ Symbols optional
- ✅ Sentence Case enabled

Use 7–8 words for:

- Password managers
- Device encryption
- Recovery phrases

---

## Tech Stack

- Astro
- TypeScript
- Tailwind CSS v4


## Contributing to the word list

The wordlist contains **800 carefully curated Hinglish words**, selected for familiarity, memorability, and ease of pronunciation. It is hand-curated—not scraped from a dictionary—to generate memorable, high-entropy passphrases.


# 🌐 Deployment

Desi Pass Gen is a fully static website.

Build it with:

```bash
npm run build
```

Deploy the generated `dist` folder to any static hosting provider.

Supported platforms include:

- Vercel ✅
- Cloudflare Pages
- Netlify
- GitHub Pages

No environment variables.

No backend configuration.

No server required.

---

# 🤝 Contributing

Issues, suggestions, and pull requests are welcome.

If you'd like to improve the wordlist, UI, accessibility, or documentation, feel free to contribute.

---

## License

MIT License

---

<p align="center">

Made with ❤️ for the Desi developer community.

**Strong. Memorable. Hinglish. Built for Desis. 🇮🇳**

</p>