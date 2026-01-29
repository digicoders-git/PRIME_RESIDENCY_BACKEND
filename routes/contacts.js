const express = require('express');
const {
    getContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact,
    updateContactStatus
} = require('../controllers/contactController');

const router = express.Router();

router
    .route('/')
    .get(getContacts)
    .post(createContact);

router
    .route('/:id')
    .get(getContact)
    .put(updateContact)
    .delete(deleteContact);

router
    .route('/:id/status')
    .put(updateContactStatus);

module.exports = router;
