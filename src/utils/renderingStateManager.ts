/**
 * Global Rendering State Manager
 * Prevents multiple concurrent dashboard initializations and API calls
 */

export type RenderingState = 'idle' | 'started' | 'ongoing' | 'complete';

interface RenderingSession {
  state: RenderingState;
  sessionId: string;
  startTime: number;
  component: string;
  userId?: string;
}

class RenderingStateManager {
  private currentSession: RenderingSession | null = null;
  private listeners: Set<(session: RenderingSession | null) => void> = new Set();

  /**
   * Start a new rendering session
   * Returns true if session started successfully, false if blocked
   */
  startSession(component: string, userId?: string): { success: boolean; sessionId?: string } {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    
    // Check if there's already an active session
    if (this.currentSession && (this.currentSession.state === 'started' || this.currentSession.state === 'ongoing')) {
      console.warn(`🚫 [${timestamp}] RenderingManager: Blocked ${component} - Active session: ${this.currentSession.component} (${this.currentSession.sessionId})`);
      return { success: false };
    }

    // Create new session
    const sessionId = Math.random().toString(36).substring(2, 9);
    this.currentSession = {
      state: 'started',
      sessionId,
      startTime: Date.now(),
      component,
      userId
    };

    console.log(`🟢 [${timestamp}] RenderingManager: Started session ${sessionId} for ${component} (user: ${userId || 'guest'})`);
    this.notifyListeners();
    
    return { success: true, sessionId };
  }

  /**
   * Update session state to ongoing
   */
  setOngoing(sessionId: string): boolean {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    
    if (!this.currentSession || this.currentSession.sessionId !== sessionId) {
      console.warn(`🚫 [${timestamp}] RenderingManager: Invalid session ${sessionId} for setOngoing`);
      return false;
    }

    this.currentSession.state = 'ongoing';
    console.log(`🟡 [${timestamp}] RenderingManager: Session ${sessionId} now ONGOING`);
    this.notifyListeners();
    return true;
  }

  /**
   * Complete the rendering session
   */
  completeSession(sessionId: string): boolean {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    
    if (!this.currentSession || this.currentSession.sessionId !== sessionId) {
      console.warn(`🚫 [${timestamp}] RenderingManager: Invalid session ${sessionId} for completion`);
      return false;
    }

    const duration = Date.now() - this.currentSession.startTime;
    console.log(`✅ [${timestamp}] RenderingManager: Session ${sessionId} COMPLETED (${duration}ms) - ${this.currentSession.component}`);
    
    this.currentSession.state = 'complete';
    
    // Clear session after a brief delay to prevent immediate re-initialization
    setTimeout(() => {
      this.currentSession = null;
      this.notifyListeners();
    }, 100);
    
    this.notifyListeners();
    return true;
  }

  /**
   * Force clear current session (emergency reset)
   */
  clearSession(): void {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    
    if (this.currentSession) {
      console.log(`🔄 [${timestamp}] RenderingManager: Force clearing session ${this.currentSession.sessionId}`);
    }
    
    this.currentSession = null;
    this.notifyListeners();
  }

  /**
   * Get current session info
   */
  getCurrentSession(): RenderingSession | null {
    return this.currentSession;
  }

  /**
   * Check if rendering is blocked for a component
   */
  isBlocked(component: string): boolean {
    if (!this.currentSession) return false;
    
    const isActive = this.currentSession.state === 'started' || this.currentSession.state === 'ongoing';
    const isDifferentComponent = this.currentSession.component !== component;
    
    return isActive && isDifferentComponent;
  }

  /**
   * Check if the same component is already being rendered
   */
  isDuplicateRender(component: string): boolean {
    if (!this.currentSession) return false;
    
    const isActive = this.currentSession.state === 'started' || this.currentSession.state === 'ongoing';
    const isSameComponent = this.currentSession.component === component;
    
    return isActive && isSameComponent;
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: (session: RenderingSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of session changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentSession));
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(): number {
    if (!this.currentSession) return 0;
    return Date.now() - this.currentSession.startTime;
  }

  /**
   * Emergency timeout - clear session if it's been running too long
   */
  checkTimeout(maxDuration = 10000): void {
    if (this.currentSession && this.getSessionDuration() > maxDuration) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.warn(`⏰ [${timestamp}] RenderingManager: Session ${this.currentSession.sessionId} timed out after ${maxDuration}ms - force clearing`);
      this.clearSession();
    }
  }
}

// Global singleton instance
export const renderingStateManager = new RenderingStateManager();

// Auto-cleanup on timeout every 5 seconds
setInterval(() => {
  renderingStateManager.checkTimeout();
}, 5000);

export default renderingStateManager;