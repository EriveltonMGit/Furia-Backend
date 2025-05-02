// config/jwt.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'furia_secret_key_mais_segura_aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRE || '7d';

const generateToken = (uid) => {
    return jwt.sign({ uid }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error("Erro na verificação do token:", error);
        throw error;
    }
};

module.exports = {
    generateToken,
    verifyToken
};