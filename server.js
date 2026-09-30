const express = require('express');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());

let ortakHavuz = {};

app.post('/oyla', (req, res) => {
    let { site, durum, cihazID } = req.body;
    if (site && durum) {
        if (!ortakHavuz[site]) ortakHavuz[site] = [];
        let mevcutOy = ortakHavuz[site].find(o => o.cihaz === (cihazID || "Ortak"));
        if (mevcutOy) {
            mevcutOy.durum = durum;
            mevcutOy.zaman = new Date().toLocaleString('tr-TR');
        } else {
            ortakHavuz[site].push({
                durum: durum,
                cihaz: cihazID || "Anonim",
                zaman: new Date().toLocaleString('tr-TR')
            });
        }
        res.json({ basarili: true, toplam: Object.keys(ortakHavuz).length });
    } else {
        res.status(400).json({ hata: "Eksik bilgi" });
    }
});

app.get('/havuz-json', (req, res) => {
    let basitHavuz = {};
    for(let s in ortakHavuz) {
        let sonOy = ortakHavuz[s][ortakHavuz[s].length - 1];
        basitHavuz[s] = sonOy.durum;
    }
    res.json(basitHavuz);
});

// Yararlı siteleri direkt metin olarak indirme endpoint'i
app.get('/indir-yararlilar', (req, res) => {
    let yararliSiteler = [];
    for (let site in ortakHavuz) {
        let oylar = ortakHavuz[site];
        let sonOy = oylar[oylar.length - 1];
        if (sonOy.durum === "YARARLI") {
            yararliSiteler.push(site);
        }
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=yararli_siteler.txt');
    res.send(yararliSiteler.join('\n'));
});

app.get('/', (req, res) => {
    let listeHTML = '';
    for (let site in ortakHavuz) {
        let oylar = ortakHavuz[site];
        let oylarBadge = oylar.map(o => `
            <div style="background:${o.durum === 'YARARLI' ? '#1b5e20' : '#b71c1c'}; border:1px solid ${o.durum === 'YARARLI' ? '#4CAF50' : '#f44336'}; padding:6px 10px; border-radius:6px; display:inline-block; margin-right:8px; margin-bottom:5px; font-size:12px;">
                <b style="color:#ffeb3b;">${o.cihaz}</b>: ${o.durum} <span style="font-size:10px; color:#ddd; margin-left:5px;">(${o.zaman})</span>
            </div>
        `).join('');
        
        listeHTML += `<tr>
            <td style="padding:12px; border-bottom:1px solid #333;"><a href="${site}" target="_blank" style="color:#64B5F6; text-decoration:none; font-weight:bold;">${site}</a></td>
            <td style="padding:12px; border-bottom:1px solid #333;">${oylarBadge}</td>
        </tr>`;
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>Slot Bonus Avcısı - Karşılaştırma Paneli</title>
            <style>
                body { font-family: Arial, sans-serif; background: #121212; color: #fff; padding: 20px; }
                .container { max-width: 1000px; margin: 0 auto; background: #1e1e1e; padding: 25px; border-radius: 10px; border: 1px solid #333; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
                h1 { color: #4CAF50; text-align: center; font-size: 22px; margin-top: 0; }
                .btn { background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
                .btn:hover { background: #43a047; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 Cihazlar Arası Oy Karşılaştırma Paneli</h1>
                <p style="text-align:center; color:#888; font-size:13px; margin-bottom:20px;">Her kullanıcının değerlendirmeleri yan yana gruplandırılmıştır.</p>
                <div style="text-align: center;">
                    <a href="/indir-yararlilar" class="btn">📥 Yararlı Siteleri İndir (.txt)</a>
                </div>
                <table>
                    <tr>
                        <th style="text-align:left; padding:12px; border-bottom:2px solid #444; width:45%;">Site Adresi</th>
                        <th style="text-align:left; padding:12px; border-bottom:2px solid #444; width:55%;">Kullanıcı Değerlendirmeleri (Yan Yana)</th>
                    </tr>
                    ${listeHTML || '<tr><td colspan="2" style="text-align:center; color:#777; padding:30px;">Henüz ortak oylama yapılmadı.</td></tr>'}
                </table>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu çalışıyor...`));
