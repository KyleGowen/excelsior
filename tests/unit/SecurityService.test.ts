/**
 * Comprehensive unit tests for SecurityService
 * Tests all security features including CSRF protection, input sanitization,
 * session security, security monitoring, and audit logging.
 */

import SecurityService from '../../src/services/SecurityService';
import { Request } from 'express';

// Extend Request interface to include session properties
interface RequestWithSession extends Request {
  session?: {
    userId?: string;
    destroy: (callback: (err?: any) => void) => void;
  };
  sessionID?: string;
}

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('SecurityService', () => {
  let securityService: SecurityService;
  let mockRequest: Partial<RequestWithSession>;

  beforeEach(() => {
    // Reset the singleton instance for each test
    (SecurityService as any).instance = undefined;
    securityService = SecurityService.getInstance();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    // Create mock request object
    mockRequest = {
      ip: '192.168.1.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser'),
      session: {
        userId: 'test-user-123',
        destroy: jest.fn()
      },
      sessionID: 'test-session-456'
    };
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Stop monitoring to prevent interference between tests
    securityService.stopSecurityMonitoring();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecurityService.getInstance();
      const instance2 = SecurityService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance when previous is undefined', () => {
      (SecurityService as any).instance = undefined;
      const instance = SecurityService.getInstance();
      expect(instance).toBeInstanceOf(SecurityService);
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events with correct structure', () => {
      const eventType = 'TEST_EVENT';
      const details = { test: 'data' };
      const severity = 'medium';

      securityService.logSecurityEvent(eventType, details, severity, mockRequest as Request);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔒 SECURITY EVENT [MEDIUM]: TEST_EVENT'),
        expect.objectContaining({
          timestamp: expect.any(Date),
          userId: 'test-user-123',
          ipAddress: '192.168.1.1',
          details: { test: 'data' }
        })
      );
    });

    it('should log events without request object', () => {
      const eventType = 'NO_REQUEST_EVENT';
      const details = { test: 'data' };

      securityService.logSecurityEvent(eventType, details, 'low');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔒 SECURITY EVENT [LOW]: NO_REQUEST_EVENT'),
        expect.objectContaining({
          timestamp: expect.any(Date),
          userId: undefined,
          ipAddress: 'unknown',
          details: { test: 'data' }
        })
      );
    });

    it('should handle different severity levels', () => {
      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
      
      severities.forEach(severity => {
        securityService.logSecurityEvent(`TEST_${severity.toUpperCase()}`, {}, severity, mockRequest as Request);
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(`🔒 SECURITY EVENT [${severity.toUpperCase()}]: TEST_${severity.toUpperCase()}`),
          expect.any(Object)
        );
      });
    });

    it('should limit security events to 1000 entries', () => {
      // Add 1001 events
      for (let i = 0; i < 1001; i++) {
        securityService.logSecurityEvent(`EVENT_${i}`, { index: i }, 'low');
      }

      const stats = securityService.getSecurityStats();
      expect(stats.totalEvents).toBeLessThanOrEqual(1000);
    });

    it('should alert on critical events', () => {
      securityService.logSecurityEvent('CRITICAL_TEST', { test: 'critical' }, 'critical', mockRequest as Request);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('🚨 CRITICAL SECURITY ALERT: CRITICAL_TEST'),
        expect.objectContaining({
          timestamp: expect.any(Date),
          userId: 'test-user-123',
          ipAddress: '192.168.1.1',
          details: { test: 'critical' }
        })
      );
    });
  });

  describe('CSRF Token Management', () => {
    it('should generate valid CSRF tokens', () => {
      const userId = 'test-user-123';
      const sessionId = 'test-session-456';
      
      const token = securityService.generateCSRFToken(userId, sessionId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should validate correct CSRF tokens', () => {
      const userId = 'test-user-123';
      const sessionId = 'test-session-456';
      
      const token = securityService.generateCSRFToken(userId, sessionId);
      const isValid = securityService.validateCSRFToken(token, userId, sessionId);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF tokens', () => {
      const userId = 'test-user-123';
      const sessionId = 'test-session-456';
      
      const isValid = securityService.validateCSRFToken('invalid-token', userId, sessionId);
      expect(isValid).toBe(false);
    });

    it('should reject CSRF tokens for wrong user', () => {
      const userId = 'test-user-123';
      const sessionId = 'test-session-456';
      const wrongUserId = 'wrong-user-789';
      
      const token = securityService.generateCSRFToken(userId, sessionId);
      const isValid = securityService.validateCSRFToken(token, wrongUserId, sessionId);
      
      expect(isValid).toBe(false);
    });

    it('should reject CSRF tokens for wrong session', () => {
      const userId = 'test-user-123';
      const sessionId = 'test-session-456';
      const wrongSessionId = 'wrong-session-789';
      
      const token = securityService.generateCSRFToken(userId, sessionId);
      const isValid = securityService.validateCSRFToken(token, userId, wrongSessionId);
      
      expect(isValid).toBe(false);
    });

    it('should make CSRF tokens one-time use', () => {
      const userId = 'test-user-123';
      const sessionId = 'test-session-456';
      
      const token = securityService.generateCSRFToken(userId, sessionId);
      
      // First validation should succeed
      expect(securityService.validateCSRFToken(token, userId, sessionId)).toBe(true);
      
      // Second validation should fail (token consumed)
      expect(securityService.validateCSRFToken(token, userId, sessionId)).toBe(false);
    });

    it('should log security events for invalid CSRF tokens', () => {
      const userId = 'test-user-123';
      const sessionId = 'test-session-456';
      
      securityService.validateCSRFToken('invalid-token', userId, sessionId);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔒 SECURITY EVENT [HIGH]: CSRF_TOKEN_NOT_FOUND'),
        expect.any(Object)
      );
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS script tags', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = securityService.sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('Hello World');
    });

    it('should sanitize javascript: URLs', () => {
      const maliciousInput = 'javascript:alert("xss")';
      const sanitized = securityService.sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('alert("xss")');
    });

    it('should sanitize event handlers', () => {
      const maliciousInput = '<img src="x" onerror="alert(\'xss\')">';
      const sanitized = securityService.sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('<img src="x" "alert(\'xss\')">');
    });

    it('should sanitize arrays recursively', () => {
      const maliciousArray = [
        '<script>alert("xss")</script>',
        'normal text',
        '<img onerror="alert(\'xss\')">'
      ];
      const sanitized = securityService.sanitizeInput(maliciousArray);
      
      expect(sanitized).toEqual([
        '',
        'normal text',
        '<img "alert(\'xss\')">'
      ]);
    });

    it('should sanitize objects recursively', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>',
        description: 'normal text',
        nested: {
          value: '<img onerror="alert(\'xss\')">'
        }
      };
      const sanitized = securityService.sanitizeInput(maliciousObject);
      
      expect(sanitized).toEqual({
        name: '',
        description: 'normal text',
        nested: {
          value: '<img "alert(\'xss\')">'
        }
      });
    });

    it('should handle non-string inputs', () => {
      expect(securityService.sanitizeInput(123)).toBe(123);
      expect(securityService.sanitizeInput(true)).toBe(true);
      expect(securityService.sanitizeInput(null)).toBe(null);
      expect(securityService.sanitizeInput(undefined)).toBe(undefined);
    });

    it('should trim whitespace from strings', () => {
      const input = '  hello world  ';
      const sanitized = securityService.sanitizeInput(input);
      
      expect(sanitized).toBe('hello world');
    });
  });

  describe('Session Security', () => {
    it('should allow new sessions', () => {
      const sessionId = 'new-session-123';
      const userId = 'new-user-456';
      
      const isValid = securityService.checkSessionSecurity(sessionId, userId);
      expect(isValid).toBe(true);
    });

    it('should allow active sessions within timeout', () => {
      const sessionId = 'active-session-123';
      const userId = 'active-user-456';
      
      // First check creates the session
      securityService.checkSessionSecurity(sessionId, userId);
      
      // Second check should still be valid (within 30 minutes)
      const isValid = securityService.checkSessionSecurity(sessionId, userId);
      expect(isValid).toBe(true);
    });

    it('should update session activity timestamp', () => {
      const sessionId = 'update-session-123';
      const userId = 'update-user-456';
      
      const firstCheck = securityService.checkSessionSecurity(sessionId, userId);
      expect(firstCheck).toBe(true);
      
      // Simulate time passing by manually setting an old timestamp
      const timeoutKey = `${sessionId}:${userId}`;
      const oldDate = new Date(Date.now() - 2000000); // 33 minutes ago
      (securityService as any).sessionTimeouts.set(timeoutKey, oldDate);
      
      const secondCheck = securityService.checkSessionSecurity(sessionId, userId);
      expect(secondCheck).toBe(false);
    });

    it('should log session timeout events', () => {
      const sessionId = 'timeout-session-123';
      const userId = 'timeout-user-456';
      
      // Create session
      securityService.checkSessionSecurity(sessionId, userId);
      
      // Force timeout by setting old timestamp
      const timeoutKey = `${sessionId}:${userId}`;
      const oldDate = new Date(Date.now() - 2000000); // 33 minutes ago
      (securityService as any).sessionTimeouts.set(timeoutKey, oldDate);
      
      securityService.checkSessionSecurity(sessionId, userId);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔒 SECURITY EVENT [MEDIUM]: SESSION_TIMEOUT'),
        expect.any(Object)
      );
    });
  });

  describe('Security Headers', () => {
    it('should generate comprehensive security headers', () => {
      const headers = securityService.generateSecurityHeaders();
      
      expect(headers).toEqual({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
      });
    });

    it('should return headers as string values', () => {
      const headers = securityService.generateSecurityHeaders();
      
      Object.values(headers).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('Security Monitoring', () => {
    it('should start and stop security monitoring', () => {
      // Monitoring should not be running in test environment by default
      expect((securityService as any).monitoringInterval).toBeNull();
      
      // Test that stopSecurityMonitoring doesn't throw
      expect(() => securityService.stopSecurityMonitoring()).not.toThrow();
    });

    it('should trigger security analysis manually', () => {
      // Add some security events
      securityService.logSecurityEvent('TEST_EVENT_1', {}, 'low');
      securityService.logSecurityEvent('TEST_EVENT_2', {}, 'medium');
      
      // Trigger analysis
      expect(() => securityService.triggerSecurityAnalysis()).not.toThrow();
    });

    it('should detect suspicious activity patterns', () => {
      const suspiciousIP = '192.168.1.100';
      
      // Create mock request with suspicious IP
      const suspiciousRequest = {
        ...mockRequest,
        ip: suspiciousIP
      };
      
      // Add multiple failed events from same IP
      for (let i = 0; i < 15; i++) {
        securityService.logSecurityEvent('LOGIN_FAILED', { attempt: i }, 'high', suspiciousRequest as Request);
      }
      
      // Trigger analysis
      securityService.triggerSecurityAnalysis();
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔒 SECURITY EVENT [HIGH]: SUSPICIOUS_ACTIVITY_DETECTED'),
        expect.any(Object)
      );
    });
  });

  describe('Security Statistics', () => {
    it('should provide comprehensive security statistics', () => {
      // Add various types of events
      securityService.logSecurityEvent('LOGIN_SUCCESS', {}, 'low');
      securityService.logSecurityEvent('LOGIN_FAILED', {}, 'high');
      securityService.logSecurityEvent('CRITICAL_ERROR', {}, 'critical');
      
      const stats = securityService.getSecurityStats();
      
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('criticalEvents');
      expect(stats).toHaveProperty('highSeverityEvents');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('activeCSRFTokens');
      expect(stats).toHaveProperty('topEventTypes');
      expect(stats).toHaveProperty('topIPAddresses');
    });

    it('should count events by severity correctly', () => {
      securityService.logSecurityEvent('LOW_EVENT', {}, 'low');
      securityService.logSecurityEvent('MEDIUM_EVENT', {}, 'medium');
      securityService.logSecurityEvent('HIGH_EVENT', {}, 'high');
      securityService.logSecurityEvent('CRITICAL_EVENT', {}, 'critical');
      
      const stats = securityService.getSecurityStats();
      
      expect(stats.criticalEvents).toBe(1);
      expect(stats.highSeverityEvents).toBe(1);
    });

    it('should track active sessions and CSRF tokens', () => {
      // Create a session
      securityService.checkSessionSecurity('session-123', 'user-456');
      
      // Generate a CSRF token
      securityService.generateCSRFToken('user-789', 'session-101');
      
      const stats = securityService.getSecurityStats();
      
      expect(stats.activeSessions).toBe(1);
      expect(stats.activeCSRFTokens).toBe(1);
    });

    it('should provide top event types', () => {
      // Add multiple events of same type
      for (let i = 0; i < 5; i++) {
        securityService.logSecurityEvent('COMMON_EVENT', {}, 'low');
      }
      securityService.logSecurityEvent('RARE_EVENT', {}, 'low');
      
      const stats = securityService.getSecurityStats();
      
      expect(stats.topEventTypes).toBeInstanceOf(Array);
      expect(stats.topEventTypes.length).toBeGreaterThan(0);
      expect(stats.topEventTypes[0]).toHaveProperty('type');
      expect(stats.topEventTypes[0]).toHaveProperty('count');
    });

    it('should provide top IP addresses', () => {
      // Add events from different IPs
      const request1 = { ...mockRequest, ip: '192.168.1.1' };
      const request2 = { ...mockRequest, ip: '192.168.1.2' };
      
      securityService.logSecurityEvent('EVENT_1', {}, 'low', request1 as Request);
      securityService.logSecurityEvent('EVENT_2', {}, 'low', request1 as Request);
      securityService.logSecurityEvent('EVENT_3', {}, 'low', request2 as Request);
      
      const stats = securityService.getSecurityStats();
      
      expect(stats.topIPAddresses).toBeInstanceOf(Array);
      expect(stats.topIPAddresses.length).toBeGreaterThan(0);
      expect(stats.topIPAddresses[0]).toHaveProperty('ip');
      expect(stats.topIPAddresses[0]).toHaveProperty('count');
    });
  });

  describe('Data Cleanup', () => {
    it('should clean up old CSRF tokens', () => {
      const userId = 'user-123';
      const sessionId = 'session-456';
      
      // Generate a token
      const token = securityService.generateCSRFToken(userId, sessionId);
      
      // Manually set old timestamp
      const csrfToken = (securityService as any).csrfTokens.get(token);
      csrfToken.timestamp = new Date(Date.now() - 4000000); // 1+ hours ago
      
      // Manually trigger cleanup (since generateCSRFToken also calls cleanup)
      (securityService as any).cleanupOldCSRFTokens();
      
      // Token should be removed
      expect((securityService as any).csrfTokens.has(token)).toBe(false);
    });

    it('should clean up old security events', () => {
      // Add an old event
      const oldEvent = {
        timestamp: new Date(Date.now() - 90000000), // 25+ hours ago
        eventType: 'OLD_EVENT',
        ipAddress: '192.168.1.1',
        details: {},
        severity: 'low' as const
      };
      (securityService as any).securityEvents.push(oldEvent);
      
      // Add a recent event
      securityService.logSecurityEvent('RECENT_EVENT', {}, 'low');
      
      // Trigger cleanup
      securityService.triggerSecurityAnalysis();
      
      const stats = securityService.getSecurityStats();
      expect(stats.totalEvents).toBe(1); // Only recent event should remain
    });

    it('should clean up old session timeouts', () => {
      const sessionId = 'old-session-123';
      const userId = 'old-user-456';
      
      // Create session
      securityService.checkSessionSecurity(sessionId, userId);
      
      // Manually set old timestamp
      const timeoutKey = `${sessionId}:${userId}`;
      const oldDate = new Date(Date.now() - 4000000); // 1+ hours ago
      (securityService as any).sessionTimeouts.set(timeoutKey, oldDate);
      
      // Trigger cleanup
      securityService.triggerSecurityAnalysis();
      
      // Session should be removed
      expect((securityService as any).sessionTimeouts.has(timeoutKey)).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing request properties gracefully', () => {
      const incompleteRequest = {
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
        session: undefined,
        sessionID: undefined
      };
      
      expect(() => {
        securityService.logSecurityEvent('TEST_EVENT', {}, 'low', incompleteRequest as unknown as Request);
      }).not.toThrow();
    });

    it('should handle null and undefined inputs in sanitization', () => {
      expect(securityService.sanitizeInput(null)).toBe(null);
      expect(securityService.sanitizeInput(undefined)).toBe(undefined);
    });

    it('should handle empty objects and arrays in sanitization', () => {
      expect(securityService.sanitizeInput({})).toEqual({});
      expect(securityService.sanitizeInput([])).toEqual([]);
    });

    it('should handle very long input strings', () => {
      const longString = 'a'.repeat(10000) + '<script>alert("xss")</script>';
      const sanitized = securityService.sanitizeInput(longString);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized.length).toBe(10000);
    });

    it('should handle deeply nested objects in sanitization', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: '<script>alert("xss")</script>'
            }
          }
        }
      };
      
      const sanitized = securityService.sanitizeInput(deepObject);
      
      expect(sanitized.level1.level2.level3.level4).toBe('');
    });
  });
});
