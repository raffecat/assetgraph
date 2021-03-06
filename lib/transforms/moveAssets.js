var urlTools = require('../util/urlTools');

module.exports = function (queryObj, newUrlFunctionOrString) {
    if (typeof newUrlFunctionOrString === 'undefined') {
        throw new Error("transforms.moveAssets: 'newUrlFunctionOrString' parameter is mandatory.");
    }
    return function moveAssets(assetGraph) {
        assetGraph.findAssets(queryObj).forEach(function (asset) {
            var newUrl = typeof newUrlFunctionOrString === 'function' ? newUrlFunctionOrString(asset, assetGraph) : String(newUrlFunctionOrString);
            if (newUrl) {
                // Keep the old file name, query string and fragment identifier if the new url ends in a slash:
                if (asset.url && /\/$/.test(newUrl)) {
                    var matchOldFileNameQueryStringAndFragmentIdentifier = asset.url.match(/[^\/]*(?:[\?#].*)?$/);
                    if (matchOldFileNameQueryStringAndFragmentIdentifier) {
                        newUrl += matchOldFileNameQueryStringAndFragmentIdentifier[0];
                    }
                }
                if (/^\//.test(newUrl)) {
                    newUrl = assetGraph.root + newUrl.replace(/^\//, "");
                } else {
                    newUrl = urlTools.resolveUrl(assetGraph.root, newUrl);
                }
                asset.url = newUrl;
            }
        });
    };
};
