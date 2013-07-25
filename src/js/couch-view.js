/**
 * Creates a connection to a CouchDB view.
 *   
 * @module couch
 * @submodule couch-view
 * @class Y.Couch.View
 * @author Anthony Pipkin
 */

var LANG = Y.Lang,
    IS_BOOLEAN = LANG.isBoolean,
    IS_NUMBER = LANG.isNumber,
    
    EVENT_ERROR = 'couch:error',
    EVENT_DATA = 'couch:data';


Y.namespace('Couch').View = Y.Base.create('couch-view', Y.Couch.Base, [], {
    
    /**
     * Fired when a datasource fails. Logs an error message by default.
     * @event couch:error
     */
    
    /**
     * Fired when the datasource in fetchData fires successful. By default, will
     *   store the returned value from fetchData into ATTRS.data
     * @event couch:data
     */
    
    /**
     * The uri to the view. Built by setting ATTRS.baseURI and ATTRS.name 
     * @protected
     * @property _uri
     */
    _uri : '',
    
    /**
     * Publish events
     * @public
     * @method initializer
     * @param config {Object} sets ATTRS
     */
    initializer : function(config) {
        this.publish(EVENT_DATA, { defaultFn: this._defDataFn });
    },
    
    /**
     * Initializes a request to get the couch view information.
     *   Fires couch:data on success and couch:error if there is an error.
     * @public
     * @method fetchData
     * @return Y.Couch.DataSource
     */
    fetchData : function () {
        Y.log('fetchData', 'info', 'Y.Couch.Document');
        
        var ds = this._getDataSource(true),
            url = this._uri,
            callbacks = {
                
                success: Y.bind(function (e) {
                    this.fire(EVENT_DATA, {
                        response: Y.JSON.parse(e.response.results[0].responseText)
                    });
                }, this),
                
                failure: Y.bind(function (e) {
                    this.fire(EVENT_ERROR, {
                        message : 'An error occurred fetching the information for the databases: ' + e.error.message
                    });
                }, this)
            },
            attrs = this.getAttrs(),
            requestData = {};
        
        // clean up ATTRS to prevent erroneous data in the request
        Y.Object.each(attrs, function(val, key, obj){
            if (val === null || val === undefined) {
                return;
            }
            
            if (
                key === 'baseURI' || key === 'name' || key === 'dataSource' ||
                key === 'destroyed' || key === 'initialized' || key === 'data'
            ) {
                return;
            }
            
            requestData[key] = val;
        });
        
        ds.set('source', url);
        
        ds.sendRequest({
            cfg : {
                headers : {
                    'Content-Type' : 'application/json'
                },
                method : 'GET',
                data : requestData
            },
            callback : callbacks
        });
        
        return ds;
    },
    
    /**
     * Concatenates val and ATTRS.name in the local _uri
     * @protected
     * @method _baseURISetter
     * @param {String} val
     * @returns {String} value to be stored in ATTRS.baseURI
     */
    _baseURISetter : function(val) {
        Y.log('_baseURISetter', 'info', 'Y.Couch.View');
        
        this._uri = val + '/_view/' + this.get('name');
        
        return val;
    },
    
    /**
     * Concatenates ATTRS.baseURI and val in the local _uri
     * @protected
     * @method _nameSetter
     * @param val {String} 
     * @returns {String} value to be stored in ATTRS.name
     */
    _nameSetter : function(val) {
        Y.log('_nameSetter', 'info', 'Y.Couch.View');
        
        this._uri = this.get('baseURI') + '/_view/' + val;
        
        return val;
    },
    
    /**
     * Stores view data in ATTRS.data after a couch:data event fires
     * @protected
     * @method _defDataFn
     * @param {Event} e
     */
    _defDataFn : function (e) {
        Y.log('_defDataFn', 'info', 'Y.Couch.View');
        this._set('data', e.response);
    }
    
}, {
    ATTRS : {
        
        /**
         * Full URI for the View's CouchDB Document.
         * @attribute baseURI
         * @type String
         * @see Y.Couch.DB#_baseURISetter
         */
        baseURI : {
            setter : '_baseURISetter'
        },
        
        /**
         * Name of the View to access
         * @attribute name
         * @type String
         * @see Y.Couch.DB#_nameSetter
         */
        name : {
            value : '',
            setter : '_nameSetter'
        },
        
        /**
         * Storage of most recent successful data request
         * @attribute data
         * @type Object
         */
        data : {},
        
        /**
         * Reverses the output. Also reverses the start and end keys.
         * @attribute descending
         * @type Boolean
         */
        descending : {
            value : false,
            validator : IS_BOOLEAN
        },
        
        /**
         * Specific key to end on. Must be a proper URL encoded JSON value.
         * @attribute endkey
         * @type String
         */
        endkey : {},
        
        /**
         * Last document id to include in the output (to allow pagination for
         *   duplicate endkeys)
         * @attribute endkey_docid
         * @type String
         */
        'endkey_docid' : {},
        
        /**
         * Controls whether the reduce function reduces to a set of distinct
         *   keys or to a single result row.
         * @attribute group
         * @type Boolean
         */
        group : {
            value : false,
            validator : IS_BOOLEAN
        },
        
        /**
         * Number of group keys to limit data returned.
         * @attribute group_level
         * @type String
         */
        'group_level' : {},
        
        /**
         * Automatically fetch and include the document which emitted each
         *   view entry
         * @attribute include_docs
         * @type Boolean
         */
        'include_docs' : {
            value : false,
            validator : IS_BOOLEAN
        },
        
        /**
         * Controls whether the endkey is included in the result.
         * @attribute inclusive_end
         * @type Boolean
         */
        'inclusive_end' : {
            value : true,
            validator : IS_BOOLEAN
        },
        
        /**
         * The actual key all results must match
         * @attribute key
         * @type String
         */
        key : {},
        
        /**
         * Limit the number of documents in the output
         * @attribute limit
         * @type Number
         */
        limit : {
            validotor : IS_NUMBER
        },
        
        /**
         * Specifies whether to use the reduce function of the view. 
         * @attribute reduce
         * @type Boolean
         */
        reduce : {
            validator : IS_BOOLEAN
        },
        
        /**
         * The number of documents to skip
         * @attribute skip
         * @type Number
         */
        skip : {
            value : 0,
            validator : IS_NUMBER
        },
        
        /**
         * When set to 'ok', CouchDB will not refresh the view to improve query
         *   latency. When set to 'update_after', CouchDB will refresh the view
         *   after the stale result is returned.
         * @attribute stale
         * @type String
         */
        stale : {
            validator : function(val){
                return (val === 'ok' || val === 'update_after');
            }
        },
        
        /**
         * Specific key to start with. Must be a proper URL encoded JSON value.
         * @attribute startkey
         * @type String
         */
        startkey : {},
        
        /**
         * Document ID to start with (to allow pagination for duplicate
         *   startkeys)
         * @attribute startkey_docid
         * @type String
         */
        'startkey_docid' :  {}
        
    }
});


