const express = require('express');
const {
    getConfigsByType,
    getAllConfigs,
    createConfig,
    deleteConfig
} = require('../controllers/roomConfigController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllConfigs);
router.get('/:type', getConfigsByType);
router.post('/', protect, createConfig);
router.delete('/:id', protect, deleteConfig);

module.exports = router;
