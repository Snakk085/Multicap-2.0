const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('Public'));

// 1. Configuração do Banco de Dados (PostgreSQL)
// NÃO ESQUEÇA DE TROCAR A URL ABAIXO PELA SUA DO NEON!
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_7n6bjWqCtSHT@ep-young-mountain-awolalo3-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

// 2. Rotas de Usuário (Registro e Login)
const saltRounds = 10;

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        res.status(201).json({ message: "Usuário criado!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao criar usuário (nome já existe)." });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: "Usuário não encontrado." });
        
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            res.json({ message: "Login realizado!", userId: user.id });
        } else {
            res.status(401).json({ error: "Senha incorreta." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Rotas de Transações (AGORA COM FILTRO DE USUÁRIO)

// Busca apenas as transações do usuário logado
app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Salva transação já vinculada ao usuário
app.post('/api/transactions', async (req, res) => {
    const { desc, amount, type, category, date, userId } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions ("desc", amount, type, category, date, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [desc, amount, type, category, date, userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});