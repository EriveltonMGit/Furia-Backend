const { getGeminiResponse } = require("../utils/gemini")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require("uuid")

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`
    cb(null, uniqueFilename)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Apenas imagens são permitidas"))
    }
  },
}).fields([
  { name: "idDocument", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
])

exports.verifyIdentity = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      })
    }

    try {
      // Verificar se os arquivos foram enviados
      if (!req.files || !req.files.idDocument || !req.files.selfie) {
        return res.status(400).json({
          success: false,
          message: "Documento de identidade e selfie são obrigatórios",
        })
      }

      const idDocumentPath = req.files.idDocument[0].path
      const selfiePath = req.files.selfie[0].path

      // Ler os arquivos como base64
      const idDocumentBase64 = fs.readFileSync(idDocumentPath, { encoding: "base64" })
      const selfieBase64 = fs.readFileSync(selfiePath, { encoding: "base64" })

      // Verificar a identidade usando o Gemini
      const prompt = `Analise as duas imagens fornecidas:
      1. A primeira imagem é um documento de identidade oficial (RG, CNH ou passaporte).
      2. A segunda imagem é uma selfie tirada no momento.

      Verifique se:
      - As características faciais (rosto) correspondem entre as imagens
      - A pessoa na selfie parece ser a mesma do documento
      - Não há indícios de fraude ou manipulação nas imagens

      Retorne um JSON com a seguinte estrutura:
      {
        "match": boolean (true se houver correspondência),
        "confidence": number (0 a 1, nível de confiança),
        "reasons": string[] (razões para a decisão)
      }`

      // Obter resposta do Gemini
      const geminiResponse = await getGeminiResponse(prompt, [
        { mimeType: "image/jpeg", data: idDocumentBase64 },
        { mimeType: "image/jpeg", data: selfieBase64 },
      ])

      // Limpar arquivos temporários
      fs.unlinkSync(idDocumentPath)
      fs.unlinkSync(selfiePath)

      // Processar resposta
      try {
        const result = JSON.parse(geminiResponse)
        return res.status(200).json({
          success: true,
          faceVerified: result.match === true,
          confidence: result.confidence,
          reasons: result.reasons,
          message: result.match ? "Verificação concluída com sucesso" : "As faces não correspondem",
        })
      } catch (parseError) {
        // Se não conseguir parsear o JSON, tenta analisar o texto
        const isMatch =
          geminiResponse.toLowerCase().includes("correspondência") ||
          geminiResponse.toLowerCase().includes("match") ||
          geminiResponse.toLowerCase().includes("mesma pessoa")

        // Extrair pontuação de confiança se disponível
        let confidence = 0
        const confidenceMatch = geminiResponse.match(/(\d+\.\d+)/)
        if (confidenceMatch && confidenceMatch[1]) {
          confidence = Number.parseFloat(confidenceMatch[1])
        }

        return res.status(200).json({
          success: true,
          faceVerified: isMatch,
          confidence,
          message: isMatch ? "Verificação concluída com sucesso" : "As faces não correspondem",
        })
      }
    } catch (error) {
      console.error("Erro na verificação de identidade:", error)
      return res.status(500).json({
        success: false,
        message: "Erro ao processar a verificação de identidade",
      })
    }
  })
}
