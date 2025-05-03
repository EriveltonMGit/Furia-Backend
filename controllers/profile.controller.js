const { db } = require("../config/firebase") // Alterado para usar Firebase

// Obter perfil completo do usuário
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id

    // Buscar todos os documentos relacionados ao usuário
    const [userDoc, profileDoc, interestsDoc, activitiesDoc, socialConnectionsDoc] = await Promise.all([
      db.collection("users").doc(userId).get(),
      db.collection("profiles").doc(userId).get(),
      db.collection("interests").doc(userId).get(),
      db.collection("activities").doc(userId).get(),
      db.collection("social_connections").doc(userId).get(),
    ])

    // Verificar se o usuário foi encontrado
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      })
    }

    // Obter os dados de cada documento
    const userData = userDoc.data()
    const { password, ...userWithoutPassword } = userData // Remover senha

    // Construir objeto de perfil completo
    const profileData = {
      user: {
        id: userId,
        ...userWithoutPassword,
      },
      profile: profileDoc.exists ? profileDoc.data() : null,
      interests: interestsDoc.exists
        ? {
            favoriteGames: interestsDoc.data().favorite_games || [],
            favoriteTeams: interestsDoc.data().favorite_teams || [],
            followedPlayers: interestsDoc.data().followed_players || [],
            preferredPlatforms: interestsDoc.data().preferred_platforms || [],
          }
        : null,
      activities: activitiesDoc.exists
        ? {
            eventsAttended: activitiesDoc.data().events_attended || [],
            purchasedMerchandise: activitiesDoc.data().purchased_merchandise || [],
            subscriptions: activitiesDoc.data().subscriptions || [],
            competitionsParticipated: activitiesDoc.data().competitions_participated || [],
          }
        : null,
      socialConnections: socialConnectionsDoc.exists
        ? {
            twitter: socialConnectionsDoc.data().twitter,
            instagram: socialConnectionsDoc.data().instagram,
            facebook: socialConnectionsDoc.data().facebook,
            discord: socialConnectionsDoc.data().discord,
            twitch: socialConnectionsDoc.data().twitch,
            steamProfile: socialConnectionsDoc.data().steam_profile,
            faceitProfile: socialConnectionsDoc.data().faceit_profile,
            hltv: socialConnectionsDoc.data().hltv,
            vlr: socialConnectionsDoc.data().vlr,
            otherProfiles: socialConnectionsDoc.data().other_profiles || [],
          }
        : null,
    }

    // Retornar resposta de sucesso
    res.status(200).json({
      success: true,
      profile: profileData,
    })
  } catch (error) {
    console.error("Erro ao obter perfil:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno ao obter perfil do usuário.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Atualizar informações pessoais
exports.updatePersonalInfo = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, cpf, birthDate, address, city, state, zipCode, phone } = req.body
    const now = new Date()

    // Usar uma transação para garantir consistência
    await db.runTransaction(async (transaction) => {
      // Atualizar nome do usuário se fornecido
      if (name !== undefined) {
        const userRef = db.collection("users").doc(userId)
        transaction.update(userRef, {
          name,
          updated_at: now,
        })
      }

      // Verificar se o perfil existe
      const profileRef = db.collection("profiles").doc(userId)
      const profileDoc = await transaction.get(profileRef)

      // Preparar os dados do perfil
      const profileData = {}

      if (cpf !== undefined) profileData.cpf = cpf
      if (birthDate !== undefined) profileData.birth_date = birthDate
      if (address !== undefined) profileData.address = address
      if (city !== undefined) profileData.city = city
      if (state !== undefined) profileData.state = state
      if (zipCode !== undefined) profileData.zip_code = zipCode
      if (phone !== undefined) profileData.phone = phone

      // Adicionar timestamp de atualização
      if (Object.keys(profileData).length > 0) {
        profileData.updated_at = now

        // Atualizar ou criar o perfil
        if (profileDoc.exists) {
          transaction.update(profileRef, profileData)
        } else {
          profileData.user_id = userId
          profileData.created_at = now
          profileData.verification_status = "pending"
          profileData.fan_level = "Beginner"
          profileData.fan_points = 0
          transaction.set(profileRef, profileData)
        }
      }
    })

    res.status(200).json({
      success: true,
      message: "Informações pessoais atualizadas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar informações pessoais:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar informações pessoais.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Atualizar interesses
exports.updateInterests = async (req, res) => {
  try {
    const userId = req.user.id
    const { favoriteGames, favoriteTeams, followedPlayers, preferredPlatforms } = req.body
    const now = new Date()

    // Verificar se os interesses existem
    const interestsRef = db.collection("interests").doc(userId)
    const interestsDoc = await interestsRef.get()

    // Preparar os dados para atualização
    const interestsData = {}

    if (favoriteGames !== undefined) interestsData.favorite_games = favoriteGames
    if (favoriteTeams !== undefined) interestsData.favorite_teams = favoriteTeams
    if (followedPlayers !== undefined) interestsData.followed_players = followedPlayers
    if (preferredPlatforms !== undefined) interestsData.preferred_platforms = preferredPlatforms

    // Adicionar timestamp de atualização
    if (Object.keys(interestsData).length > 0) {
      interestsData.updated_at = now

      // Atualizar ou criar os interesses
      if (interestsDoc.exists) {
        await interestsRef.update(interestsData)
      } else {
        interestsData.user_id = userId
        interestsData.created_at = now
        // Garantir que todos os campos existam
        if (favoriteGames === undefined) interestsData.favorite_games = []
        if (favoriteTeams === undefined) interestsData.favorite_teams = []
        if (followedPlayers === undefined) interestsData.followed_players = []
        if (preferredPlatforms === undefined) interestsData.preferred_platforms = []

        await interestsRef.set(interestsData)
      }
    }

    res.status(200).json({
      success: true,
      message: "Interesses atualizados com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar interesses:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar interesses.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Atualizar atividades
exports.updateActivities = async (req, res) => {
  try {
    const userId = req.user.id
    const { eventsAttended, purchasedMerchandise, subscriptions, competitionsParticipated } = req.body
    const now = new Date()

    // Verificar se as atividades existem
    const activitiesRef = db.collection("activities").doc(userId)
    const activitiesDoc = await activitiesRef.get()

    // Preparar os dados para atualização
    const activitiesData = {}

    if (eventsAttended !== undefined) activitiesData.events_attended = eventsAttended
    if (purchasedMerchandise !== undefined) activitiesData.purchased_merchandise = purchasedMerchandise
    if (subscriptions !== undefined) activitiesData.subscriptions = subscriptions
    if (competitionsParticipated !== undefined) activitiesData.competitions_participated = competitionsParticipated

    // Adicionar timestamp de atualização
    if (Object.keys(activitiesData).length > 0) {
      activitiesData.updated_at = now

      // Atualizar ou criar as atividades
      if (activitiesDoc.exists) {
        await activitiesRef.update(activitiesData)
      } else {
        activitiesData.user_id = userId
        activitiesData.created_at = now
        // Garantir que todos os campos existam
        if (eventsAttended === undefined) activitiesData.events_attended = []
        if (purchasedMerchandise === undefined) activitiesData.purchased_merchandise = []
        if (subscriptions === undefined) activitiesData.subscriptions = []
        if (competitionsParticipated === undefined) activitiesData.competitions_participated = []

        await activitiesRef.set(activitiesData)
      }
    }

    res.status(200).json({
      success: true,
      message: "Atividades atualizadas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar atividades:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar atividades.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Atualizar conexões sociais
exports.updateSocialConnections = async (req, res) => {
  try {
    const userId = req.user.id
    const { twitter, instagram, facebook, discord, twitch, steamProfile, faceitProfile, hltv, vlr, otherProfiles } =
      req.body
    const now = new Date()

    // Verificar se as conexões sociais existem
    const socialRef = db.collection("social_connections").doc(userId)
    const socialDoc = await socialRef.get()

    // Preparar os dados para atualização
    const socialData = {}

    if (twitter !== undefined) socialData.twitter = twitter
    if (instagram !== undefined) socialData.instagram = instagram
    if (facebook !== undefined) socialData.facebook = facebook
    if (discord !== undefined) socialData.discord = discord
    if (twitch !== undefined) socialData.twitch = twitch
    if (steamProfile !== undefined) socialData.steam_profile = steamProfile
    if (faceitProfile !== undefined) socialData.faceit_profile = faceitProfile
    if (hltv !== undefined) socialData.hltv = hltv
    if (vlr !== undefined) socialData.vlr = vlr
    if (otherProfiles !== undefined) socialData.other_profiles = otherProfiles

    // Adicionar timestamp de atualização
    if (Object.keys(socialData).length > 0) {
      socialData.updated_at = now

      // Atualizar ou criar as conexões sociais
      if (socialDoc.exists) {
        await socialRef.update(socialData)
      } else {
        socialData.user_id = userId
        socialData.created_at = now
        // Garantir valores padrão para campos booleanos
        if (twitter === undefined) socialData.twitter = false
        if (instagram === undefined) socialData.instagram = false
        if (facebook === undefined) socialData.facebook = false
        if (discord === undefined) socialData.discord = false
        if (twitch === undefined) socialData.twitch = false
        if (otherProfiles === undefined) socialData.other_profiles = []

        await socialRef.set(socialData)
      }
    }

    res.status(200).json({
      success: true,
      message: "Conexões sociais atualizadas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar conexões sociais:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar conexões sociais.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

// Atualizar status de verificação
exports.updateVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const { verificationStatus } = req.body
    const now = new Date()

    // Validar status de verificação
    const validStatuses = ["pending", "verified", "rejected"]
    if (!verificationStatus || !validStatuses.includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status de verificação inválido ou não fornecido.",
      })
    }

    // Verificar se o perfil existe
    const profileRef = db.collection("profiles").doc(userId)
    const profileDoc = await profileRef.get()

    if (!profileDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Perfil não encontrado para atualizar o status de verificação.",
      })
    }

    // Atualizar status de verificação
    await profileRef.update({
      verification_status: verificationStatus,
      updated_at: now,
    })

    res.status(200).json({
      success: true,
      message: "Status de verificação atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar status de verificação:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar status de verificação.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
z