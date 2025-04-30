const { db } = require("../config/firebase") // Alterado para usar Firebase
const bcrypt = require("bcryptjs")
const { validatePassword, validateEmail } = require("../utils/validation")

// Atualizar senha
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id
    const { currentPassword, newPassword } = req.body
    const now = new Date()

    // Validar campos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Por favor, forneça a senha atual e a nova senha",
      })
    }

    // Validar nova senha
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "A nova senha deve ter pelo menos 8 caracteres, incluindo letras e números",
      })
    }

    // Buscar usuário pelo ID
    const userRef = db.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      })
    }

    const userData = userDoc.data()

    // Verificar senha atual
    const isMatch = await bcrypt.compare(currentPassword, userData.password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Senha atual incorreta",
      })
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Atualizar senha
    await userRef.update({
      password: hashedPassword,
      updated_at: now,
    })

    // Retornar resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Senha atualizada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar senha:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar senha",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Atualizar email
exports.updateEmail = async (req, res) => {
  try {
    const userId = req.user.id
    const { email, password } = req.body
    const now = new Date()

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor, forneça o email e a senha",
      })
    }

    // Validar email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email inválido",
      })
    }

    // Verificar se o email já está em uso
    const emailSnapshot = await db.collection("users").where("email", "==", email).get()

    if (!emailSnapshot.empty) {
      // Verificar se o documento encontrado não é do usuário atual
      const existingUser = emailSnapshot.docs[0]
      if (existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Este email já está em uso",
        })
      }
    }

    // Buscar usuário pelo ID
    const userRef = db.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      })
    }

    const userData = userDoc.data()

    // Verificar senha
    const isMatch = await bcrypt.compare(password, userData.password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Senha incorreta",
      })
    }

    // Atualizar email
    await userRef.update({
      email: email,
      updated_at: now,
    })

    // Retornar resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Email atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar email:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Excluir conta
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id
    const { password } = req.body

    // Validar campos
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Por favor, forneça a senha",
      })
    }

    // Buscar usuário pelo ID
    const userRef = db.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      })
    }

    const userData = userDoc.data()

    // Verificar senha
    const isMatch = await bcrypt.compare(password, userData.password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Senha incorreta",
      })
    }

    // Usar uma transação para excluir todos os documentos relacionados ao usuário
    await db.runTransaction(async (transaction) => {
      // Excluir perfil
      transaction.delete(db.collection("profiles").doc(userId))

      // Excluir interesses
      transaction.delete(db.collection("interests").doc(userId))

      // Excluir atividades
      transaction.delete(db.collection("activities").doc(userId))

      // Excluir conexões sociais
      transaction.delete(db.collection("social_connections").doc(userId))

      // Excluir usuário por último
      transaction.delete(userRef)
    })

    // Retornar resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Conta excluída com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir conta:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao excluir conta",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
