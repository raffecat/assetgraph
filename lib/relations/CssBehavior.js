/*global require, exports*/
var util = require('util'),
    _ = require('underscore'),
    passError = require('../util/passError'),
    query = require('../query'),
    Base = require('./Base');

function CssBehavior(config) {
    Base.call(this, config);
}

util.inherits(CssBehavior, Base);

_.extend(CssBehavior.prototype, {
    baseAssetQuery: {type: 'Html', url: query.isDefined},

    _getRawUrlString: function () {
        var matchUrl = this.cssRule.style[this.propertyName].match(/\burl\((\'|\"|)([^\'\"]+)\1\)|$/);
        if (matchUrl) {
            return matchUrl[2];
        }
        // Else return undefined
    },

    _setRawUrlString: function (url) {
        var cssUrlToken;
        // Quote if necessary:
        if (/^[a-z0-9\/\-_.]*$/i.test(url)) {
            cssUrlToken = "url(" + url + ")";
        } else {
            cssUrlToken = "url('" + url.replace(/([\'\"])/g, "\\$1") + "')";
        }
        this.cssRule.style[this.propertyName] = cssUrlToken;
    },

    remove: function () {
        this.cssRule.style.removeProperty(this.propertyName);
        delete this.cssRule;
    }
});

module.exports = CssBehavior;