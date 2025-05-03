const multer = require('multer');
const axios = require('axios');
const { db } = require('../config/firebase'); 

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.verifyIdentity = [
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.idDocument || !req.files.selfie) {
        return res.status(400).json({ 
          success: false, 
          message: 'Envie o documento de identidade e a selfie.' 
        });
      }

      const idDocumentFile = req.files.idDocument[0];
      const selfieFile = req.files.selfie[0];

      // Verificar tipos de arquivo
      const validImageTypes = ['image/jpeg', 'image/png'];
      if (!validImageTypes.includes(idDocumentFile.mimetype) || 
          !validImageTypes.includes(selfieFile.mimetype)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Apenas imagens JPEG e PNG são permitidas.' 
        });
      }

      // Verificar tamanho dos arquivos (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (idDocumentFile.size > maxSize || selfieFile.size > maxSize) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cada arquivo deve ter no máximo 5MB.' 
        });
      }

      // Prompt melhorado para o Gemini
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
      }`;

      const requestData = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: idDocumentFile.mimetype,
                  data: idDocumentFile.buffer.toString("base64")
                }
              },
              {
                inline_data: {
                  mime_type: selfieFile.mimetype,
                  data: selfieFile.buffer.toString("base64")
                }
              }
            ]
          }
        ]
      };

      const { data } = await axios.post(GEMINI_API_URL, requestData);
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      try {
        // Tentar parsear o JSON retornado pelo Gemini
        const result = JSON.parse(resultText);
        const faceVerified = result.match === true;

        // Atualizar no Firestore se o usuário estiver autenticado
        if (req.user && req.user.id) {
          await db.collection('users').doc(req.user.id).update({ 
            faceVerified,
            verificationDate: new Date()
          });
        }

        return res.json({ 
          success: true, 
          faceVerified,
          confidence: result.confidence,
          reasons: result.reasons
        });
      } catch (e) {
        console.error("Erro ao parsear resposta do Gemini:", e);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao processar a verificação." 
        });
      }

    } catch (error) {
      console.error("Erro ao verificar identidade:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao verificar identidade.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
];