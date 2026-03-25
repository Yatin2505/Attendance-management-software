const express = require('express');
const router = express.Router();
const { testRouteHandler } = require('../controllers/testController');

router.get('/test', testRouteHandler);

module.exports = router;
