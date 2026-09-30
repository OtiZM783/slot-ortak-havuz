const express = require('express');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());

let ortakHavuz = {};

// Oylama kaydetme endpoint'i
app.post('/oyla', (req, res) => {
    let { site, durum, cihazID } = req.body;
    if (site && durum) {
        // Hangi siteden/cihazdan geldiğini de kaydedebiliriz
        ortakHavuz[site] = {
            durum: durum,
            zaman: new Date().toLocaleString('tr-TR'),
            cihaz: cihazID || "Bilinmeyen Cihaz"
        };
        res.json({ basarili: true, toplam: Object.keys(ortakHavuz).length });
    } else {
        res.status(400).json({ hata: "Eksik bilgi" });
    }
});

// JSON veri çekmek için
app.get('/havuz-json', (req, res) => {
    // Eski sistemle uyumlu olması için düz liste döndürelim
    let basitHavuz = {};
    for(let s in ortakHavuz) {
        basitHavuz[s] = ortakHavuz[s].durum;
    }
    res.json(basitHavuz);
});

// TARAYICIDAN AÇTIĞINDA ÇIKACAK ŞIK VE RENKLİ PANEL (HTML)
app.get('/', (req, res) => {
    let yararlilarHTML = '';
    let yararsizlarHTML = '';
    let yararliSayisi = 0;
    let yararsizSayisi = 0;

    for (let site in ortakHavuz) {
        let veri = ortakHavuz[site];
        let durumStr = (typeof veri === 'object') ? veri.durum : veri;
        let zamanStr = (typeof veri === 'object' && veri.zaman) ? veri.zaman : 'Eski Kayıt';

        let satir = `<tr>
            <td style="padding:10px; border-bottom:1px solid #444;"><a href="${site}" target="_blank" style="color:#64B5F6; text-decoration:none;">${site}</a></td>
            <td style="padding:10px; border-bottom:1px solid #444; color:#bbb; font-size:12px;">${zamanStr}</td>
        </tr>`;

        if (durumStr === "YARARLI") {
            yararlilarHTML += satir;
            yararliSayisi++;
        } else {
            yararsizlarHTML += satir;
            yararsizSayisi++;
        }
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>Slot Bonus Avcısı - Ortak Havuz Paneli</title>
            <style>
                body { font-family: Arial, sans-serif; background: #121212; color: #fff; margin: 0; padding: 20px; }
                .container { max-width: 1000px; margin: 0 auto; }
                h1 { text-align: center; color: #4CAF50; margin-bottom: 5px; }
                .stats { display: flex; justify-content: center; gap: 20px; margin-bottom: 30px; }
                .stat-box { background: #1e1e1e; padding: 15px 25px; border-radius: 8px; text-align: center; border: 1px solid #333; }
                .stat-box.green { border-color: #4CAF50; color: #4CAF50; }
                .stat-box.red { border-color: #f44336; color: #f44336; }
                .tables { display: flex; gap: 20px; }
                .table-container { flex: 1; background: #1e1e1e; border-radius: 8px; padding: 15px; border: 1px solid #333; }
                h2 { font-size: 16px; margin-top: 0; padding-bottom: 10px; border-bottom: 2px solid #333; }
                table { width: 100%; border-collapse: collapse; }
                .green-title { color: #4CAF50; }
                .red-title { color: #f44336; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 Slot Bonus Avcısı - Ortak Havuz Paneli</h1>
                <p style="text-align: center; color: #888; font-size: 13px;">Tüm cihazlardan gelen ortak oyların canlı karşılaştırma ve takip ekranı</p>
                
                <div class="stats">
                    <div class="stat-box green">
                        <div style="font-size: 24px; font-weight: bold;">${yararliSayisi}</div>
                        <div>Toplam Yararlı Site</div>
                    </div>
                    <div class="stat-box red">
                        <div style="font-size: 24px; font-weight: bold;">${yararsizSayisi}</div>
                        <div>Toplam Yararsız Site</div>
                    </div>
                </div>

                <div class="tables">
                    <div class="table-container">
                        <h2 class="green-title">✅ Yararlı Bulunanlar (${yararliSayisi})</h2>
                        <table>
                            ${yararlilarHTML || '<tr><td style="color:#77; padding:10px;">Henüz kayıt yok.</td></tr>'}
                        </table>
                    </div>
                    <div class="table-container">
                        <h2 class="red-title">❌ Yararsız Bulunanlar (${yararsizSayisi})</h2>
                        <table>
                            ${yararsizlarHTML || '<tr><td style="color:#77; padding:10px;">Henüz kayıt yok.</td></tr>'}
                        </table>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor...`));
