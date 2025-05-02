// verification.controller.js
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
        return res.status(400).json({ success: false, message: 'Envie o documento de identidade e a selfie.' });
      }

      const idDocumentFile = req.files.idDocument[0];
      const selfieFile = req.files.selfie[0];

      const prompt = "Verifique se a pessoa na selfie corresponde à foto no documento de identidade. Retorne apenas 'correspondência' ou 'não correspondência'.";

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
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase();

      let faceVerified = false;
      if (resultText?.includes("correspondência")) {
        faceVerified = true;
      }

      // Assumindo que você tem acesso ao ID do usuário através de req.user (se o middleware protect estiver funcionando)
      if (req.user && req.user.id) {
        // Atualize o documento do usuário no Firestore
        const userRef = db.collection('users').doc(req.user.id);
        await userRef.update({ faceVerified: faceVerified });
        return res.json({ success: true, faceVerified: faceVerified });
      } else {
        // Se não houver usuário autenticado, você precisará de outra forma de identificar o registro a ser atualizado
        console.warn("Usuário não autenticado ao verificar a identidade.");
        return res.status(401).json({ success: false, message: "Usuário não autenticado." });
      }

    } catch (error) {
      console.error("Erro ao chamar o Gemini:", error.response?.data || error.message);
      return res.status(500).json({ success: false, message: "Erro ao verificar identidade.", error: error.message });
    }
  }
];