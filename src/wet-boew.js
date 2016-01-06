( function( window ) {

    var pluginSeed = 0,
    plugin = {
        _initialize: function() {
            var _this = this;
            function preInit() {
                $( _this ).trigger( "wb.pl-pre-init" );

                function nextStep() {
                    var callback;
                    if ( $.isFunction( _this._init ) ) {
                        callback = function() {
                            _this._init( postInit );
                        };
                    } else {
                        callback = postInit;
                    }
                    loadDependencies( callback );
                }

                if ( $.isFunction( _this._preInit ) ) {
                    _this._preInit( nextStep );
                } else {
                    nextStep();
                }
            }

            function loadDependencies( callback ) {
                if ( _this.deps && _this.deps.length && _this.deps.length > 0 ) {

                    // TODO: Add dependency loader
                    callback();
                } else {
                    callback();
                }
            }

            function postInit() {
                function nextStep() {
                    _this.inited = true;
                    $( _this ).trigger( "wb.pl-init" );
                }

                if ( $.isFunction( _this._postInit ) ) {
                    _this._postInit( nextStep );
                } else {
                    nextStep();
                }
            }

            if ( !_this.inited ) {
                preInit();
            }
        },

        _settingsFromDOM: function( $elm ) {
            var dataAttr = wb.helpers.toDOMStringMapName( this.name );

            return $elm.data( dataAttr );
        },

        create: function( $elm, settings ) {
            var _this = this;

            function nextStep() {
                if ( $.isFunction( _this.beforeCreate ) ) {
                    _this.beforeCreate( $elm, settings );
                }

                var id = $elm.attr( "id" );

                if ( !id ) {
                    id = "wb-pl-" + ( pluginSeed += 1 );
                    $elm.attr( "id", id );
                }

                // TODO: Merge setting with defaults
                if ( $.isFunction( _this._create ) ) {
                    wb.instances[ id ] = $.extend(
                        {},
                        { $elm: $elm },
                        _this._create(
                            $elm,
                            $.extend( {}, _this.defaults, settings )
                        )
                    );
                }
            }

            if ( !_this.inited ) {
                $( _this ).on( "wb.pl-init", nextStep );
                _this._init();

            } else {
                nextStep();
            }
        },

        createFromDOM: function( $elms ) {
            var _this = this,
                elmsLength = $elms.length;

            function nextStep() {
                var settings, e, $elm;

                for ( e = 0; e < elmsLength; e += 1 ) {
                    $elm = $elms.eq( e );
                    if ( $.isFunction( _this._settingsFromDOM ) ) {
                        settings = _this._settingsFromDOM( $elm );
                    }

                    _this.create( $elm, settings );
                }
            }
            if ( !_this.inited ) {
                $( _this ).on( "wb.pl-init", nextStep );
            } else {
                nextStep();
                _this._initialize();
            }
        }
    },

    addPlugin = function( plugin ) {
        var selector = plugin.selector;

        if ( plugin.name !== "selectors" ) {
            wb.plugins[ selector ] = $.extend( {}, wb.plugin, plugin );
            wb.plugins.selectors.push( selector );
        }
    },

    getPlugin = function( $elm ) {
        var p, plugin;

        for ( p in wb.plugins ) {
            plugin = wb.plugins[ p ];
            if ( $elm.is( plugin.selector ) ) {
                return plugin;
            }
        }
    },

    createInitialInstances = function( event ) {
        var plugin = event.target;

        plugin.createFromDOM( $( plugin.selector ) );
    },

    wb = {
        addPlugin: addPlugin,
        callbacks: {},
        instances: {},
        plugin: plugin,
        plugins: {
            selectors: []
        }
    };

    // TODO: Load i18n

    // TODO: Find a better way to defer to after plugins are loaded
    setTimeout( function() {
        var unique = [],
            $instances = $(
                wb.plugins.selectors.join( "," )
            ),
            instancesLength = $instances.length,
            i, $instance;

        for ( i = 0; i < instancesLength; i += 1 ) {
            $instance = $( $instances[ i ] );
            plugin = getPlugin( $instance );
            if ( plugin && unique.indexOf( plugin.selector ) === -1 ) {
                $( plugin ).on( "wb.pl-init", createInitialInstances );
                plugin._initialize();
                unique.push( plugin.selector );
            }
        }

    }, 500 );

    window.wb = wb;
} )( window );
