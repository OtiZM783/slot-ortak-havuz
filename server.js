const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());

const DATA_FILE = path.join(__dirname, 'veriler.json');

let ortakHavuz = {};
try {
    if (fs.existsSync(DATA_FILE)) {
        const fileData = fs.readFileSync(DATA_FILE, 'utf8');
        ortakHavuz = JSON.parse(fileData);
        console.log("Kalıcı veriler diskten başarıyla yüklendi.");
    }
} catch (err) {
    console.log("Veri dosyası okunurken hata oluştu, boş havuz ile başlanıyor:", err);
    ortakHavuz = {};
}

function verileriKaydet() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(ortakHavuz, null, 2), 'utf8');
    } catch (err) {
        console.log("Veriler diske kaydedilirken hata oluştu:", err);
    }
}

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
        
        verileriKaydet();
        res.json({ basarili: true, toplam: Object.keys(ortakHavuz).length });
    } else {
        res.status(400).json({ hata: "Eksik bilgi" });
    }
});

app.get('/havuz-json', (req, res) => {
    let basitHavuz = {};
    for(let s in ortakHavuz) {
        let sonOy = ortakHavuz[s][ortakHavuz[s].length - 1];
        if (sonOy) basitHavuz[s] = sonOy.durum;
    }
    res.json(basitHavuz);
});

app.get('/indir-yararlilar', (req, res) => {
    let yararliSiteler = [];
    for (let site in ortakHavuz) {
        let oylar = ortakHavuz[site];
        let sonOy = oylar[oylar.length - 1];
        if (sonOy && sonOy.durum === "YARARLI") {
            yararliSiteler.push(site);
        }
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=yararli_siteler.txt');
    res.send(yararliSiteler.join('\n'));
});

app.get('/', (req, res) => {
    let toplamSite = Object.keys(ortakHavuz).length;
    let listeHTML = '';
    
    for (let site in ortakHavuz) {
        let oylar = ortakHavuz[site];
        let oylarBadge = oylar.map(o => {
            let bgStyle = 'background: rgba(76, 175, 80, 0.15); border: 1px solid #4CAF50; color: #81C784;';
            let icon = '✓';
            if (o.durum === 'YARARSIZ') {
                bgStyle = 'background: rgba(244, 67, 54, 0.15); border: 1px solid #F44336; color: #E57373;';
                icon = '✕';
            } else if (o.durum === 'BAKIMDA') {
                bgStyle = 'background: rgba(96, 125, 139, 0.15); border: 1px solid #78909C; color: #B0BEC5;';
                icon = '🔄';
            }

            return `
                <div style="${bgStyle} padding: 6px 10px; border-radius: 6px; display: inline-block; margin-right: 6px; margin-bottom: 6px; font-size: 11px; font-family: monospace;">
                    <b style="color: #fff;">${o.cihaz}</b>: ${icon} ${o.durum} <span style="font-size: 9px; opacity: 0.7; margin-left: 4px;">(${o.zaman})</span>
                </div>
            `;
        }).join('');
        
        listeHTML += `
            <tr style="transition: background 0.2s;">
                <td style="padding: 14px; border-bottom: 1px solid #2a2a2a; word-break: break-all;">
                    <a href="${site}" target="_blank" style="color: #64B5F6; text-decoration: none; font-weight: 500; font-size: 13px;">${site}</a>
                </td>
                <td style="padding: 14px; border-bottom: 1px solid #2a2a2a;">${oylarBadge}</td>
            </tr>
        `;
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Slot Bonus Avcısı - Ortak Havuz Paneli</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 25px; margin: 0; }
                .container { max-width: 1100px; margin: 0 auto; background: #161b22; padding: 30px; border-radius: 12px; border: 1px solid #30363d; box-shadow: 0 8px 24px rgba(0,0,0,0.6); }
                .header-flex { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 20px; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
                h1 { color: #58a6ff; font-size: 20px; margin: 0; display: flex; align-items: center; gap: 10px; }
                .badge-count { background: #21262d; border: 1px solid #30363d; color: #8b949e; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
                .btn { background: #238636; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s, transform 0.1s; border: 1px solid rgba(27,31,35,0.15); }
                .btn:hover { background: #2ea043; }
                .btn:active { transform: scale(0.98); }
                .table-wrapper { max-height: 650px; overflow-y: auto; border: 1px solid #30363d; border-radius: 8px; background: #0d1117; }
                table { width: 100%; border-collapse: collapse; text-align: left; }
                th { background: #161b22; color: #8b949e; padding: 12px 14px; font-size: 12px; border-bottom: 2px solid #30363d; position: sticky; top: 0; z-index: 10; }
                tr:hover { background: rgba(255,255,255,0.015); }
                .empty-state { text-align: center; color: #8b949e; padding: 50px; font-size: 14px; }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #0d1117; }
                ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #484f58; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header-flex">
                    <div>
                        <h1>🎯 Slot Bonus Avcısı - Ortak Havuz</h1>
                        <p style="color: #8b949e; font-size: 12px; margin: 5px 0 0 0;">Cihazlar arası anlık değerlendirme ve senkronizasyon paneli.</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="badge-count">Toplam Site: ${toplamSite}</span>
                        <a href="/indir-yararlilar" class="btn">📥 Yararlıları İndir (.txt)</a>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40%;">Site Adresi</th>
                                <th style="width: 60%;">Kullanıcı Değerlendirmeleri ve Zaman Damgaları</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listeHTML || '<tr><td colspan="2" class="empty-state">Henüz ortak oylama yapılmadı. Eklenti üzerinden oylama yapmaya başlayabilirsiniz.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor, tasarımı yenilendi ve kalıcı disk aktif!`));
