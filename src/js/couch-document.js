/**
 * Creates a connection to a CouchDB document instance. Provides access to a
 *   Y.Couch.View
 * @module couch
 * @submodule couch-document
 * @class Y.Couch.Document
 * @author Anthony Pipkin
 */

var EVENT_ERROR = 'couch:error',
    EVENT_INFO = 'couch:info',
    EVENT_OPENED = 'couch:opened',
    EVENT_SAVED = 'couch:saved',
    EVENT_DELETED = 'couch:deleted';

Y.namespace('Couch').Document = Y.Base.create('couch-document', Y.Couch.Base, [], {
    
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
     * The uri to the document. Built by setting ATTRS.baseURI,
     *   ATTRS.databaseName and ATTRS.id
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
        this.publish(EVENT_OPENED, { defaultFn: this._defOpenedFn });
        this.publish(EVENT_SAVED, { defaultFn: this._defSavedFn });
        this.publish(EVENT_DELETED, { defaultFn: this._defRemovedFn });
        
        this.fetchInfo();
    },
    
    /**
     * Initializes a request to get the couch document information.
     *   Fires couch:info on success and couch:error if there is an error.
     * @public
     * @method fetchInfo
     * @param getNew {Boolean} Uses the local datasource or creates a new object
     * @return Y.Couch.DataSource
     */
    fetchInfo : function () {
        Y.log('fetchInfo', 'info', 'Y.Couch.Document');
        
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
     * Returns an array of views stored in ATTRS.info
     * @public
     * @method getAllViews
     * @returns {Array} 
     */
    getAllViews : function () {
        Y.log('fetchAllViews', 'info', 'Y.Couch.Document');
        
        var info = this.get('info');
        
        if (!info || !info.views) {
            this.fire('EVENT_ERROR', {
                message : 'There is no information for this document available.'
            });
            return [];
        }
        
        return (Y.Object.keys(info.views));
    },
    
    /**
     * Returns a view object with the name provided and configuration object
     * @public
     * @method getView
     * @param name {String} Name of the database for interaction
     * @param config {Object} Provided for extra configurations to the view
     * @returns Y.Couch.View
     */
    getView : function (name, config) {
        Y.log('getView', 'info', 'Y.Couch.Document');
        
        config = config || {};
        config.name = name;
        config.baseURI = this._uri;
        
        return new Y.Couch.View(config);
    },
    
    /**
     * Opens a document with the name stored in ATTRS.name. Fires couch:opened
     *   on success and couch:error on failure.
     * @public
     * @method open
     * @param options {Object} URL options for opening the document
     * @return Y.Couch.DataSource
     */
    open : function (options) {
        Y.log('open', 'info', 'Y.Couch.Document');
        
        var ds = this._getDataSource(true),
            url = this._uri,
            callbacks = {
                
                success: Y.bind(function (e) {
                    this.fire(EVENT_OPENED, {response: Y.JSON.parse(e.response.results[0].responseText)});
                }, this),
                
                failure: Y.bind(function (e) {
                    this.fire(EVENT_ERROR, {
                        message : 'An error occurred opening the document: ' + e.error.message
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
                data: options
            },
            callback : callbacks
        });
        
        return ds;
    },
    
    /**
     * Saves the document with the provided options
     * TODO: clean up documentData before saving
     * @public
     * @method save
     * @param options {Object} URL options for saving the document
     * @return Y.Couch.DataSource
     */
    save : function (options) {
        Y.log('save', 'info', 'Y.Couch.Document');
        
        var documentData = this.get('data'),
            ds = this._getDataSource(true),
            url = this._uri,
            callbacks = {
                
                success: Y.bind(function (e) {
                    this.fire(EVENT_SAVED, {response: Y.JSON.parse(e.response.results[0].responseText)});
                }, this),
                
                failure: Y.bind(function (e) {
                    this.fire(EVENT_ERROR, {
                        message : 'An error occurred opening the document: ' + e.error.message
                    });
                }, this)
            };
            
        if (!documentData || !documentData._id) {
            this.fire(EVENT_ERROR, {
                message : 'No data found on the document to save.'
            });
            return null;
        }
        
        url += encodeURIComponent(documentData._id);
        
        if (options !== undefined) {
            url += '?' + this._queryString( options );
        }
        
        ds.set('source', url);
        
        ds.sendRequest({
            cfg : {
                headers : {
                    'Content-Type' : 'application/json'
                },
                method : 'PUT',
                data : documentData
            },
            callback : callbacks
        });
        
        return ds;
    },
    
    /**
     * Removes a document with the stored ATTRS.name
     * TODO: Remove the document
     * @public
     * @method getDatabase
     * @param options {Object} URL options for removing the document
     */
    remove : function (options) {
        Y.log('remove', 'info', 'Y.Couch.Document');
    },
    
    /* DEF EVENT FN */
    
    /**
     * Stores information in ATTRS.info after a couch:info event fires
     * @protected
     * @method _defInfoFn
     * @param {Event} e
     */
    _defInfoFn : function (e) {
        Y.log('_defInfoFn', 'info', 'Y.Couch.Document');
        this.set('info', e.response);
    },
    
    /**
     * Stores document information in ATTRS.data after a couch:opened event fires
     * @protected
     * @method _defOpenedFn
     * @param {Event} e
     */
    _defOpenedFn : function (e) {
        Y.log('_defOpenedFn', 'info', 'Y.Couch.Document');
        this._set('data', e.response);
    },
    
    /**
     * Method is called after couch:saved event fires
     * TODO: work with saved document resopnse
     * @protected
     * @method _defSavedFn
     * @param {Event} e
     */
    _defSavedFn : function (e) {
        Y.log('_defSavedFn', 'info', 'Y.Couch.Document');
    },
    
    /**
     * Method is called after couch:removed event fires
     * TODO: work with removed document response
     * @protected
     * @method _defRemovedFn
     * @param {Event} e
     */
    _defRemovedFn : function (e) {
        Y.log('_defRemovedFn', 'info', 'Y.Couch.Document');
    },
    
    /* SETTERS */
    
    /**
     * Concatenates val, ATTRS.name and ATTRS.id in the local _uri
     * @protected
     * @method _baseURISetter
     * @param {String} val
     * @returns {String} value to be stored in ATTRS.baseURI
     */
    _baseURISetter : function (val) {
        Y.log('_baseURISetter', 'info', 'Y.Couch.Document');
        this._uri = val + '/' + this.get('databaseName') + '/' + this.get('id');
        return val;
    },
    
    /**
     * Concatenates ATTRS.baseURI, val and ATTRS.id in the local _uri
     * @protected
     * @method _databaseNameSetter
     * @param {String} val
     * @returns {String} value to be stored in ATTRS.name
     */
    _databaseNameSetter : function (val) {
        Y.log('_databaseNameSetter', 'info', 'Y.Couch.Document');
        this._uri = this.get('baseURI') + '/' + val + '/' + this.get('id');
        return val;
    },
    
    /**
     * Concatenates ATTRS.baseURI, ATTRS.databaseName and val in the local _uri
     * @protected
     * @method _idSetter
     * @param {String} val
     * @returns {String} value to be stored in ATTRS.id
     */
    _idSetter : function (val) {
        Y.log('_idSetter', 'info', 'Y.Couch.Document');
        val = encodeURIComponent(val);
        this._uri = this.get('baseURI') + '/' + this.get('databaseName') + '/' + val;
        return val;
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
         * @attribute databaseName
         * @type String
         * @see Y.Couch.DB#_databaseNameSetter
         */
        databaseName : {
            value : '',
            setter : '_databaseNameSetter'
        },
        
        /**
         * CouchDB document ID
         * @attribute id
         * @type String
         * @see Y.Couch.DB#_idSetter
         */
        id : {
            value : '',
            setter : '_idSetter'
        },
        
        /**
         * Information stored from the latest fetchInfo call.
         * @attribute info
         * @type Object
         */
        info : {
            readOnly : true
        },
        
        /**
         * Opened document data
         * @attribute data
         * @type Object
         */
        data : {
            readOnly : true
        }
    }
});

