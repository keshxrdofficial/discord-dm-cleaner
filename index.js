// keshxrd - dm temizleyici
require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const readline = require('readline');

const bot = new Client({ checkUpdate: false });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

bot.on('ready', () => {
    console.log(`[keshxrd] ${bot.user.tag} hazir`);
    console.log('[keshxrd] konsoldan kullanici id gir dm temizlemek icin');
});

// Konsoldan input dinle
process.stdin.on('data', async (data) => {
    const input = data.toString().trim();
    if (!input || !bot.user) return;

    // ID olup olmadığını kontrol et (sadece sayılar)
    if (!/^\d+$/.test(input)) {
        console.log('[keshxrd] gecersiz id - sadece rakam gir');
        return;
    }

    console.log(`[keshxrd] ${input} id'li kullanici ile dm temizleniyor...`);

    try {
        // Kullanıcıyı bul
        const user = await bot.users.fetch(input).catch(() => null);
        if (!user) {
            console.log('[keshxrd] kullanici bulunamadi');
            return;
        }

        // DM kanalını aç
        const dmChannel = await user.createDM().catch(() => null);
        if (!dmChannel) {
            console.log('[keshxrd] dm kanali acılamadi');
            return;
        }

        console.log(`[keshxrd] ${user.tag} ile dm temizleniyor...`);

        // Temizleme işlemini başlat
        await temizle(dmChannel);

    } catch (error) {
        console.log(`[keshxrd] hata: ${error.message}`);
    }
});

bot.on('messageCreate', async (m) => {
    if (m.author.id !== bot.user.id || !m.content.startsWith('.')) return;

    const cmd = m.content.slice(1).toLowerCase();

    if (cmd === 'sil') {
        await m.delete().catch(() => { });
        await temizle(m.channel);
    }
});

async function temizle(kanal) {
    let silinen = 0;
    let batch = 0;
    let son = null;

    console.log(`[keshxrd] temizleniyor...`);

    while (true) {
        const opts = { limit: 100 };
        if (son) opts.before = son;

        const msj = await kanal.messages.fetch(opts);
        if (msj.size === 0) break;

        const benim = msj.filter(x => x.author.id === bot.user.id);

        for (const [_, x] of benim) {
            try {
                await x.delete();
                silinen++;
                batch++;
                if (batch >= 7) {
                    await bekle(3000);
                    batch = 0;
                }
            } catch (e) { }
        }

        son = msj.last().id;
        if (msj.size < 100) break;
    }

    console.log(`[keshxrd] ${silinen} mesaj silindi`);
    console.log('[keshxrd] yeni id gir veya ctrl+c ile cik');
}

const bekle = ms => new Promise(r => setTimeout(r, ms));

if (!process.env.TOKEN) {
    console.log('[keshxrd] token yok');
    process.exit(1);
}

bot.login(process.env.TOKEN);
