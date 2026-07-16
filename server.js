const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('Public')); // Entrega o seu site Front-end

// 1. Conexão com o Banco de Dados em Nuvem (PostgreSQL)
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_7n6bjWqCtSHT@ep-young-mountain-awolalo3-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

// 2. Cria a tabela (em Postgres, o Auto Incremento se chama SERIAL)
pool.query(`CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    "desc" TEXT,
    amount REAL,
    type TEXT,
    category TEXT,
    date TEXT
)`).then(() => console.log('Tabela verificada no PostgreSQL na nuvem.'))
  .catch(err => console.error('Erro ao criar tabela:', err));

// 3. Rota GET: Puxa os dados da Nuvem
app.get('/api/transactions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Rota POST: Salva novos dados na Nuvem
app.post('/api/transactions', async (req, res) => {
    const { desc, amount, type, category, date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions ("desc", amount, type, category, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [desc, amount, type, category, date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Rota DELETE: Apaga os dados
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Inicia o Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Full Stack rodando na porta ${PORT}`);
});