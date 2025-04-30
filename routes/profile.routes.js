const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');

// Rotas de perfil
router.get('/', protect, profileController.getProfile);
router.put('/personal-info', protect, profileController.updatePersonalInfo);
router.put('/interests', protect, profileController.updateInterests);
router.put('/activities', protect, profileController.updateActivities);
router.put('/social-connections', protect, profileController.updateSocialConnections);

module.exports = router;