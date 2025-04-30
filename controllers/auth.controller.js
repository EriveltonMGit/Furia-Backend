// controllers/auth.controller.js
const admin = require('firebase-admin');
const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");
const { generateToken } = require("../config/jwt");
const { validateEmail, validatePassword } = require("../utils/validation");

// Define opções de cookie

const cookieOptions = {
  expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
}
// Registrar um novo usuário
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Preencha todos os campos" })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Email inválido" })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        message: "Senha deve ter pelo menos 6 caracteres" 
      })
    }

    // Verificar se email já existe
    const emailSnapshot = await db.collection("users").where("email", "==", email).get()
    if (!emailSnapshot.empty) {
      return res.status(400).json({ success: false, message: "Email já cadastrado" })
    }

    // Criar usuário
    const hashedPassword = await bcrypt.hash(password, 10)
    const userRef = db.collection("users").doc()
    const now = new Date()

    await userRef.set({
      name,
      email,
      password: hashedPassword,
      role: "user",
      created_at: now,
      updated_at: now
    })

    // Gerar token JWT
    const token = generateToken(userRef.id)
    res.cookie("jwt", token, cookieOptions)

    res.status(201).json({
      success: true,
      message: "Usuário registrado com sucesso",
      user: { id: userRef.id, name, email }
    })

  } catch (error) {
    console.error("Erro no registro:", error)
    res.status(500).json({ 
      success: false, 
      message: "Erro ao registrar usuário",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}


// Login de usuário
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) validações
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email e senha são obrigatórios" });
    }

    // 2) busca usuário
    const snap = await db.collection("users").where("email", "==", email).limit(1).get();
    if (snap.empty) {
      return res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }
    const doc = snap.docs[0];
    const user = { id: doc.id, ...doc.data() };

    // 3) compara senha
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }

    // 4) gerar token e setar cookie
    const token = generateToken(user.id);
    res.cookie("jwt", token, cookieOptions);

    // 5) responder
    res.status(200).json({
      success: true,
      message: "Login realizado com sucesso",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ success: false, message: "Erro ao fazer login", error: error.message });
  }
};

// Obter usuário atual
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado" });
    }
    const { password, ...data } = doc.data();
    res.status(200).json({ success: true, user: { id: doc.id, ...data } });
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    res.status(500).json({ success: false, message: "Erro ao obter usuário atual", error: error.message });
  }
};

// Logout — limpa o cookie JWT
exports.logout = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.status(200).json({ success: true, message: "Logout realizado com sucesso" });
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    res.status(500).json({ success: false, message: "Erro ao fazer logout", error: error.message });
  }
};
exports.googleLogin = async (req, res) => {
  const { token } = req.body
  if (!token) {
    return res.status(400).json({ success: false, message: 'ID token é obrigatório' })
  }

  try {
    // 1. Verifica o ID token junto ao Firebase Admin SDK
    const decoded = await admin.auth().verifyIdToken(token)
    const { uid, email, name, picture } = decoded

    // 2. Procura usuário existente no Firestore
    let userDoc = await db.collection('users').doc(uid).get()

    // 3. Se não existe, cria um novo
    if (!userDoc.exists) {
      const now = new Date()
      await db.collection('users').doc(uid).set({
        name:     name || email,
        email,
        role:     'user',
        picture,           // opcional, avatar do Google
        created_at: now,
        updated_at: now
      })
      userDoc = await db.collection('users').doc(uid).get()
    }

    // 4. Gera o JWT do seu sistema
    const jwtToken = generateToken(uid)
    res.cookie('jwt', jwtToken, {
      expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24*60*60*1000),
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/'
    })

    // 5. Retorna a mesma carga de registro/login
    const data = userDoc.data()
    return res.json({
      success: true,
      message: 'Autenticado via Google com sucesso',
      user: {
        id:    userDoc.id,
        name:  data.name,
        email: data.email,
        role:  data.role,
        picture: data.picture
      }
    })

  } catch (err) {
    console.error('Erro no googleLogin:', err)
    return res.status(401).json({ success: false, message: 'Token Google inválido' })
  }
}