/**
 * Creates a connection to the CouchDB database instance. Provides access to a
 *   Y.Couch.Document
 * 
 * @module couch
 * @submodule couch-db
 * @class Y.Couch.DB
 * @author Anthony Pipkin
 */

var EVENT_ERROR = 'couch:error',
    EVENT_INFO = 'couch:info',
    EVENT_FETCH_ALL = 'couch:fetchAll';

Y.namespace('Couch').DB = Y.Base.create('couch-db', Y.Couch.Base, [], {
    
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
     * Fired when the datasource in fetchAllDocuments fires successful. By
     *   default, will store the returned value from fetchAllDocuments into
     *   ATTRS.documents
     * @event couch:fetchAll
     */
    
    /**
     * The uri to the database. Built by setting ATTRS.baseURI and ATTRS.name 
     * @protected
     * @property _uri
     */
    _uri : '',
    
    /**
     * Publishes events and immediatly calls fetchInfo
     * @public
     * @method initializer
     * @param {Object} config
     * @see Y.Couch.DB#_defInfoFn
     * @see Y.Couch.DB#_deffFetchAllFn
     * @see Y.Couch.DB#fetchInfo
     */
    initializer : function (config) {
        this.publish(EVENT_INFO, { defaultFn : this._defInfoFn });
        this.publish(EVENT_FETCH_ALL, { defaultFn: this._defFecthAllFn });
        
        this.fetchInfo();
    },
    
    /**
     * Initializes a request to get the database information.
     *   Fires couch:info on success and couch:error if there is an error.
     * @public
     * @method fetchInfo
     * @return Y.Couch.DataSource
     */
    fetchInfo : function () {
        Y.log('fetchInfo', 'info', 'Y.Couch.Db');
        
        var ds = this._getDataSource(true),
            url = this._uri,
            callbacks = {
                
                success: Y.bind(function (e) {
                    this.fire(EVENT_INFO, {response: Y.JSON.parse(e.response.results[0].responseText)});
                }, this),
                
                failure: Y.bind(function (e) {
                    this.fire(EVENT_ERROR, {
                        message : 'An error occurred fetching the information for the databases: ' + e.error.message
                    });
                }, this)
            };
            
        ds.set('source', url);
        
        ds.sendRequest({
            cfg : {
                headers : {
                    'Content-Type' : 'application/json'
                },
                method : 'GET'
            },
            callback : callbacks
        });
        
        return ds;
    },
    
    /**
     * Initializes a request to get all documents for the database.
     *   Fires couch:fetchAll on success and couch:error if there is an error.
     * @public
     * @method fetchAllDocuments
     * @param {Object} <optional> options
     * @return Y.Couch.DataSource
     */
    fetchAllDocuments : function (options) {
        Y.log('fetchAllDocuments', 'info', 'Y.Couch.Db');
        
        var ds = this._getDataSource(true),
            url = this._uri + '_all_docs',
            callbacks = {
                
                success: Y.bind(function (e) {
                    this.fire(EVENT_FETCH_ALL, {response: Y.JSON.parse(e.response.results[0].responseText)});
                }, this),
                
                failure: Y.bind(function (e) {
                    this.fire(EVENT_ERROR, {
                        message : 'An error occurred fetching the information for the databases: ' + e.error.message
                    });
                }, this)
            };
            
        ds.set('source', url);
        
        ds.sendRequest({
            cfg : {
                headers : {
                    'Content-Type' : 'application/json'
                },
                method : 'GET',
                data : options
            },
            callback : callbacks
        });
        
        return ds;
    },
    
    /**
     * Creates and returns a Y.Couch.Document instance with the baseURI,
     *   databaseName, and id set.
     * @public
     * @method getDocument
     * @param {Sring} id
     * @returns Y.Couch.Document
     */
    getDocument : function (id) {
        Y.log('getDocument', 'info', 'Y.Couch.Db');
        
        return new Y.Couch.Document({
            baseURI : this.get('baseURI'),
            databaseName : this.get('name'),
            id : id
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
        Y.log('_baseURISetter', 'info', 'Y.Couch.DB');
        this._uri = val + '/' + this.get('name') + '/';
        return val;
    },
    
    /**
     * Concatenates ATTRS.baseURI and val in the local _uri
     * @protected
     * @method _nameSetter
     * @param {String} val
     * @returns {String} value to be stored in ATTRS.name
     */
    _nameSetter : function (val) {
        Y.log('_nameSetter', 'info', 'Y.Couch.DB');
        this._uri = this.get('baseURI') + '/' + val + '/';
        return val;
    },
    
    /**
     * Stores the connection information in ATTRS.info after a couch:info event
     *   fires
     * @protected
     * @method _defInfoFn
     * @param {Event} e
     */
    _defInfoFn : function (e) {
        Y.log('_defInfoFn', 'info', 'Y.Couch.DB');
        this._set('info', e.response);
    },
    
    /**
     * Stores documents after a couch:fetchAll event fires
     * @protected
     * @method _defFetchAllFn
     * @param {Event} e
     */
    _defFecthAllFn : function (e) {
        Y.log('_defFecthAllFn', 'info', 'Y.Couch.DB');
        this._set('documents', e.response);
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
            value : '',
            setter : '_baseURISetter'
        },
        
        /**
         * CouchDB database name
         * @attribute name
         * @type String
         * @see Y.Couch.DB#_nameSetter
         */
        name : {
            value : '',
            setter : '_nameSetter'
        },
        
        /**
         * Information stored from the latest fetchInfo call.
         * @attribute info
         * @type Object
         * @readonly
         */
        info : {
            readOnly : true
        },
        
        /**
         * Information stored from the latest fetchAllDocuments call.
         * @attribute documents
         * @type Object
         */
        documents : {
            readOnly : true
        }
    }
});

