// routes/user.routes.js
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase'); // Importe a sua conexão com o Firestore

// Rota para listar usuários (protegida para fins de exemplo, remova ou ajuste conforme necessário)
// Exemplo: Apenas usuários autenticados podem listar outros usuários
// router.get('/users', protect, async (req, res) => {
router.get('/users', async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
    }
});

module.exports = router;