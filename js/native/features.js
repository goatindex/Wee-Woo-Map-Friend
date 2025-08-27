/**
 * @module native/features
 * Native app features integration with graceful web fallbacks
 */

/**
 * Native Features Manager
 * Provides unified API for native capabilities with web fallbacks
 */
window.NativeFeatures = {
  
  /**
   * Check if running in native app context
   */
  isNativeApp() {
    return typeof window.Capacitor !== 'undefined';
  },
  
  /**
   * Check if specific native feature is available
   */
  hasFeature(featureName) {
    if (!this.isNativeApp()) return false;
    
    const featureMap = {
      'geolocation': () => window.Capacitor?.Plugins?.Geolocation,
      'haptics': () => window.Capacitor?.Plugins?.Haptics,
      'statusBar': () => window.Capacitor?.Plugins?.StatusBar,
      'splashScreen': () => window.Capacitor?.Plugins?.SplashScreen,
      'device': () => window.Capacitor?.Plugins?.Device,
      'network': () => window.Capacitor?.Plugins?.Network,
      'pushNotifications': () => window.Capacitor?.Plugins?.PushNotifications,
      'app': () => window.Capacitor?.Plugins?.App
    };
    
    const checker = featureMap[featureName];
    return checker ? !!checker() : false;
  },
  
  /**
   * Enhanced Geolocation with native features
   */
  async getCurrentPosition(options = {}) {
    if (this.hasFeature('geolocation')) {
      try {
        const { Geolocation } = window.Capacitor.Plugins;
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: options.enableHighAccuracy !== false,
          timeout: options.timeout || 10000,
          maximumAge: options.maximumAge || 300000
        });
        
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          source: 'native'
        };
      } catch (error) {
        console.warn('Native geolocation failed, falling back to web API:', error);
      }
    }
    
    // Web API fallback
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
            source: 'web'
          });
        },
        reject,
        {
          enableHighAccuracy: options.enableHighAccuracy !== false,
          timeout: options.timeout || 10000,
          maximumAge: options.maximumAge || 300000
        }
      );
    });
  },
  
  /**
   * Watch position with native features
   */
  watchPosition(callback, options = {}) {
    if (this.hasFeature('geolocation')) {
      try {
        const { Geolocation } = window.Capacitor.Plugins;
        return Geolocation.watchPosition({
          enableHighAccuracy: options.enableHighAccuracy !== false,
          timeout: options.timeout || 10000,
          maximumAge: options.maximumAge || 300000
        }, (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
            source: 'native'
          });
        });
      } catch (error) {
        console.warn('Native position watching failed, falling back to web API:', error);
      }
    }
    
    // Web API fallback
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }
    
    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          source: 'web'
        });
      },
      (error) => console.error('Position watch error:', error),
      {
        enableHighAccuracy: options.enableHighAccuracy !== false,
        timeout: options.timeout || 10000,
        maximumAge: options.maximumAge || 300000
      }
    );
  },
  
  /**
   * Haptic feedback
   */
  async hapticFeedback(type = 'impact') {
    if (this.hasFeature('haptics')) {
      try {
        const { Haptics, ImpactStyle } = window.Capacitor.Plugins;
        
        switch (type) {
          case 'light':
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
          case 'medium':
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
          case 'heavy':
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;
          case 'success':
            await Haptics.notification({ type: 'SUCCESS' });
            break;
          case 'warning':
            await Haptics.notification({ type: 'WARNING' });
            break;
          case 'error':
            await Haptics.notification({ type: 'ERROR' });
            break;
          default:
            await Haptics.impact({ style: ImpactStyle.Medium });
        }
        return true;
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
    
    // Web fallback - vibration API
    if ('vibrate' in navigator) {
      const patterns = {
        light: [50],
        medium: [100],
        heavy: [200],
        success: [100, 50, 100],
        warning: [100, 100, 100],
        error: [200, 100, 200]
      };
      
      navigator.vibrate(patterns[type] || patterns.medium);
      return true;
    }
    
    return false;
  },
  
  /**
   * Status bar management
   */
  async setStatusBar(options = {}) {
    if (this.hasFeature('statusBar')) {
      try {
        const { StatusBar, Style } = window.Capacitor.Plugins;
        
        if (options.style) {
          await StatusBar.setStyle({ 
            style: options.style === 'dark' ? Style.Dark : Style.Light 
          });
        }
        
        if (options.backgroundColor) {
          await StatusBar.setBackgroundColor({ color: options.backgroundColor });
        }
        
        if (typeof options.overlay === 'boolean') {
          await StatusBar.setOverlaysWebView({ overlay: options.overlay });
        }
        
        return true;
      } catch (error) {
        console.warn('Status bar configuration failed:', error);
      }
    }
    
    return false;
  },
  
  /**
   * Network status
   */
  async getNetworkStatus() {
    if (this.hasFeature('network')) {
      try {
        const { Network } = window.Capacitor.Plugins;
        const status = await Network.getStatus();
        
        return {
          connected: status.connected,
          connectionType: status.connectionType,
          source: 'native'
        };
      } catch (error) {
        console.warn('Native network status failed, falling back to web API:', error);
      }
    }
    
    // Web API fallback
    return {
      connected: navigator.onLine,
      connectionType: 'unknown',
      source: 'web'
    };
  },
  
  /**
   * Device information
   */
  async getDeviceInfo() {
    if (this.hasFeature('device')) {
      try {
        const { Device } = window.Capacitor.Plugins;
        const info = await Device.getInfo();
        
        return {
          model: info.model,
          platform: info.platform,
          operatingSystem: info.operatingSystem,
          osVersion: info.osVersion,
          manufacturer: info.manufacturer,
          isVirtual: info.isVirtual,
          webViewVersion: info.webViewVersion,
          source: 'native'
        };
      } catch (error) {
        console.warn('Native device info failed, falling back to web API:', error);
      }
    }
    
    // Web API fallback
    const ua = navigator.userAgent;
    return {
      model: 'Unknown',
      platform: navigator.platform || 'Unknown',
      operatingSystem: /Mac/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : 'web',
      osVersion: 'Unknown',
      manufacturer: 'Unknown',
      isVirtual: false,
      webViewVersion: 'Unknown',
      source: 'web'
    };
  },
  
  /**
   * App state management
   */
  setupAppStateHandling() {
    if (this.hasFeature('app')) {
      try {
        const { App } = window.Capacitor.Plugins;
        
        App.addListener('appStateChange', (state) => {
          window.dispatchEvent(new CustomEvent('nativeAppStateChange', {
            detail: { 
              isActive: state.isActive,
              source: 'native'
            }
          }));
        });
        
        App.addListener('backButton', () => {
          window.dispatchEvent(new CustomEvent('nativeBackButton', {
            detail: { source: 'native' }
          }));
        });
        
        return true;
      } catch (error) {
        console.warn('Native app state handling setup failed:', error);
      }
    }
    
    // Web fallback - use existing visibility API
    document.addEventListener('visibilitychange', () => {
      window.dispatchEvent(new CustomEvent('nativeAppStateChange', {
        detail: { 
          isActive: !document.hidden,
          source: 'web'
        }
      }));
    });
    
    return false;
  },
  
  /**
   * Initialize native features
   */
  async init() {
    console.log('NativeFeatures: Initializing native features integration');
    
    const isNative = this.isNativeApp();
    console.log('NativeFeatures: Running in', isNative ? 'native app' : 'web browser');
    
    if (isNative) {
      // Hide splash screen after app loads
      if (this.hasFeature('splashScreen')) {
        try {
          const { SplashScreen } = window.Capacitor.Plugins;
          await SplashScreen.hide();
        } catch (error) {
          console.warn('Failed to hide splash screen:', error);
        }
      }
      
      // Set up status bar
      await this.setStatusBar({
        style: 'dark',
        backgroundColor: '#1976d2'
      });
    }
    
    // Set up app state handling
    this.setupAppStateHandling();
    
    // Get initial device info
    const deviceInfo = await this.getDeviceInfo();
    console.log('NativeFeatures: Device info:', deviceInfo);
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('nativeFeaturesReady', {
      detail: { 
        isNative,
        deviceInfo,
        availableFeatures: [
          'geolocation',
          'haptics', 
          'statusBar',
          'device',
          'network',
          'app'
        ].filter(feature => this.hasFeature(feature))
      }
    }));
    
    return {
      isNative,
      deviceInfo,
      availableFeatures: [
        'geolocation',
        'haptics', 
        'statusBar',
        'device',
        'network',
        'app'
      ].filter(feature => this.hasFeature(feature))
    };
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.NativeFeatures.init());
} else {
  window.NativeFeatures.init();
}
