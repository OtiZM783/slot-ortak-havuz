const express = require('express');
const app = express();

// CORS hatası almamak için izin ekleyelim
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());

let ortakHavuz = {};

// Oyları kaydetme
app.post('/oyla', (req, res) => {
    let { site, durum } = req.body;
    if (site && durum) {
        ortakHavuz[site] = durum;
        res.json({ basarili: true, toplam: Object.keys(ortakHavuz).length });
    } else {
        res.status(400).json({ hata: "Eksik bilgi" });
    }
});

// Ortak havuzu görme
app.get('/havuz', (req, res) => {
    res.json(ortakHavuz);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor...`));