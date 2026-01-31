const express = require('express');
const router = express.Router();
const {
    createEnquiry,
    getEnquiries,
    updateEnquiryStatus,
    deleteEnquiry
} = require('../controllers/enquiryController');

router.route('/')
    .post(createEnquiry)
    .get(getEnquiries);

router.route('/:id')
    .put(updateEnquiryStatus)
    .delete(deleteEnquiry);

module.exports = router;
