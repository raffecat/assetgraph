var vows = require('vows'),
    assert = require('assert'),
    _ = require('underscore'),
    AssetGraph = require('../lib/AssetGraph');

vows.describe('assets.JavaScript').addBatch({
    'After loading test case that has a parse error in an inline JavaScript asset': {
        topic: function () {
            var err,
                callback = this.callback;
            new AssetGraph({root: __dirname + '/JavaScript/'})
                .on('error', function (_err) {
                    err = _err;
                })
                .loadAssets('parseErrorInInlineJavaScript.html')
                .run(function () {
                    callback(err);
                });
        },
        'it should result in an Error object': function (err, assetGraph) {
            assert.instanceOf(err, Error);
        },
        'the error message should specify the url of the Html asset and the line number of the error': function (err, assetGraph) {
            assert.matches(err.message, /parseErrorInInlineJavaScript\.html/);
            assert.matches(err.message, /line 2\b/);
            assert.matches(err.message, /column 9\b/);
        }
    },
    'After loading test case that has a parse error in an external JavaScript asset': {
        topic: function () {
            var err,
                callback = this.callback;
            var assetGraph = new AssetGraph({root: __dirname + '/JavaScript/'})
                .on('error', function (_err) {
                    err = _err;
                })
                .loadAssets('parseErrorInExternalJavaScript.html')
                .populate()
                .run(function () {
                    callback(err);
                });
        },
        'it should result in an Error object': function (err, assetGraph) {
            assert.instanceOf(err, Error);
        },
        'the error message should specify the url of the external JavaScript asset and the line number of the error': function (err, assetGraph) {
            assert.matches(err.message, /parseError\.js/);
            assert.matches(err.message, /line 6\b/);
            assert.matches(err.message, /column 14\b/);
        }
    },
    'after loading test case with relations located at multiple levels in the parse tree': {
        topic: function () {
            new AssetGraph({root: __dirname + '/JavaScript/relationsDepthFirst/'})
                .loadAssets('index.html')
                .populate()
                .run(this.callback);
        },
        'the relations should be in depth-first order in the graph': function (assetGraph) {
            assert.deepEqual(_.pluck(assetGraph.findRelations({from: {type: 'JavaScript'}}), 'href'),
                             [
                                 'foo.js',
                                 'data.json',
                                 'bar.js'
                             ]);
        }
    }
})['export'](module);
