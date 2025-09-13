/**
 * @module types/interfaces
 * Type definitions and interfaces for WeeWoo Map Friend application
 * Provides JSDoc type definitions for better code documentation and IDE support
 */

/**
 * @typedef {Object} ComponentOptions
 * @property {boolean} [autoInit=true] - Whether to auto-initialize the component
 * @property {string} [className='component'] - CSS class name for the component
 * @property {boolean} [enableLogging=true] - Whether to enable console logging
 * @property {boolean} [clearOnDestroy=true] - Whether to clear container on destroy
 */

/**
 * @typedef {Object} StateChangeEvent
 * @property {string} property - The property that changed
 * @property {any} value - The new value
 * @property {any} oldValue - The previous value
 * @property {Object} state - The complete current state
 * @property {string} [action] - The action performed ('set', 'delete')
 */

/**
 * @typedef {Object} RouteConfig
 * @property {Function} handler - Route handler function
 * @property {Object} options - Route options
 * @property {string} options.title - Page title
 * @property {string} options.description - Page description
 * @property {boolean} options.requiresAuth - Whether route requires authentication
 */

/**
 * @typedef {Object} EventListenerConfig
 * @property {Function} fn - The listener function
 * @property {boolean} once - Whether this is a one-time listener
 * @property {number} priority - Listener priority (higher = called first)
 * @property {Symbol} id - Unique identifier for the listener
 */

/**
 * @typedef {Object} DeviceContext
 * @property {boolean} isMobile - Whether device is mobile
 * @property {boolean} isTablet - Whether device is tablet
 * @property {boolean} isDesktop - Whether device is desktop
 * @property {boolean} isTouch - Whether device has touch capability
 * @property {boolean} isPWA - Whether app is running as PWA
 * @property {boolean} isNative - Whether app is running as native app
 * @property {string} platform - Platform name ('ios', 'android', 'web')
 * @property {Object} screen - Screen information
 * @property {number} screen.width - Screen width
 * @property {number} screen.height - Screen height
 * @property {string} orientation - Current orientation ('portrait', 'landscape')
 */

/**
 * @typedef {Object} LayerMeta
 * @property {string} type - Layer type ('polygon', 'point')
 * @property {string} nameProp - Property name for feature names
 * @property {Function} styleFn - Styling function for features
 * @property {Function} defaultOn - Function to determine default visibility
 * @property {string} listId - HTML ID for the layer list
 * @property {string} toggleAllId - HTML ID for the toggle all button
 */

/**
 * @typedef {Object} FeatureLayer
 * @property {L.Layer} layer - Leaflet layer object
 * @property {Object} feature - GeoJSON feature data
 * @property {string} name - Feature display name
 * @property {boolean} emphasized - Whether feature is emphasized
 * @property {boolean} labeled - Whether feature has label
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} category - Feature category
 * @property {string} key - Feature key
 * @property {string} name - Feature name
 * @property {string} displayText - Text to display in search results
 * @property {number} score - Search relevance score
 */

/**
 * @typedef {Object} WeatherData
 * @property {Object} location - Location information
 * @property {number} location.lat - Latitude
 * @property {number} location.lon - Longitude
 * @property {number} days - Number of forecast days
 * @property {Array<WeatherForecast>} forecast - Weather forecast data
 */

/**
 * @typedef {Object} WeatherForecast
 * @property {number} day - Day number (1-7)
 * @property {string} summary - Weather summary
 * @property {number} tempMin - Minimum temperature
 * @property {number} tempMax - Maximum temperature
 * @property {string} [icon] - Weather icon identifier
 * @property {number} [humidity] - Humidity percentage
 * @property {number} [windSpeed] - Wind speed
 */

/**
 * @typedef {Object} NavigationOptions
 * @property {boolean} [replace=false] - Replace current history entry
 * @property {Object} [state] - State object for history
 */

/**
 * @typedef {Object} HamburgerMenuOptions
 * @extends ComponentOptions
 * @property {string} [menuTitle='Navigation'] - Title for the menu
 * @property {Array<MenuItem>} [items] - Menu items
 * @property {boolean} [closeOnSelect=true] - Close menu when item selected
 * @property {string} [animation='slide'] - Animation type ('slide', 'fade')
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} id - Unique identifier
 * @property {string} text - Display text
 * @property {string} [href] - Link URL
 * @property {Function} [handler] - Click handler function
 * @property {string} [icon] - Icon identifier
 * @property {boolean} [active] - Whether item is currently active
 * @property {Array<MenuItem>} [children] - Sub-menu items
 */

/**
 * @typedef {Object} SearchOptions
 * @property {boolean} [fuzzy=true] - Enable fuzzy search
 * @property {number} [threshold=0.6] - Fuzzy search threshold
 * @property {number} [maxResults=10] - Maximum number of results
 * @property {Array<string>} [categories] - Categories to search in
 * @property {boolean} [highlight=true] - Highlight search terms
 */

/**
 * @typedef {Object} LoaderConfig
 * @property {string} url - Data source URL
 * @property {string} category - Feature category
 * @property {Function} parser - Data parsing function
 * @property {Function} renderer - Feature rendering function
 * @property {Object} [options] - Additional options
 */

/**
 * @typedef {Object} NativeFeatures
 * @property {boolean} isAvailable - Whether native features are available
 * @property {Function} hapticFeedback - Trigger haptic feedback
 * @property {Function} getLocation - Get device location
 * @property {Function} showStatusBar - Show status bar
 * @property {Function} hideStatusBar - Hide status bar
 * @property {Function} exitApp - Exit the application
 */

/**
 * Map-related type definitions
 */

/**
 * @typedef {Object} MapConfig
 * @property {number} [zoom=8] - Initial zoom level
 * @property {Array<number>} [center=[-37.8136, 144.9631]] - Initial center coordinates
 * @property {number} [minZoom=6] - Minimum zoom level
 * @property {number} [maxZoom=18] - Maximum zoom level
 * @property {string} [attribution] - Map attribution text
 */

/**
 * @typedef {Object} LayerStyle
 * @property {string} [color] - Stroke color
 * @property {string} [fillColor] - Fill color
 * @property {number} [weight] - Stroke weight
 * @property {number} [opacity] - Stroke opacity
 * @property {number} [fillOpacity] - Fill opacity
 * @property {string} [dashArray] - Dash pattern
 */

/**
 * Event-related type definitions
 */

/**
 * @typedef {Object} CustomEvent
 * @property {string} type - Event type
 * @property {any} data - Event data
 * @property {Date} timestamp - Event timestamp
 * @property {Object} [target] - Event target
 */

/**
 * @typedef {Object} ComponentEvent
 * @extends CustomEvent
 * @property {ComponentBase} component - Component instance
 */

/**
 * @typedef {Object} RouteEvent
 * @extends CustomEvent
 * @property {string} from - Previous route
 * @property {string} to - New route
 * @property {RouteConfig} route - Route configuration
 */

/**
 * Utility type definitions
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} Bounds
 * @property {number} top - Top boundary
 * @property {number} right - Right boundary
 * @property {number} bottom - Bottom boundary
 * @property {number} left - Left boundary
 */

/**
 * @typedef {Object} Dimensions
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 */

/**
 * @typedef {'mobile'|'tablet'|'desktop'|'large'} DeviceSize
 */

/**
 * @typedef {'portrait'|'landscape'} Orientation
 */

/**
 * @typedef {'ios'|'android'|'web'} Platform
 */

/**
 * @typedef {'loading'|'loaded'|'error'} LoadState
 */

/**
 * @typedef {Object} IEventBus
 * @property {Function} on - Subscribe to an event
 * @property {Function} once - Subscribe to an event once
 * @property {Function} off - Unsubscribe from an event
 * @property {Function} emit - Emit an event
 * @property {Function} emitSync - Emit an event synchronously
 * @property {Function} removeAllListeners - Remove all listeners for an event
 * @property {Function} getListeners - Get all listeners for an event
 * @property {Function} hasListeners - Check if event has listeners
 * @property {Function} getEventNames - Get all event names
 * @property {Function} getListenerCount - Get listener count for an event
 */

/**
 * @typedef {Object} IStateManager
 * @property {Function} getState - Get current state
 * @property {Function} setState - Set state value
 * @property {Function} subscribe - Subscribe to state changes
 * @property {Function} unsubscribe - Unsubscribe from state changes
 * @property {Function} reset - Reset state to initial values
 * @property {Function} getStateSlice - Get specific state slice
 * @property {Function} setStateSlice - Set specific state slice
 */

/**
 * @typedef {Object} IEnvironmentService
 * @property {Function} getPlatform - Get current platform
 * @property {Function} getCapabilities - Get device capabilities
 * @property {Function} isMobile - Check if platform is mobile
 * @property {Function} isDesktop - Check if platform is desktop
 * @property {Function} isWeb - Check if platform is web
 * @property {Function} initialize - Initialize the service
 */

/**
 * @typedef {Object} IDataService
 * @property {Function} loadData - Load data for a category
 * @property {Function} getData - Get loaded data
 * @property {Function} clearData - Clear data cache
 * @property {Function} isDataLoaded - Check if data is loaded
 * 
 * NOTE: IDataService is archived - DataService module was moved to archive/modules/
 * This interface is kept for reference but not currently used.
 */

// Export interfaces
export const IEventBus = {}; // Placeholder for JSDoc interface
export const IStateManager = {}; // Placeholder for JSDoc interface
export const IEnvironmentService = {}; // Placeholder for JSDoc interface
// export const IDataService = {}; // Archived - not currently used
