const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Verificar cookie
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // 2. Verificar header Authorization
    else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Por favor, faça login para acessar",
      });
    }

    // 3. Verificar token JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.uid) {
        return res.status(401).json({
          success: false,
          message: "Token inválido",
        });
      }

      // 4. Verificar usuário no Firestore
      const userDoc = await db.collection("users").doc(decoded.uid).get();

      if (!userDoc.exists) {
        return res.status(401).json({
          success: false,
          message: "Usuário não existe mais",
        });
      }

      // 5. Anexar usuário ao request
      req.user = {
        id: userDoc.id,
        ...userDoc.data(),
      };

      next();
    } catch (jwtError) {
      console.error("Erro ao verificar o token:", jwtError);
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Token inválido",
        });
      }
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expirado",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Falha na autenticação do token",
      });
    }
  } catch (error) {
    console.error("Erro no middleware:", error);
    res.status(500).json({
      success: false,
      message: "Erro na autenticação",
    });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Acesso não autorizado para seu perfil",
    });
  }
  next();
};