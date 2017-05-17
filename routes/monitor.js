var express = require('express');
var router = express.Router();

var config = require('../config/main');
var extractor = require('../app/appMonitor');

extractor.setEnvironments(config.environments);

config.apps.forEach(function registerApp(app){
    extractor.registerApp(app.name, app.urls, require('../app/versionExtractor')(new RegExp(app.regex)));
});

extractor.start();

/* GET users listing. */
router.get('/', function(req, res) {
    res.render('monitor', {
        envs: extractor.getEnvironmetns(),
        apps: extractor.getSnapshot()
    });
});

module.exports = router;
