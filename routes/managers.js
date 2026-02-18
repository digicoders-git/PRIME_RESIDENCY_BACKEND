const express = require('express');
const {
    getManagers,
    getManager,
    createManager,
    updateManager,
    deleteManager,
    managerLogin
} = require('../controllers/managerController');

const router = express.Router();

// Login route
router.post('/login', managerLogin);

router
    .route('/')
    .get(getManagers)
    .post(createManager);

router
    .route('/:id')
    .get(getManager)
    .put(updateManager)
    .delete(deleteManager);

module.exports = router;
