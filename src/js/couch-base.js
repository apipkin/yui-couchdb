/**
 * Provides a common interface for data source and error publishing
 * @module couch
 * @submodule couch-base
 * @class Y.Couch.Base
 * @extends Y.Base
 * @author Anthony Pipkin
 */

var LANG = Y.Lang,
    IS_BOOLEAN = LANG.isBoolean,
    DATA_SOURCE = 'dataSource',
    EVENT_ERROR = 'couch:error';

Y.namespace('Couch').Base = Y.Base.create('couch-base', Y.Base, [], {
    
    /**
     * Fired when a datasource fails. Logs an error message by default.
     * @event couch:error
     */
    
    /**
     * Publishes the couch:error event
     * @public
     * @method initializer
     * @see Y.Couch.Base#_defErrorFn
     */
    initializer : function () {
        this.publish(EVENT_ERROR, { defaultFn : this._defErrorFn });
    },
    
    /**
     * Returns the local data source or a new one based on the getNew param
     * @protected
     * @method _getDataSource
     * @param {Boolean} getNew
     * @returns Y.Couch.DataSource
     */
    _getDataSource : function (getNew) {
        Y.log('_getDataSource', 'info', 'Y.Couch');
        
        if (getNew === true) {
            return this._newDataSource();
        }
        return this.get(DATA_SOURCE);
    },
    
    /**
     * Returns a new data source preset with the local attributes
     * @protected
     * @method _newDataSource
     * @returns Y.Couch.DataSource
     */
    _newDataSource : function () {
        Y.log('_newDataSource', 'info', 'Y.Couch');
        return new Y.Couch.DataSource(this.getAttrs());
    },
    
    /**
     * Returns a new data source to be used for fetching external resources
     * @protected
     * @method _createDefaultDataSource
     * @see Y.Couch.Base#_newDataSource
     * @returns Y.Couch.DataSource
     */
    _createDefaultDataSource : function () {
        Y.log('_createDefaultDS', 'info', 'Y.Couch');
        return this._newDataSource();
    },
    
    
    /**
     * Logs error messages when an error occurs
     * @protected
     * @method _defErrorFn
     * @param {Event} e
     */
    _defErrorFn : function (e) {
        Y.log('_defErrorFn', 'info', 'Y.Couch');
        Y.log(e.message, 'error', 'Y.Couch');
    }
    
}, {
    ATTRS : {
        
        /**
         * @attribute dataSource
         * @type Y.Couch.DataSource
         * @see Y.Couch.Base#_createDefaultDataSource
         */
        dataSource : {
            valueFn : '_createDefaultDataSource'
        }
    }
});


//overwrite stringify to support strings from booleans instead of ints
Y.QueryString._oldStringify = Y.QueryString.stringify;

Y.QueryString.stringify = function (obj, c, name) {

    if (IS_BOOLEAN(obj) || Object.prototype.toString.call(obj) === '[object Boolean]') {
        obj = obj.toString();
    }
    
    return Y.QueryString._oldStringify(obj, c, name);
};