var URL = require('url'),
    Path = require('path'),
    glob = require('glob'),
    passError = require('passerror'),
    _ = require('underscore'),
    urlTools = {};

urlTools.buildRelativeUrl = function buildRelativeUrl(fromUrl, toUrl) {
    var minLength = Math.min(fromUrl.length, toUrl.length),
        commonPrefixLength = 0;
    while (commonPrefixLength < minLength && fromUrl[commonPrefixLength] === toUrl[commonPrefixLength]) {
        commonPrefixLength += 1;
    }
    var commonPrefix = fromUrl.substr(0, commonPrefixLength),
        commonPrefixMatch = commonPrefix.match(/^(file:\/\/|[^:]+:\/\/[^\/]+\/)/);

    if (commonPrefixMatch) {
        var fromFragments = fromUrl.substr(commonPrefixMatch[1].length).replace(/^\/+/, "").replace(/[^\/]+$/, "").split(/\//),
            toFragments = toUrl.substr(commonPrefixMatch[1].length).replace(/^\/+/, "").split(/\//);

        fromFragments.pop();

        var i = 0;
        while (i < fromFragments.length && i < toFragments.length && fromFragments[i] === toFragments[i]) {
            i += 1;
        }
        var relativeUrl = toFragments.slice(i).join("/");
        while (i < fromFragments.length) {
            relativeUrl = '../' + relativeUrl;
            i += 1;
        }
        return relativeUrl;
    } else {
        return toUrl; // No dice
    }
};

urlTools.ensureTrailingSlash = function ensureTrailingSlash(str) { // url or path
    return (str.lastIndexOf("/") + 1 === str.length) ? str : str + '/';
};

urlTools.fileUrlToFsPath = function fileUrlToFsPath(fileUrl) {
    fileUrl = fileUrl.replace(/[?#].*$/, ''); // Strip query string and fragment identifier
    return decodeURI(fileUrl).substr((process.platform === 'win32' ? "file:///" : 'file://').length).replace(/[#\?].*$/, '');
};

urlTools.fsFilePathToFileUrl = function fsFilePathToFileUrl(fsFilePath) {
    if (fsFilePath[0] === '/') {
        return "file://" + encodeURI(fsFilePath);
    } else {
        // Interpret as relative to the current working dir
        fsFilePath = Path.resolve(process.cwd(), fsFilePath);
        if (process.platform === 'win32') {
            return 'file:///' + encodeURI(fsFilePath.replace(/\\/g, '/'));
        } else {
            return 'file://' + encodeURI(fsFilePath);
        }
    }
};

// Wrapper around fsFilePathToFileUrl that makes sure that the resulting file: url ends in a slash.
// URL.resolve misbehaves if they don't (how would it know to do otherwise?)
urlTools.fsDirToFileUrl = function fsDirToFileUrl(fsDir) {
    var url = urlTools.fsFilePathToFileUrl(fsDir);
    return /\/$/.test(url) ? url : url + '/';
};

urlTools.makeFileUrlMatcher = function makeFileUrlMatcher() { // ...
    var matchers = _.flatten(arguments).map(function (fsPattern) {
        if (!/^\//.test(fsPattern)) {
            fsPattern = Path.join(process.cwd(), fsPattern);
        }
        return function (url) {
            return /^file:/.test(url) && glob.fnmatch(fsPattern, urlTools.fileUrlToFsPath(url));
        };
    });
    if (matchers.length === 1) {
        return matchers[0];
    } else {
        return function (url) {
            for (var i = 0 ; i < matchers.length ; i += 1) {
                if (matchers[i](url)) {
                    return true;
                }
            }
            return false;
        };
    }
};

urlTools.parse = URL.parse;

var protocolRe = /^([a-z0-9]+:)/i;

urlTools.resolveUrl = function (sourceUrl, relativeUrl) {
    // As of 90802d6 node's URL.resolve normalizes the resolved url so e.g. "ext:Ext Base" gets
    // mangled to "ext:ext". Until a better solution is found, only use URL.resolve to resolve URLs
    // that don't have a protocol:
    if (!protocolRe.test(relativeUrl)) {
        return URL.resolve(sourceUrl, relativeUrl);
    } else {
        return relativeUrl;
    }
};

_.extend(exports, urlTools);
