/**
 * Advanced Security Service for Phase 4
 * Provides comprehensive security features including audit logging,
 * CSRF protection, input sanitization, and security monitoring.
 */

import { Request, Response } from 'express';
import crypto from 'crypto';

interface SecurityEvent {
  timestamp: Date;
  eventType: string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string | undefined;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface CSRFToken {
  token: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private securityEvents: SecurityEvent[] = [];
  private csrfTokens: Map<string, CSRFToken> = new Map();
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private sessionTimeouts: Map<string, Date> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start security monitoring only in production/development, not during tests
    if (process.env.NODE_ENV !== 'test') {
      this.startSecurityMonitoring();
    }
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Log security events with comprehensive details
   */
  public logSecurityEvent(
    eventType: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    req?: Request
  ): void {
    const event: SecurityEvent = {
      timestamp: new Date(),
      eventType,
      userId: (req as any)?.session?.userId,
      sessionId: (req as any)?.sessionID,
      ipAddress: req?.ip || (req as any)?.connection?.remoteAddress || 'unknown',
      userAgent: req?.get('User-Agent'),
      details,
      severity
    };

    this.securityEvents.push(event);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log to console for development
    console.log(`🔒 SECURITY EVENT [${severity.toUpperCase()}]: ${eventType}`, {
      timestamp: event.timestamp,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details
    });

    // Alert on critical events
    if (severity === 'critical') {
      this.alertSecurityEvent(event);
    }
  }

  /**
   * Generate and validate CSRF tokens
   */
  public generateCSRFToken(userId: string, sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const csrfToken: CSRFToken = {
      token,
      timestamp: new Date(),
      userId,
      sessionId
    };

    this.csrfTokens.set(token, csrfToken);
    
    // Clean up old tokens (older than 1 hour)
    this.cleanupOldCSRFTokens();
    
    return token;
  }

  public validateCSRFToken(token: string, userId: string, sessionId: string): boolean {
    const csrfToken = this.csrfTokens.get(token);
    
    if (!csrfToken) {
      this.logSecurityEvent('CSRF_TOKEN_NOT_FOUND', { token, userId, sessionId }, 'high');
      return false;
    }

    // Check if token is expired (1 hour)
    const now = new Date();
    const tokenAge = now.getTime() - csrfToken.timestamp.getTime();
    if (tokenAge > 3600000) { // 1 hour
      this.csrfTokens.delete(token);
      this.logSecurityEvent('CSRF_TOKEN_EXPIRED', { token, userId, sessionId }, 'medium');
      return false;
    }

    // Check if token belongs to correct user and session
    if (csrfToken.userId !== userId || csrfToken.sessionId !== sessionId) {
      this.logSecurityEvent('CSRF_TOKEN_MISMATCH', { 
        token, 
        expectedUserId: userId, 
        expectedSessionId: sessionId,
        actualUserId: csrfToken.userId,
        actualSessionId: csrfToken.sessionId
      }, 'high');
      return false;
    }

    // Remove token after successful validation (one-time use)
    this.csrfTokens.delete(token);
    return true;
  }

  /**
   * Sanitize and validate user input
   */
  public sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Check session security and handle timeouts
   */
  public checkSessionSecurity(sessionId: string, userId: string): boolean {
    const timeoutKey = `${sessionId}:${userId}`;
    const lastActivity = this.sessionTimeouts.get(timeoutKey);
    
    if (!lastActivity) {
      this.sessionTimeouts.set(timeoutKey, new Date());
      return true;
    }

    // Check for session timeout (30 minutes of inactivity)
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
    
    if (timeSinceLastActivity > 1800000) { // 30 minutes
      this.sessionTimeouts.delete(timeoutKey);
      this.logSecurityEvent('SESSION_TIMEOUT', { sessionId, userId, timeSinceLastActivity }, 'medium');
      return false;
    }

    // Update last activity
    this.sessionTimeouts.set(timeoutKey, now);
    return true;
  }

  /**
   * Generate security headers for responses
   */
  public generateSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  /**
   * Monitor security events and detect suspicious patterns
   */
  private startSecurityMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.analyzeSecurityPatterns();
      this.cleanupOldData();
    }, 60000); // Run every minute
  }

  /**
   * Stop security monitoring (for testing)
   */
  public stopSecurityMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Manually trigger security pattern analysis (for testing)
   */
  public triggerSecurityAnalysis(): void {
    this.analyzeSecurityPatterns();
    this.cleanupOldData();
  }

  private analyzeSecurityPatterns(): void {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 300000);
    
    // Check for multiple failed attempts from same IP
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp > last5Minutes && 
      (event.eventType.includes('FAILED') || event.eventType.includes('BLOCKED'))
    );

    const ipCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      const count = ipCounts.get(event.ipAddress) || 0;
      ipCounts.set(event.ipAddress, count + 1);
    });

    // Alert on suspicious activity
    ipCounts.forEach((count, ip) => {
      if (count > 10) {
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
          ipAddress: ip,
          eventCount: count,
          timeWindow: '5 minutes'
        }, 'high');
      }
    });
  }

  private alertSecurityEvent(event: SecurityEvent): void {
    console.error(`🚨 CRITICAL SECURITY ALERT: ${event.eventType}`, {
      timestamp: event.timestamp,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: event.details
    });
    
    // In a production environment, this would send alerts to:
    // - Security team email/SMS
    // - Security monitoring dashboard
    // - Incident response system
  }

  private cleanupOldCSRFTokens(): void {
    const now = new Date();
    for (const [token, csrfToken] of this.csrfTokens.entries()) {
      const age = now.getTime() - csrfToken.timestamp.getTime();
      if (age > 3600000) { // 1 hour
        this.csrfTokens.delete(token);
      }
    }
  }

  private cleanupOldData(): void {
    const now = new Date();
    
    // Clean up old security events (keep last 24 hours)
    const cutoff = new Date(now.getTime() - 86400000);
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoff);
    
    // Clean up old session timeouts
    for (const [key, lastActivity] of this.sessionTimeouts.entries()) {
      if (now.getTime() - lastActivity.getTime() > 1800000) { // 30 minutes
        this.sessionTimeouts.delete(key);
      }
    }
  }

  /**
   * Get security statistics for monitoring dashboard
   */
  public getSecurityStats(): any {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 86400000);
    
    const recentEvents = this.securityEvents.filter(event => event.timestamp > last24Hours);
    
    const stats = {
      totalEvents: recentEvents.length,
      criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
      highSeverityEvents: recentEvents.filter(e => e.severity === 'high').length,
      activeSessions: this.sessionTimeouts.size,
      activeCSRFTokens: this.csrfTokens.size,
      topEventTypes: this.getTopEventTypes(recentEvents),
      topIPAddresses: this.getTopIPAddresses(recentEvents)
    };

    return stats;
  }

  private getTopEventTypes(events: SecurityEvent[]): Array<{ type: string; count: number }> {
    const counts = new Map<string, number>();
    events.forEach(event => {
      const count = counts.get(event.eventType) || 0;
      counts.set(event.eventType, count + 1);
    });

    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopIPAddresses(events: SecurityEvent[]): Array<{ ip: string; count: number }> {
    const counts = new Map<string, number>();
    events.forEach(event => {
      const count = counts.get(event.ipAddress) || 0;
      counts.set(event.ipAddress, count + 1);
    });

    return Array.from(counts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

export default SecurityService;
