/**
 * Cookie Debugger Utility
 * Provides debugging tools and real-time monitoring for cookie capture
 */

import { advancedCookieCapture, CapturedCookie } from './advancedCookieCapture';

export class CookieDebugger {
  private debugMode: boolean = false;
  private logHistory: string[] = [];
  private maxLogHistory: number = 1000;

  constructor() {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;
    
    // Enable debug mode in development
    this.debugMode = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') || 
                    localStorage.getItem('cookie_debug') === 'true';
    
    if (this.debugMode) {
      this.initializeDebugMode();
    }
  }

  private initializeDebugMode() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    console.log('🐛 Cookie Debugger initialized');
    
    // Add debug styles
    this.addDebugStyles();
    
    // Create debug panel
    this.createDebugPanel();
    
    // Monitor cookie changes
    advancedCookieCapture.onCookieChange((cookies) => {
      this.updateDebugPanel(cookies);
    });
  }

  private addDebugStyles() {
    if (typeof document === 'undefined') return;
    
    const style = document.createElement('style');
    style.textContent = `
      #cookie-debug-panel {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        max-height: 600px;
        background: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        border: 1px solid #00ff00;
        border-radius: 5px;
        padding: 10px;
        z-index: 10000;
        overflow-y: auto;
        display: none;
      }
      
      #cookie-debug-panel.visible {
        display: block;
      }
      
      .debug-header {
        color: #ffff00;
        font-weight: bold;
        margin-bottom: 10px;
        border-bottom: 1px solid #333;
        padding-bottom: 5px;
      }
      
      .debug-section {
        margin-bottom: 15px;
      }
      
      .debug-section h4 {
        color: #00ffff;
        margin: 0 0 5px 0;
      }
      
      .cookie-item {
        background: rgba(0, 255, 0, 0.1);
        margin: 2px 0;
        padding: 3px;
        border-left: 2px solid #00ff00;
      }
      
      .cookie-name {
        color: #ffff00;
        font-weight: bold;
      }
      
      .cookie-domain {
        color: #ff8800;
      }
      
      .cookie-method {
        color: #ff00ff;
        font-size: 10px;
      }
      
      .debug-toggle {
        position: fixed;
        top: 10px;
        right: 420px;
        background: #000;
        color: #00ff00;
        border: 1px solid #00ff00;
        padding: 5px 10px;
        cursor: pointer;
        z-index: 10001;
        font-family: monospace;
      }
    `;
    document.head.appendChild(style);
  }

  private createDebugPanel() {
    if (typeof document === 'undefined') return;
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'cookie-debug-toggle';
    toggleButton.className = 'debug-toggle';
    toggleButton.textContent = '🍪 DEBUG';
    toggleButton.onclick = () => this.toggleDebugPanel();
    document.body.appendChild(toggleButton);

    // Create debug panel
    const panel = document.createElement('div');
    panel.id = 'cookie-debug-panel';
    panel.innerHTML = `
      <div class="debug-header">🍪 Cookie Capture Debugger</div>
      <div id="debug-content">
        <div class="debug-section">
          <h4>📊 Statistics</h4>
          <div id="debug-stats">Loading...</div>
        </div>
        <div class="debug-section">
          <h4>🍪 Captured Cookies</h4>
          <div id="debug-cookies">No cookies captured yet</div>
        </div>
        <div class="debug-section">
          <h4>📝 Recent Activity</h4>
          <div id="debug-logs">No activity yet</div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Add keyboard shortcut (Ctrl+Shift+C)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        this.toggleDebugPanel();
      }
    });
  }

  private toggleDebugPanel() {
    const panel = document.getElementById('cookie-debug-panel');
    if (panel) {
      panel.classList.toggle('visible');
    }
  }

  private updateDebugPanel(cookies: CapturedCookie[]) {
    const statsEl = document.getElementById('debug-stats');
    const cookiesEl = document.getElementById('debug-cookies');
    const logsEl = document.getElementById('debug-logs');

    if (statsEl) {
      const stats = advancedCookieCapture.getStats();
      statsEl.innerHTML = `
        <div>Total: ${stats.total}</div>
        <div>Auth Cookies: ${stats.authCookies}</div>
        <div>By Method:</div>
        ${Object.entries(stats.byMethod).map(([method, count]) => 
          `<div style="margin-left: 10px;">${method}: ${count}</div>`
        ).join('')}
        <div>By Domain:</div>
        ${Object.entries(stats.byDomain).slice(0, 5).map(([domain, count]) => 
          `<div style="margin-left: 10px;">${domain}: ${count}</div>`
        ).join('')}
      `;
    }

    if (cookiesEl) {
      if (cookies.length === 0) {
        cookiesEl.innerHTML = '<div style="color: #ff0000;">No cookies captured yet</div>';
      } else {
        cookiesEl.innerHTML = cookies.slice(-10).map(cookie => `
          <div class="cookie-item">
            <div class="cookie-name">${cookie.name}</div>
            <div class="cookie-domain">${cookie.domain}</div>
            <div class="cookie-method">[${cookie.captureMethod}] ${cookie.timestamp}</div>
          </div>
        `).join('');
      }
    }

    if (logsEl) {
      logsEl.innerHTML = this.logHistory.slice(-10).map(log => 
        `<div style="margin: 2px 0; font-size: 10px;">${log}</div>`
      ).join('');
    }
  }

  public log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '#00ffff',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000'
    };
    
    const logEntry = `<span style="color: ${colors[type]}">[${timestamp}] ${message}</span>`;
    this.logHistory.push(logEntry);
    
    // Keep log history manageable
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory = this.logHistory.slice(-this.maxLogHistory / 2);
    }

    if (this.debugMode) {
      console.log(`🍪 [${type.toUpperCase()}] ${message}`);
    }
  }

  public exportDebugData() {
    const cookies = advancedCookieCapture.getAllCookies();
    const stats = advancedCookieCapture.getStats();
    
    const debugData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      cookies: cookies,
      stats: stats,
      logs: this.logHistory,
      browserInfo: {
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform,
        documentCookies: document.cookie
      }
    };

    // Create downloadable file
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log('Debug data exported', 'success');
  }

  public enableDebugMode() {
    if (typeof window === 'undefined') return;
    
    this.debugMode = true;
    localStorage.setItem('cookie_debug', 'true');
    this.initializeDebugMode();
  }

  public disableDebugMode() {
    if (typeof window === 'undefined') return;
    
    this.debugMode = false;
    localStorage.removeItem('cookie_debug');
    
    // Remove debug elements
    const panel = document.getElementById('cookie-debug-panel');
    const toggle = document.getElementById('cookie-debug-toggle');
    if (panel) panel.remove();
    if (toggle) toggle.remove();
  }

  public getCookieReport(): string {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const cookies = advancedCookieCapture.getAllCookies();
    const stats = advancedCookieCapture.getStats();
    
    let report = `🍪 Cookie Capture Report\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `URL: ${window.location.href}\n\n`;
    
    report += `📊 Statistics:\n`;
    report += `Total Cookies: ${stats.total}\n`;
    report += `Auth Cookies: ${stats.authCookies}\n\n`;
    
    report += `📈 By Capture Method:\n`;
    Object.entries(stats.byMethod).forEach(([method, count]) => {
      report += `  ${method}: ${count}\n`;
    });
    report += `\n`;
    
    report += `🌐 By Domain:\n`;
    Object.entries(stats.byDomain).forEach(([domain, count]) => {
      report += `  ${domain}: ${count}\n`;
    });
    report += `\n`;
    
    report += `🍪 Cookie Details:\n`;
    cookies.forEach((cookie, index) => {
      report += `${index + 1}. ${cookie.name}\n`;
      report += `   Domain: ${cookie.domain}\n`;
      report += `   Method: ${cookie.captureMethod}\n`;
      report += `   Timestamp: ${cookie.timestamp}\n\n`;
    });
    
    return report;
  }
}

// Create singleton instance
export const cookieDebugger = new CookieDebugger();

// Add global debug functions
declare global {
  interface Window {
    cookieDebug: {
      enable: () => void;
      disable: () => void;
      export: () => void;
      report: () => string;
      stats: () => any;
    };
  }
}

window.cookieDebug = {
  enable: () => cookieDebugger.enableDebugMode(),
  disable: () => cookieDebugger.disableDebugMode(),
  export: () => cookieDebugger.exportDebugData(),
  report: () => cookieDebugger.getCookieReport(),
  stats: () => advancedCookieCapture.getStats()
};