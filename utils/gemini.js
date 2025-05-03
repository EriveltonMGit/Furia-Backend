const { GoogleGenerativeAI } = require("@google/generative-ai")

// Inicializar a API do Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Obtém uma resposta do modelo Gemini
 * @param {string} prompt - O prompt para o modelo
 * @param {Array} images - Array de objetos com mimeType e data em base64
 * @returns {Promise<string>} - A resposta do modelo
 */
exports.getGeminiResponse = async (prompt, images = []) => {
  try {
    // Usar o modelo gemini-1.5-flash para melhor desempenho em análise de imagens
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Preparar as partes do conteúdo
    const parts = [{ text: prompt }]

    // Adicionar imagens se fornecidas
    if (images && images.length > 0) {
      for (const image of images) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        })
      }
    }

    // Gerar conteúdo
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    })

    // Retornar o texto da resposta
    return result.response.text()
  } catch (error) {
    console.error("Erro ao obter resposta do Gemini:", error)
    throw error
  }
}
