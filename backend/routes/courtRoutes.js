const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');

router.get('/', courtController.getCourts);

module.exports = router;
