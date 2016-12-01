'use strict';

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
function FilterSubgrid(grid, options) {
    this.grid = grid;
    this.behavior = grid.behavior;

    /**
     * @type {dataRowObject}
     */
    this.dataRow = {}; // for meta data (__HEIGHT)

    if (options && options.name) {
        this.name = options.name;
    }
}

FilterSubgrid.prototype = {
    constructor: FilterSubgrid.prototype.constructor,

    type: 'filter',

    getRowCount: function() {
        return this.grid.properties.showFilterRow ? 1 : 0;
    },

    getValue: function(x, y) {
        return this.behavior.filter.getColumnFilterState(this.behavior.getColumn(x).name) || '';
    },

    setValue: function(x, y, value) {
        this.behavior.filter.setColumnFilterState(this.behavior.getColumn(x).name, value);
    },

    getRow: function(y) {
        return this.dataRow;
    }
};

module.exports = FilterSubgrid;
