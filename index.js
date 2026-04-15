const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

// ✅ Custom Replies (آپ یہاں اپنی مرضی سے بدل سکتے ہیں)
const BOT_NAME = "Zain AI";
const GREETING_MSG = "👋 السلام علیکم! میں Zain AI ہوں، آپ کی کیا مدد کر سکتا ہوں؟";
const DEFAULT_REPLY = "🤖 میں ابھی مصروف ہوں، بعد میں جواب دوں گا۔";

// Commands System
const commands = {
    "help": "📌 Available Commands:\n- help\n- about\n- time",
    "about": "🤖 یہ ایک WhatsApp AI Assistant ہے جو آٹو ریپلائی دیتا ہے۔",
    "time": () => `⏰ Current Time: ${new Date().toLocaleTimeString()}`
};

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState('session_data');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Zain", "AI", "1"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.clear();
            console.log('Scan QR Code:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') console.log('✅ BOT ONLINE!');
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();

        console.log(`📩 ${sender}: ${text}`);

        // ✅ Greeting
        if (text.includes("hi") || text.includes("hello") || text.includes("salam")) {
            await sock.sendMessage(sender, { text: GREETING_MSG });
            return;
        }

        // ✅ Commands System
        if (commands[text]) {
            const reply = typeof commands[text] === "function" ? commands[text]() : commands[text];
            await sock.sendMessage(sender, { text: reply });
            return;
        }

        // ✅ Default Reply
        await sock.sendMessage(sender, { text: DEFAULT_REPLY });
    });
}

startBot().catch(err => console.log(err));
