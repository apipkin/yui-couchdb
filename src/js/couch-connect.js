/**
 * Creates a connection to the CouchDB location. Provides access to a
 *   Y.Couch.DB
 * @module couch
 * @submodule couch-connect
 * @class Y.Couch.Connect
 * @extends Y.Couch.Base
 * @author Anthony Pipkin
 */

var LANG = Y.Lang,
    IS_STRING = LANG.isString,
    
    EVENT_ERROR = 'couch:error',
    EVENT_INFO = 'couch:info',
    EVENT_FETCH_ALL = 'couch:fetchAll';


Y.namespace('Couch').Connect = Y.Base.create('couch-base', Y.Couch.Base, [], {
    
    /**
     * Fired when a datasource fails. Logs an error message by default.
     * @event couch:error
     */
    
    /**
     * Fired when the datasource in fetchInfo fires successful. By default, will
     *   store the returned value from fetchInfo into ATTRS.info
     * @event couch:info
     */
    
    /**
     * Fired when the datasource in fetchAllDatabases fires successful. By
     *   default, will store the returned value from fetchInfo into ATTRS.databases
     * @event couch:fetchAll
     */
    
    /**
     * Publishes events and immediatly calls fetchInfo
     * @public
     * @method initializer
     * @param {Object} config
     * @see Y.Couch.DB#_defInfoFn
     * @see Y.Couch.DB#_deffFetchAllFn
     * @see Y.Couch.DB#fetchInfo
     */
    initializer : function () {
        Y.log('initializer', 'info', 'Y.Couch.Connect');
        this.publish(EVENT_INFO, { defaultFn : this._defInfoFn });
        this.publish(EVENT_FETCH_ALL, { defaultFn: this._defFecthAllFn });
        
        this.fetchInfo(true);
    },
    
    /**
     * Initializes a request to get the couch connection information.
     *   Fires couch:info on success and couch:error if there is an error.
     * @public
     * @method fetchInfo
     * @param getNew {Boolean} Uses the local datasource or creates a new object
     * @return Y.Couch.DataSource
     */
    fetchInfo : function (getNew) {
        Y.log('fetchInfo', 'info', 'Y.Couch.Connect');
        var ds = this._getDataSource(getNew),
            callbacks = {
                
                success: Y.bind(function (e) {
                    this.fire(EVENT_INFO, {response: Y.JSON.parse(e.response.results[0].responseText)});
                }, this),
                
                failure: Y.bind(function (e) {
                    this.fire(EVENT_ERROR, {
                        message : 'An error occurred fetching the information: ' + e.error.message
                    });
                }, this)
                
            };
        
        ds.set('source', this.get('baseURI') + '/');
        
        ds.sendRequest({ callback : callbacks });
        
        return ds;
    },
    
    /**
     * Initializes a request to get an array of all the databases for the
     *   connection. Fires couch:fetchAll on success and couch:error if there
     *   is an error.
     * @public
     * @method fetchAllDatabases
     * @param getNew {Boolean} Uses the local datasource or creates a new object
     * @return Y.Couch.DataSource
     */
    fetchAllDatabases : function (getNew) {
        Y.log('fetchAllDatabases', 'info', 'Y.Couch.Connect');
        var ds = this._getDataSource(getNew),
            callbacks = {
                success: Y.bind(function (e) {
                    this.fire(EVENT_FETCH_ALL, {response: Y.JSON.parse(e.response.results[0].responseText)});
                }, this),
                
                failure: Y.bind(function (e) {
                    this.fire(EVENT_ERROR, {
                        message : 'An error occurred fetching the list of databases: ' + e.error.message
                    });
                }, this)
            };
        
        ds.set('source', this.get('baseURI') + '/_all_dbs');
        
        ds.sendRequest({ callback : callbacks });
        
        return ds;
    },
    
    /**
     * Returns a database object with the name provieded
     * @public
     * @method getDatabase
     * @param name {String} Name of the database for interaction
     * @returns Y.Couch.DB
     */
    getDatabase : function (name) {
        Y.log('getDatabase', 'info', 'Y.Couch.Connect');
        
        return (new Y.Couch.DB({
            baseURI : this.get('baseURI'),
            name: name
        }));
    },
    
    /**
     * Replicates a source database to the target.
     * @public
     * @method replicate
     * @param source {String} The source url to replicate from
     * @param target {String} The target url to replicate to
     * @param requestConfig {Object} Configuration object for replication options
     */
    
    /*
      TODO: Add in callback functions for even firing
    */
    replicate : function (source, target, requestConfig) {
        Y.log('replicate', 'info', 'Y.Couch.Connect');
        
        if (!IS_STRING(source) && !IS_STRING(target)) {
            Y.log('Cannot replicate ' + source + ' to ' + target + '.', 'error', 'Y.Couch');
        }
        
        var ds = this._getDataSource(true);
        
        requestConfig = requestConfig || {};
        requestConfig.source = source;
        requestConfig.target = target;
        
        ds.set('source', this.get('baseURI') + '/_replicate');
        
        ds.sendRequest({
            cfg : {
                headers : {
                    'Content-Type' : 'application/json'
                },
                method : 'POST',
                data : requestConfig
            }
        });
    },
    
    /**
     * Concatenates val and ATTRS.name in the local _uri
     * @protected
     * @method _baseURISetter
     * @param {String} val
     * @returns {String} value to be stored in ATTRS.baseURI
     */
    _baseURISetter : function (val) {
        Y.log('_baseURISetter', 'info', 'Y.Couch.Connect');
        var length = val.length,
            lastChar = val.substring(length - 1);
        if (lastChar === '/') {
            val = val.substring(0, length - 1);
        }
        return val;
    },
    
    /**
     * Stores databases in ATTRS.databases after a couch:fetchAll event fires
     * @protected
     * @method _defFetchAllFn
     * @param {Event} e
     */
    _defFecthAllFn : function (e) {
        Y.log('_defFecthAllFn', 'info', 'Y.Couch.Connect');
        this._set('databases', e.response);
    },
    
    /**
     * Stores the connection information in ATTRS.info after a couch:info event
     *   fires
     * @protected
     * @method _defInfoFn
     * @param {Event} e
     */
    _defInfoFn : function (e) {
        Y.log('_defInfoFn', 'info', 'Y.Couch.Connect');
        this._set('info', e.response);
    }
    
}, {
    
    ATTRS : {
        
        /**
         * URI for CouchDB connection
         * @attribute baseURI
         * @type String
         * @see Y.Couch.DB#_baseURISetter
         */
        baseURI : {
            setter : '_baseURISetter'
        },
        
        /**
         * Array of databases for the CouchDB connection
         * @attribute database
         * @type Array
         * @readonly
         */
        databases : {
            value : [],
            readOnly : true
        },
        
        /**
         * Information stored from the latest fetchInfo call.
         * @attribute info
         * @type Object
         */
        info : {
            value : {},
            readOnly : true
        }
        
    }
    
});


