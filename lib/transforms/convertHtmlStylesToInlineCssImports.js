var _ = require('underscore'),
    cssom = require('cssom-papandreou'),
    assets = require('../assets'),
    relations = require('../relations');

module.exports = function (queryObj) {
    return function convertHtmlStylesToInlineCssImports(assetGraph) {
        var addedInlineCssAssets = [],
            currentInlineCssAsset;
        assetGraph.findAssets(_.extend({type: 'Html'}, queryObj)).forEach(function (htmlAsset) {
            assetGraph.findRelations({type: 'HtmlStyle', from: htmlAsset}).forEach(function (htmlStyle) {
                if (!htmlStyle.to.url) {
                    // Skip already inline stylesheet.
                    currentInlineCssAsset = null;
                    return;
                }
                if (!currentInlineCssAsset || assetGraph.findRelations({from: currentInlineCssAsset}).length > 31) {
                    currentInlineCssAsset = new assets.Css({
                        isDirty: true,
                        parseTree: new cssom.CSSStyleSheet()
                    });
                    addedInlineCssAssets.push(currentInlineCssAsset);
                    assetGraph.addAsset(currentInlineCssAsset);
                    new relations.HtmlStyle({
                        to: currentInlineCssAsset
                    }).attach(htmlAsset, 'before', htmlStyle);
                }
                var cssImportRule = new cssom.CSSImportRule(),
                    mediaText = htmlStyle.node.getAttribute('media');
                if (mediaText) {
                    cssImportRule.media.mediaText = mediaText;
                }
                currentInlineCssAsset.parseTree.cssRules.push(cssImportRule);

                var cssImport = new relations.CssImport({
                    from: currentInlineCssAsset,
                    to: htmlStyle.to,
                    cssRule: cssImportRule
                });
                assetGraph.addRelation(cssImport, 'last');
                cssImport.refreshHref();
                htmlStyle.detach();
            });
        });
    };
};
