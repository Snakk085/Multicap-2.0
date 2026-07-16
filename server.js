const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./banco.sqlite', (err) => {
    if (err) console.error(err.message);
    console.log('Banco de dados conectado.');
});

// A tabela agora tem 'category' e 'date'
db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    desc TEXT,
    amount REAL,
    type TEXT,
    category TEXT,
    date TEXT
)`);

app.get('/api/transactions', (req, res) => {
    db.all('SELECT * FROM transactions ORDER BY date DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/transactions', (req, res) => {
    const { desc, amount, type, category, date } = req.body;
    db.run('INSERT INTO transactions (desc, amount, type, category, date) VALUES (?, ?, ?, ?, ?)', 
        [desc, amount, type, category, date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, desc, amount, type, category, date });
    });
});

app.delete('/api/transactions/:id', (req, res) => {
    db.run('DELETE FROM transactions WHERE id = ?', req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// process.env.PORT é fundamental para hospedar na internet
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`Servidor rodando na porta \${PORT}\`);
});