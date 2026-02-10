


const stealth = () => {
  try {
    
    const newProto = navigator.__proto__;
    delete newProto.webdriver;
    navigator.__proto__ = newProto;

    
    if (!window.chrome) {
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
    }

    
    
    if (navigator.plugins.length === 0) {
      const pdfPlugin = {
        0: {
          type: "application/x-google-chrome-pdf",
          suffixes: "pdf",
          description: "Portable Document Format",
          enabledPlugin: null 
        },
        description: "Portable Document Format",
        filename: "internal-pdf-viewer",
        length: 1,
        name: "Chrome PDF Plugin"
      };

      
      const pluginArray = [pdfPlugin, pdfPlugin, pdfPlugin, pdfPlugin, pdfPlugin];
      
      
      Object.setPrototypeOf(pluginArray, PluginArray.prototype);
      Object.setPrototypeOf(pdfPlugin, Plugin.prototype);

      
      Object.defineProperty(navigator, 'plugins', {
        get: () => pluginArray,
        enumerable: true,
        configurable: true
      });

      
      const mimeType = {
        type: "application/x-google-chrome-pdf",
        suffixes: "pdf",
        description: "Portable Document Format",
        enabledPlugin: pdfPlugin
      };
      Object.setPrototypeOf(mimeType, MimeType.prototype);
      const mimeTypesArray = [mimeType];
      Object.setPrototypeOf(mimeTypesArray, MimeTypeArray.prototype);

      Object.defineProperty(navigator, 'mimeTypes', {
        get: () => mimeTypesArray,
        enumerable: true,
        configurable: true
      });
    }

    
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ru-RU', 'ru', 'en-US', 'en'],
      configurable: true
    });

    
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
      Promise.resolve({ state: Notification.permission }) :
      originalQuery(parameters)
    );

    console.log('Advanced Stealth Applied');

  } catch (e) {
    console.error('Stealth error:', e);
  }
};


const script = document.createElement('script');
script.textContent = `(${stealth.toString()})();`;
const doc = document.head || document.documentElement;
doc.appendChild(script);
script.remove();