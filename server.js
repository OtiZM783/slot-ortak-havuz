const express = require('express');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());

let ortakHavuz = {};

// Oylama kaydetme
app.post('/oyla', (req, res) => {
    let { site, durum, cihazID } = req.body;
    if (site && durum) {
        if (!ortakHavuz[site]) ortakHavuz[site] = [];
        
        // Aynı cihaz daha önce oy verdiyse güncelle, yoksa ekle
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

// Eklenti için JSON listesi
app.get('/havuz-json', (req, res) => {
    let basitHavuz = {};
    for(let s in ortakHavuz) {
        // En son verilen kararı baz alalım
        let sonOy = ortakHavuz[s][ortakHavuz[s].length - 1];
        basitHavuz[s] = sonOy.durum;
    }
    res.json(basitHavuz);
});

// Renkli ve karşılaştırmalı Web Paneli
app.get('/', (req, res) => {
    let listeHTML = '';
    for (let site in ortakHavuz) {
        let oylar = ortakHavuz[site];
        let oylarBadge = oylar.map(o => `<span style="background:${o.durum === 'YARARLI' ? '#2e7d32' : '#c62828'}; padding:3px 6px; border-radius:4px; font-size:11px; margin-right:5px;">${o.cihaz}: ${o.durum}</span>`).join('');
        
        listeHTML += `<tr>
            <td style="padding:10px; border-bottom:1px solid #444;"><a href="${site}" target="_blank" style="color:#64B5F6; text-decoration:none;">${site}</a></td>
            <td style="padding:10px; border-bottom:1px solid #444;">${oylarBadge}</td>
        </tr>`;
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>Slot Bonus Avcısı - Ortak Karşılaştırma Paneli</title>
            <style>
                body { font-family: Arial, sans-serif; background: #121212; color: #fff; padding: 20px; }
                .container { max-width: 900px; margin: 0 auto; background: #1e1e1e; padding: 20px; border-radius: 8px; border: 1px solid #333; }
                h1 { color: #4CAF50; text-align: center; font-size: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 Cihazlar Arası Oy Karşılaştırma Paneli</h1>
                <p style="text-align:center; color:#888; font-size:12px;">Hangi sitenin kimler tarafından ne şekilde oylandığını buradan takip edebilirsin.</p>
                <table>
                    <tr>
                        <th style="text-align:left; padding:10px; border-bottom:2px solid #444;">Site Adresi</th>
                        <th style="text-align:left; padding:10px; border-bottom:2px solid #444;">Kim Ne Oy Verdi?</th>
                    </tr>
                    ${listeHTML || '<tr><td colspan="2" style="text-align:center; color:#777; padding:20px;">Henüz ortak oylama yapılmadı.</td></tr>'}
                </table>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu çalışıyor...`));
