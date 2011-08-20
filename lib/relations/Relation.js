/*global exports, require*/
var _ = require('underscore'),
    extendWithGettersAndSetters = require('../util/extendWithGettersAndSetters'),
    urlTools = require('../util/urlTools'),
    uniqueId = require('../util/uniqueId'),
    query = require('../query');

/**
 * @class Relation
 *
 * new Relation(options)
 * =====================
 *
 * Create a new Relation instance. Note that this class should be
 * considered abstract. You should instantiate the appropriate
 * subclass.
 *
 * Options:
 *
 *  - `from` The source asset of the relation.
 *  - `to`   The target asset of the relation, or an asset configuration
 *           object if the target asset hasn't yet been resolved and created.
 */
function Relation(config) {
    _.extend(this, config);
    this.id = uniqueId();
}

Relation.prototype = {
    /**
     * relation.from (Asset)
     * =====================
     *
     * The source asset of the relation.
     */

    /**
     * relation.to (Asset or asset config object)
     * ==========================================
     *
     * The target asset of the relation.
     */

    /**
     * relation.href (getter/setter)
     * =============================
     *
     * Get or set the href of the relation. The relation must be
     * attached to an asset.
     *
     * What is actually retrieved or updated depends on the relation
     * type. For `HtmlImage` the `src` attribute of the HTML element
     * is changed, for `CssImport` the parsed representation of
     * the @import rule is updated, etc.
     *
     * Most of the time you don't need to think about this property,
     * as the href is automatically updated when the url of the source
     * or target asset is changed, or an intermediate asset is
     * inlined.
     *
     * @api public
     */

    /**
     * relation.isRelation (boolean)
     * =============================
     *
     * Property that's true for all relation instances. Avoids
     * reliance on the `instanceof` operator.
     */
    isRelation: true,

    /**
     * relation.baseAssetQuery (Object)
     * ================================
     *
     * Subclass-specific query object used for finding the base asset
     * for the relation (the asset whose url should be the basis for
     * resolving the href of the relation). This is usually the first
     * non-inline asset, but for some relation types it's the first
     * Html document.
     *
     * You shouldn't need to worry about this.
     *
     * @api public
     */
    baseAssetQuery: {isInline: false},

    /**
     * relation.attach(asset, position[, adjacentRelation])
     *
     * Attaches the relation to an asset. You probably want to use
     * `AssetGraph.attachAndAddRelation` instead.
     *
     * The ordering of certain relation types is significant
     * (`HtmlScript`, for instance), so it's important that the order
     * isn't scrambled in the indices. Therefore the caller must
     * explicitly specify a position at which to insert the object.
     *
     * @param {Asset} asset The asset to attach the relation to.
     * @param {String} position "first", "last", "before", or "after".
     * @param {Relation} adjacentRelation The adjacent relation,
     * mandatory if the position is "before" or "after".
     * @api private
     */
    attach: function (asset, position, adjacentRelation) {
        if (position === 'first') {
            asset.outgoingRelations.unshift(this);
        } else if (position === 'last') {
            asset.outgoingRelations.push(this);
        } else if (position === 'before' || position === 'after') { // before or after
            if (!adjacentRelation) {
                throw new Error("relations.Relation.attach: An adjacent relation is required for position === 'before'|'after'.");
            }
            if (this.type !== adjacentRelation.type) {
                throw new Error("relations.Relation.attach: Relation must have same type as adjacent relation.");
            }
            var adjacentRelationIndex = this.from.outgoingRelations.indexOf(adjacentRelation);
            if (adjacentRelationIndex === -1) {
                throw new Error("relations.Relation.attach: Adjacent relation not found.");
            }
            this.from.outgoingRelations.splice(adjacentRelationIndex + (position === 'after' ? 1 : 0), 0, this);
        } else {
            throw new Error("relations.Relation.attach: 'position' parameter must be either 'first', 'last', 'before', or 'after'.");
        }
        this.from.markDirty();
    },

    /**
     * relation.detach()
     * =================
     *
     * Detaches the relation from the asset it is currently attached
     * to. You probably want to use
     * `AssetGraph.detachAndRemoveRelation()` instead.
     *
     * @api public
     */
    detach: function () {
        var indexInOutgoingRelations = this.from.outgoingRelations.indexOf(this);
        if (indexInOutgoingRelations === -1) {
            throw new Error("relations.Relation.detach: Relation " + this + " not found in the outgoingRelations array");
        }
        this.from.outgoingRelations.splice(indexInOutgoingRelations, 1);
        this.from.markDirty();
    },

    /**
     * relation.toString()
     * ===================
     *
     * Get a brief text containing the type, id of the relation. Will
     * also contain the `.toString()` of the relation's source and
     * target assets if available.
     *
     * @return {String} The string, eg. "[HtmlAnchor/141: [Html/40 file:///foo/bar/index.html] => [Html/76 file:///foo/bar/otherpage.html]]"
     */
    toString: function () {
        return "[" + this.type + "/" + this.id + ": " + ((this.from && this.to) ? this.from.toString() + " => " + this.to.toString() : "unattached") + "]";
    }
};

module.exports = Relation;