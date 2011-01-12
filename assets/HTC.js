/*global require, module*/
var util = require('util'),
    _ = require('underscore'),
    HTML = require('./HTML').HTML;

function HTC (config) {
    HTML.call(config);
};

util.inherits(HTC, HTML);

exports.HTC = HTC;