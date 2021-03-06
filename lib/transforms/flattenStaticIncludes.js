var _ = require('underscore'),
    relations = require('../relations');

module.exports = function (queryObj) {
    return function flattenStaticIncludes(assetGraph) {
        assetGraph.findAssets(_.extend({type: 'Html'}, queryObj)).forEach(function (initialAsset) {
            var addedAssetsById = {}; // Only add one <link rel='stylesheet'> / <script> per asset.
            assetGraph.findRelations({from: initialAsset, type: ['HtmlScript', 'HtmlRequireJsMain']}).forEach(function (htmlScriptRelation) {
                var existingHtmlStyleRelations = assetGraph.findRelations({type: 'HtmlStyle', from: initialAsset}, true), // includeUnpopulated
                    pathByAssetId = {},
                    htmlStyleInsertionPoint,
                    htmlScriptInsertionPoint;
                if (existingHtmlStyleRelations.length > 0) {
                    htmlStyleInsertionPoint = existingHtmlStyleRelations[existingHtmlStyleRelations.length - 1];
                }

                function processRelation(relation, isAmd) {
                    if (!(relation.to.id in addedAssetsById)) {
                        if (relation.to.type === 'Css' && relation.type === 'JavaScriptOneInclude') {
                            var newHtmlStyle = new relations.HtmlStyle({to: relation.to});
                            if (htmlStyleInsertionPoint) {
                                newHtmlStyle.attach(initialAsset, 'after', htmlStyleInsertionPoint);
                            } else {
                                newHtmlStyle.attach(initialAsset, 'first');
                            }
                            htmlStyleInsertionPoint = newHtmlStyle;
                        } else if (relation.to.type === 'JavaScript' && !isAmd) {
                            var newHtmlScript = new relations.HtmlScript({to: relation.to});
                            if (htmlScriptInsertionPoint) {
                                newHtmlScript.attach(initialAsset, 'after', htmlScriptInsertionPoint);
                            } else {
                                // The RequireJS loader must come before the scripts that use it:
                                newHtmlScript.attach(initialAsset, htmlScriptRelation.type === 'HtmlRequireJsMain' ? 'after' : 'before', htmlScriptRelation);
                            }
                            htmlScriptInsertionPoint = newHtmlScript;
                        }
                        addedAssetsById[relation.to.id] = true;
                    }
                }

                (function traversePostorder(asset, parentIsAmd) {
                    pathByAssetId[asset.id] = true;
                    assetGraph.findRelations({from: asset, type: ['JavaScriptOneInclude', 'JavaScriptExtJsRequire', 'JavaScriptAmdRequire', 'JavaScriptAmdDefine']}).forEach(function (relation) {
                        var isAmd = parentIsAmd || /^JavaScriptAmd/.test(relation.type);
                        if (relation.to.id in pathByAssetId) {
                            console.warn("transforms.flattenStaticIncludes: Cycle detected: " + relation);
                        } else {
                            traversePostorder(relation.to, isAmd);
                            processRelation(relation, isAmd);
                            if (asset === htmlScriptRelation.to && relation.type === 'JavaScriptOneInclude') {
                                relation.detach();
                            } else {
                                relation.remove();
                            }
                        }
                    });
                    delete pathByAssetId[asset.id];
                }(htmlScriptRelation.to));
            });
        });
    };
};
