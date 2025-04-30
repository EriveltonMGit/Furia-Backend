const express = require('express');
const router = express.Router();

// Exemplo de rota
router.get('/users', (req, res) => {
  res.send('Aqui estão os usuários!');
});

module.exports = router;
