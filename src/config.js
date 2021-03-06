/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Handles a configuration dictionary.
 *
 * @class Config
 * @extends Model
 */

CKEDITOR.define( [ 'mvc/model', 'utils' ], function( Model, utils ) {
	var Config = Model.extend( {
		/**
		 * Creates an instance of the {@link Config} class.
		 *
		 * @param {Object} [configurations] The initial configurations to be set.
		 * @constructor
		 */
		constructor: function Config( configurations ) {
			// Call super-constructor.
			Model.apply( this );

			if ( configurations ) {
				this.set( configurations );
			}
		},

		/**
		 * Set configuration values.
		 *
		 * It accepts both a name/value pair or an object, which properties and values will be used to set
		 * configurations.
		 *
		 * It also accepts setting a "deep configuration" by using dots in the name. For example, `'resize.width'` sets
		 * the value for the `width` configuration in the `resize` subset.
		 *
		 *     config.set( 'width', 500 );
		 *     config.set( 'toolbar.collapsed', true );
		 *
		 *     // Equivalent to:
		 *     config.set( {
		 *         width: 500
		 *         toolbar: {
		 *             collapsed: true
		 *         }
		 *     } );
		 *
		 * Passing an object as the value will amend the configuration, not replace it.
		 *
		 *     config.set( 'toolbar', {
		 *         collapsed: true,
		 *     } );
		 *
		 *     config.set( 'toolbar', {
		 *         color: 'red',
		 *     } );
		 *
		 *     config.toolbar.collapsed; // true
		 *     config.toolbar.color; // 'red'
		 *
		 * @param {String|Object} nameOrConfigurations The configuration name or an object from which take properties as
		 * configuration entries. Configuration names are case-insensitive.
		 * @param {*} [value=null] The configuration value. Used if a name is passed to nameOrConfigurations.
		 */
		set: function( name, value ) {
			// Just pass the call to the original set() in case of an object. It'll deal with recursing through the
			// object and calling set( name, value ) again for each property.
			if ( utils.isObject( name ) ) {
				Model.prototype.set.apply( this, arguments );

				return;
			}

			// The target for this configuration is, for now, this object.
			//jscs:disable safeContextKeyword
			var target = this;
			//jscs:enable

			// The configuration name should be split into parts if it has dots. E.g: `resize.width`.
			var parts = name.toLowerCase().split( '.' );

			// Take the name of the configuration out of the parts. E.g. `resize.width` -> `width`
			name = parts.pop();

			// Retrieves the final target for this configuration recursively.
			for ( var i = 0; i < parts.length; i++ ) {
				// The target will always be an instance of Config.
				if ( !( target[ parts[ i ] ] instanceof Config ) ) {
					target.set( parts[ i ], new Config() );
				}

				target = target[ parts[ i ] ];
			}

			// Values set as pure objects will be treated as Config subsets.
			if ( utils.isPlainObject( value ) ) {
				// If the target is an instance of Config (a deep config subset).
				if ( target[ name ] instanceof Config ) {
					// Amend the target with the value, instead of replacing it.
					target[ name ].set( value );

					return;
				}

				value = new Config( value );
			}

			// Values will never be undefined.
			if ( typeof value == 'undefined' ) {
				value = null;
			}

			// Call the original set() on the target.
			Model.prototype.set.call( target, name, value );
		},

		/**
		 * Gets the value for a configuration entry.
		 *
		 *     config.get( 'name' );
		 *
		 * Deep configurations can be retrieved by separating each part with a dot.
		 *
		 *     config.get( 'toolbar.collapsed' );
		 *
		 * @param {String} name The configuration name. Configuration names are case-insensitive.
		 * @returns {*} The configuration value or `undefined` if the configuration entry was not found.
		 */
		get: function( name ) {
			// The target for this configuration is, for now, this object.
			//jscs:disable safeContextKeyword
			var source = this;
			//jscs:enable

			// The configuration name should be split into parts if it has dots. E.g. `resize.width` -> [`resize`, `width`]
			var parts = name.toLowerCase().split( '.' );

			// Take the name of the configuration from the parts. E.g. `resize.width` -> `width`
			name = parts.pop();

			// Retrieves the source for this configuration recursively.
			for ( var i = 0; i < parts.length; i++ ) {
				// The target will always be an instance of Config.
				if ( !( source[ parts[ i ] ] instanceof Config ) ) {
					source = null;
					break;
				}

				source = source[ parts[ i ] ];
			}

			// Try to retrieve it from the source object.
			if ( source && ( typeof source[ name ] != 'undefined' ) ) {
				return source[ name ];
			}

			// If not found, take it from the definition.
			if ( this.definition ) {
				return this.definition[ name ];
			}

			return undefined;
		},

		/**
		 * Defines the name and default value for configurations. It accepts the same parameters as the
		 * {@link Config#set set()} method.
		 *
		 * On first call, the {@link Config#definition definition} property is created to hold all defined
		 * configurations.
		 *
		 * This method is supposed to be called by plugin developers to setup plugin's configurations. It would be
		 * rarely used for other needs.
		 *
		 * @param {String|Object} nameOrConfigurations The configuration name or an object from which take properties as
		 * configuration entries.
		 * @param {*} [value] The configuration value. Used if a name is passed to nameOrConfigurations. If undefined,
		 * the configuration is set to `null`.
		 */
		define: function( name, value ) {
			if ( !this.definition ) {
				/**
				 *
				 *
				 * @property
				 * @type {Config}
				 */
				this.definition = new Config();
			}

			this.definition.set( name, value );
		}
	} );

	return Config;
} );
