const express = require("express")
const router = express.Router()
const verificationController = require("../controllers/verification.controller")
const { protect } = require("../middleware/auth.middleware")

// Rota para verificar a identidade - agora sem proteção obrigatória
router.post("/verify-identity", verificationController.verifyIdentity)

// Rota GET para instruir sobre o uso (opcional)
router.get("/verify-identity", (req, res) => {
  res.send(
    'Esta rota é para verificar a identidade. Use o método POST com os campos "idDocument" e "selfie" no formato multipart/form-data. A autenticação é opcional.',
  )
})

module.exports = router
