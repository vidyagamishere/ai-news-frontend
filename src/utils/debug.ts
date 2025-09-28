/**
 * Debug utility for comprehensive function entrance/exit logging
 * Can be controlled via environment variable or runtime flag
 */

// Debug mode configuration - can be controlled via environment or localStorage
const getDebugMode = (): boolean => {
  // Check environment variable first
  const envDebug = import.meta.env.VITE_DEBUG_MODE === 'true';
  
  // Check localStorage for runtime toggle
  const localDebug = localStorage.getItem('debug_mode') === 'true';
  
  // Check URL parameter for immediate debugging
  const urlParams = new URLSearchParams(window.location.search);
  const urlDebug = urlParams.get('debug') === 'true';
  
  return envDebug || localDebug || urlDebug;
};

// Global debug flag - can be changed at runtime
let DEBUG_ENABLED = getDebugMode();

// Re-check debug mode periodically in case localStorage changes
setInterval(() => {
  DEBUG_ENABLED = getDebugMode();
}, 5000);

// Debug utility class
export class DebugLogger {
  private context: string;
  private enabled: boolean;
  
  constructor(context: string, forceEnabled?: boolean) {
    this.context = context;
    this.enabled = forceEnabled ?? DEBUG_ENABLED;
  }
  
  /**
   * Log function entrance with parameters
   */
  enter(functionName: string, params?: any): void {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const paramsStr = params ? this.sanitizeParams(params) : 'no params';
    
    console.log(`🟢 [${timestamp}] ${this.context}.${functionName}() ENTER`, {
      function: functionName,
      context: this.context,
      params: params ? this.sanitizeParams(params) : undefined,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log function exit with return value
   */
  exit(functionName: string, returnValue?: any, executionTime?: number): void {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const timeStr = executionTime ? ` (${executionTime}ms)` : '';
    
    console.log(`🔴 [${timestamp}] ${this.context}.${functionName}() EXIT${timeStr}`, {
      function: functionName,
      context: this.context,
      returnValue: returnValue ? this.sanitizeParams(returnValue) : undefined,
      executionTime,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log function error
   */
  error(functionName: string, error: any, executionTime?: number): void {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const timeStr = executionTime ? ` (${executionTime}ms)` : '';
    
    console.error(`❌ [${timestamp}] ${this.context}.${functionName}() ERROR${timeStr}`, {
      function: functionName,
      context: this.context,
      error: {
        message: error?.message,
        name: error?.name,
        stack: error?.stack?.split('\n').slice(0, 3) // Limit stack trace
      },
      executionTime,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log intermediate steps within a function
   */
  step(functionName: string, stepName: string, data?: any): void {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    
    console.log(`🔵 [${timestamp}] ${this.context}.${functionName}() -> ${stepName}`, {
      function: functionName,
      context: this.context,
      step: stepName,
      data: data ? this.sanitizeParams(data) : undefined,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Sanitize parameters to avoid logging sensitive data
   */
  private sanitizeParams(obj: any): any {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      // Check for potential tokens or sensitive data
      if (obj.length > 100 || obj.includes('Bearer') || obj.includes('token')) {
        return `[STRING:${obj.length}chars]`;
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeParams(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sensitive keys to mask
        const sensitiveKeys = [
          'password', 'token', 'secret', 'key', 'auth', 'credential',
          'authToken', 'accessToken', 'refreshToken', 'apiKey'
        ];
        
        if (sensitiveKeys.some(sensitive => 
          key.toLowerCase().includes(sensitive.toLowerCase())
        )) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'string' && value.length > 200) {
          sanitized[key] = `[LONG_STRING:${value.length}chars]`;
        } else {
          sanitized[key] = this.sanitizeParams(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }
}

/**
 * Function wrapper that automatically logs entrance and exit
 */
export function debugWrap<T extends (...args: any[]) => any>(
  context: string,
  functionName: string,
  fn: T,
  forceEnabled?: boolean
): T {
  const logger = new DebugLogger(context, forceEnabled);
  
  return ((...args: any[]) => {
    const startTime = Date.now();
    logger.enter(functionName, args);
    
    try {
      const result = fn(...args);
      
      // Handle Promise returns
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            const executionTime = Date.now() - startTime;
            logger.exit(functionName, value, executionTime);
            return value;
          })
          .catch((error: any) => {
            const executionTime = Date.now() - startTime;
            logger.error(functionName, error, executionTime);
            throw error;
          });
      }
      
      // Handle synchronous returns
      const executionTime = Date.now() - startTime;
      logger.exit(functionName, result, executionTime);
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(functionName, error, executionTime);
      throw error;
    }
  }) as T;
}

/**
 * Decorator for class methods (TypeScript)
 */
export function debugMethod(context?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = context || target.constructor.name;
    
    descriptor.value = debugWrap(className, propertyKey, originalMethod);
    return descriptor;
  };
}

/**
 * Global debug control functions
 */
export const debugControl = {
  enable: () => {
    localStorage.setItem('debug_mode', 'true');
    DEBUG_ENABLED = true;
    console.log('🐛 Debug mode ENABLED');
  },
  
  disable: () => {
    localStorage.setItem('debug_mode', 'false');
    DEBUG_ENABLED = false;
    console.log('🐛 Debug mode DISABLED');
  },
  
  status: () => {
    console.log('🐛 Debug mode status:', {
      enabled: DEBUG_ENABLED,
      envVar: import.meta.env.VITE_DEBUG_MODE,
      localStorage: localStorage.getItem('debug_mode'),
      urlParam: new URLSearchParams(window.location.search).get('debug')
    });
    return DEBUG_ENABLED;
  },
  
  clear: () => {
    localStorage.removeItem('debug_mode');
    DEBUG_ENABLED = getDebugMode();
    console.log('🐛 Debug mode reset to default:', DEBUG_ENABLED);
  }
};

// Make debug control available globally for easy runtime control
if (typeof window !== 'undefined') {
  (window as any).debug = debugControl;
}

export { DEBUG_ENABLED };
export default DebugLogger;