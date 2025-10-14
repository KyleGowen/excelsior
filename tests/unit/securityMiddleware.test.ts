/**
 * Comprehensive unit tests for Security Middleware
 * Tests all middleware functions including security headers, CSRF protection,
 * input sanitization, session security, rate limiting, and monitoring.
 */

import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include session properties
interface RequestWithSession extends Request {
  session?: {
    userId?: string;
    destroy: (callback: (err?: any) => void) => void;
  };
  sessionID?: string;
}

// Mock SecurityService before importing middleware
const mockSecurityService = {
  generateSecurityHeaders: jest.fn().mockReturnValue({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  }),
  validateCSRFToken: jest.fn(),
  sanitizeInput: jest.fn().mockImplementation((input) => input),
  checkSessionSecurity: jest.fn(),
  logSecurityEvent: jest.fn(),
  failedAttempts: new Map()
};

jest.mock('../../src/services/SecurityService', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => mockSecurityService)
  }
}));

// Import middleware after mocking
import securityMiddleware from '../../src/middleware/securityMiddleware';

describe('Security Middleware', () => {
  let mockRequest: Partial<RequestWithSession>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request
    mockRequest = {
      method: 'POST',
      path: '/api/test',
      headers: {},
      body: { test: 'data' },
      query: { param: 'value' },
      params: { id: '123' },
      ip: '192.168.1.1',
      connection: { remoteAddress: '192.168.1.1' } as any,
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser'),
      session: {
        userId: 'test-user-123',
        destroy: jest.fn()
      },
      sessionID: 'test-session-456'
    };

    // Create mock response
    mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn()
    };

    // Create mock next function
    mockNext = jest.fn();
  });

  describe('securityHeaders', () => {
    it('should set security headers on response', () => {
      securityMiddleware.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.generateSecurityHeaders).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple security headers', () => {
      const headers = {
        'Header1': 'value1',
        'Header2': 'value2',
        'Header3': 'value3'
      };
      mockSecurityService.generateSecurityHeaders.mockReturnValue(headers);

      securityMiddleware.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Header1', 'value1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Header2', 'value2');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Header3', 'value3');
    });
  });

  describe('csrfProtection', () => {
    it('should skip CSRF protection for GET requests', () => {
      mockRequest.method = 'GET';

      securityMiddleware.csrfProtection(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockSecurityService.validateCSRFToken).not.toHaveBeenCalled();
    });

    it('should skip CSRF protection for health endpoint', () => {
      const healthRequest = { ...mockRequest, path: '/health' };

      securityMiddleware.csrfProtection(healthRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockSecurityService.validateCSRFToken).not.toHaveBeenCalled();
    });

    it('should skip CSRF protection for GET deck API requests', () => {
      const deckRequest = { ...mockRequest, method: 'GET', path: '/api/decks' };

      securityMiddleware.csrfProtection(deckRequest as any, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockSecurityService.validateCSRFToken).not.toHaveBeenCalled();
    });

    it('should require CSRF token for POST requests', () => {
      mockRequest.method = 'POST';
      mockRequest.headers = {};

      securityMiddleware.csrfProtection(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'CSRF_PROTECTION_FAILED',
        expect.objectContaining({
          method: 'POST',
          path: '/api/test',
          hasToken: false,
          hasUserId: true,
          hasSessionId: true
        }),
        'high',
        mockRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'CSRF token required for this operation'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should require user session for CSRF protection', () => {
      const noSessionRequest = { ...mockRequest, method: 'POST', headers: { 'x-csrf-token': 'valid-token' }, session: undefined };

      securityMiddleware.csrfProtection(noSessionRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'CSRF_PROTECTION_FAILED',
        expect.objectContaining({
          hasToken: true,
          hasUserId: false,
          hasSessionId: true
        }),
        'high',
        noSessionRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should require session ID for CSRF protection', () => {
      const noSessionIdRequest = { ...mockRequest, method: 'POST', headers: { 'x-csrf-token': 'valid-token' }, sessionID: undefined };

      securityMiddleware.csrfProtection(noSessionIdRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'CSRF_PROTECTION_FAILED',
        expect.objectContaining({
          hasToken: true,
          hasUserId: true,
          hasSessionId: false
        }),
        'high',
        noSessionIdRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should validate CSRF token when provided', () => {
      mockRequest.method = 'POST';
      mockRequest.headers = { 'x-csrf-token': 'valid-token' };
      mockSecurityService.validateCSRFToken.mockReturnValue(true);

      securityMiddleware.csrfProtection(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.validateCSRFToken).toHaveBeenCalledWith(
        'valid-token',
        'test-user-123',
        'test-session-456'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid CSRF tokens', () => {
      mockRequest.method = 'POST';
      mockRequest.headers = { 'x-csrf-token': 'invalid-token' };
      mockSecurityService.validateCSRFToken.mockReturnValue(false);

      securityMiddleware.csrfProtection(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'CSRF_TOKEN_INVALID',
        expect.objectContaining({
          method: 'POST',
          path: '/api/test',
          token: 'invalid-...'
        }),
        'high',
        mockRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid CSRF token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('inputSanitization', () => {
    it('should sanitize request body', () => {
      const maliciousBody = { name: '<script>alert("xss")</script>' };
      mockRequest.body = maliciousBody;
      mockSecurityService.sanitizeInput.mockReturnValue({ name: '' });

      securityMiddleware.inputSanitization(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalledWith(maliciousBody);
      expect(mockRequest.body).toEqual({ name: '' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      const maliciousQuery = { search: '<script>alert("xss")</script>' };
      mockRequest.query = maliciousQuery;
      mockSecurityService.sanitizeInput.mockReturnValue({ search: '' });

      securityMiddleware.inputSanitization(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalledWith(maliciousQuery);
      expect(mockRequest.query).toEqual({ search: '' });
    });

    it('should sanitize route parameters', () => {
      const maliciousParams = { id: '<script>alert("xss")</script>' };
      mockRequest.params = maliciousParams;
      mockSecurityService.sanitizeInput.mockReturnValue({ id: '' });

      securityMiddleware.inputSanitization(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalledWith(maliciousParams);
      expect(mockRequest.params).toEqual({ id: '' });
    });

    it('should handle missing body, query, and params', () => {
      const minimalRequest = { ...mockRequest, body: undefined, query: undefined, params: undefined };

      securityMiddleware.inputSanitization(minimalRequest as unknown as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.sanitizeInput).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null values', () => {
      const nullRequest = { ...mockRequest, body: null, query: null, params: null };

      securityMiddleware.inputSanitization(nullRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.sanitizeInput).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('sessionSecurity', () => {
    it('should allow valid sessions', () => {
      mockSecurityService.checkSessionSecurity.mockReturnValue(true);

      securityMiddleware.sessionSecurity(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.checkSessionSecurity).toHaveBeenCalledWith(
        'test-session-456',
        'test-user-123'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing session gracefully', () => {
      const noSessionRequest = { ...mockRequest, session: undefined, sessionID: undefined };

      securityMiddleware.sessionSecurity(noSessionRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.checkSessionSecurity).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing userId gracefully', () => {
      const noUserIdRequest = { ...mockRequest, session: { userId: undefined, destroy: jest.fn() } };

      securityMiddleware.sessionSecurity(noUserIdRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.checkSessionSecurity).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should destroy expired sessions', () => {
      mockSecurityService.checkSessionSecurity.mockReturnValue(false);

      securityMiddleware.sessionSecurity(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockRequest.session?.destroy).toHaveBeenCalled();
      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'SESSION_EXPIRED',
        {
          userId: 'test-user-123',
          sessionId: 'test-session-456'
        },
        'medium',
        mockRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session expired. Please log in again.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should log session destroy errors', () => {
      mockSecurityService.checkSessionSecurity.mockReturnValue(false);
      const destroyError = new Error('Destroy failed');
      const errorRequest = { 
        ...mockRequest, 
        session: { 
          userId: 'test-user-123', 
          destroy: jest.fn().mockImplementation((callback) => {
            callback(destroyError);
          })
        } 
      };

      securityMiddleware.sessionSecurity(errorRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'SESSION_DESTROY_ERROR',
        { error: 'Destroy failed' },
        'medium',
        errorRequest
      );
    });
  });

  describe('enhancedRateLimit', () => {
    it('should allow requests under rate limit', () => {
      securityMiddleware.enhancedRateLimit(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests from IPs with too many failed attempts', () => {
      const failedAttempts = {
        count: 6,
        lastAttempt: new Date()
      };
      (mockSecurityService as any).failedAttempts.set('192.168.1.1', failedAttempts);

      securityMiddleware.enhancedRateLimit(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'RATE_LIMIT_EXCEEDED',
        expect.objectContaining({
          ip: '192.168.1.1',
          operation: 'POST:/api/test',
          failedAttempts: 6
        }),
        'high',
        mockRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many failed attempts. Please try again later.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow requests after lockout period expires', () => {
      const oldDate = new Date(Date.now() - 400000); // 6+ minutes ago
      const failedAttempts = {
        count: 6,
        lastAttempt: oldDate
      };
      (mockSecurityService as any).failedAttempts.set('192.168.1.1', failedAttempts);

      securityMiddleware.enhancedRateLimit(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing IP address', () => {
      const noIpRequest = { ...mockRequest, ip: undefined, connection: { remoteAddress: undefined } as any };

      securityMiddleware.enhancedRateLimit(noIpRequest as unknown as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should use connection remote address as fallback', () => {
      const fallbackRequest = { ...mockRequest, ip: undefined, connection: { remoteAddress: '10.0.0.1' } as any };

      securityMiddleware.enhancedRateLimit(fallbackRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('securityMonitoring', () => {
    it('should log request start', () => {
      securityMiddleware.securityMonitoring(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'REQUEST_START',
        expect.objectContaining({
          method: 'POST',
          path: '/api/test',
          userAgent: 'Mozilla/5.0 Test Browser',
          referer: 'Mozilla/5.0 Test Browser'
        }),
        'low',
        mockRequest
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log request completion', () => {
      securityMiddleware.securityMonitoring(mockRequest as Request, mockResponse as Response, mockNext);

      // Call the overridden end method
      const originalEnd = mockResponse.end;
      if (originalEnd && typeof originalEnd === 'function') {
        originalEnd();
      }

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'REQUEST_COMPLETE',
        expect.objectContaining({
          method: 'POST',
          path: '/api/test',
          statusCode: undefined,
          duration: expect.stringMatching(/\d+ms/)
        }),
        'low',
        mockRequest
      );
    });

    it('should preserve original end method functionality', () => {
      const originalEnd = mockResponse.end;
      securityMiddleware.securityMonitoring(mockRequest as Request, mockResponse as Response, mockNext);

      // The end method should be overridden
      expect(mockResponse.end).not.toBe(originalEnd);
    });

    it('should handle missing user agent and referer', () => {
      const noHeadersRequest = { ...mockRequest, get: jest.fn().mockReturnValue(undefined) };

      securityMiddleware.securityMonitoring(noHeadersRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'REQUEST_START',
        expect.objectContaining({
          userAgent: undefined,
          referer: undefined
        }),
        'low',
        noHeadersRequest
      );
    });
  });

  describe('contentSecurityPolicy', () => {
    it('should set Content Security Policy header', () => {
      securityMiddleware.contentSecurityPolicy(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should include all required CSP directives', () => {
      securityMiddleware.contentSecurityPolicy(mockRequest as Request, mockResponse as Response, mockNext);

      const cspHeader = (mockResponse.setHeader as jest.Mock).mock.calls[0][1];
      
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
      expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
      expect(cspHeader).toContain("img-src 'self' data: blob:");
      expect(cspHeader).toContain("font-src 'self'");
      expect(cspHeader).toContain("connect-src 'self'");
      expect(cspHeader).toContain("frame-ancestors 'none'");
      expect(cspHeader).toContain("base-uri 'self'");
      expect(cspHeader).toContain("form-action 'self'");
    });
  });

  describe('securityAudit', () => {
    it('should create audit middleware for specific operation', () => {
      const auditMiddleware = securityMiddleware.securityAudit('SENSITIVE_OPERATION');
      expect(typeof auditMiddleware).toBe('function');
    });

    it('should log sensitive operations', () => {
      const auditMiddleware = securityMiddleware.securityAudit('DELETE_DECK');
      auditMiddleware(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'SENSITIVE_OPERATION',
        expect.objectContaining({
          operation: 'DELETE_DECK',
          userId: 'test-user-123',
          sessionId: 'test-session-456',
          method: 'POST',
          path: '/api/test',
          body: ['test']
        }),
        'medium',
        mockRequest
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing session in audit', () => {
      const noSessionRequest = { ...mockRequest, session: undefined, sessionID: undefined };

      const auditMiddleware = securityMiddleware.securityAudit('TEST_OPERATION');
      auditMiddleware(noSessionRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'SENSITIVE_OPERATION',
        expect.objectContaining({
          operation: 'TEST_OPERATION',
          userId: undefined,
          sessionId: undefined
        }),
        'medium',
        noSessionRequest
      );
    });

    it('should handle missing body in audit', () => {
      const noBodyRequest = { ...mockRequest, body: undefined };

      const auditMiddleware = securityMiddleware.securityAudit('TEST_OPERATION');
      auditMiddleware(noBodyRequest as any, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'SENSITIVE_OPERATION',
        expect.objectContaining({
          body: null
        }),
        'medium',
        noBodyRequest
      );
    });
  });

  describe('securityErrorHandler', () => {
    it('should log security errors', () => {
      const error = new Error('Test security error');
      error.stack = 'Error stack trace';

      securityMiddleware.securityErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'SECURITY_ERROR',
        expect.objectContaining({
          error: 'Test security error',
          stack: 'Error stack trace',
          method: 'POST',
          path: '/api/test'
        }),
        'high',
        mockRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'An internal error occurred'
      });
    });

    it('should handle errors without stack trace', () => {
      const error = new Error('Test error');
      delete error.stack;

      securityMiddleware.securityErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith(
        'SECURITY_ERROR',
        expect.objectContaining({
          error: 'Test error',
          stack: undefined
        }),
        'high',
        mockRequest
      );
    });

    it('should not expose internal error details to client', () => {
      const error = new Error('Sensitive internal error');

      securityMiddleware.securityErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'An internal error occurred'
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing request properties gracefully', () => {
      const minimalRequest = {
        method: 'GET',
        path: '/test'
      } as Request;

      expect(() => {
        securityMiddleware.securityHeaders(minimalRequest, mockResponse as Response, mockNext);
        securityMiddleware.inputSanitization(minimalRequest, mockResponse as Response, mockNext);
        securityMiddleware.contentSecurityPolicy(minimalRequest, mockResponse as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle security service errors gracefully', () => {
      mockSecurityService.generateSecurityHeaders.mockImplementation(() => {
        throw new Error('Security service error');
      });

      expect(() => {
        securityMiddleware.securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Security service error');
    });

    it('should handle sanitization errors gracefully', () => {
      mockSecurityService.sanitizeInput.mockImplementation(() => {
        throw new Error('Sanitization error');
      });

      expect(() => {
        securityMiddleware.inputSanitization(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow('Sanitization error');
    });

    it('should handle session security errors gracefully', () => {
      mockSecurityService.checkSessionSecurity.mockImplementation(() => {
        throw new Error('Session security error');
      });

      expect(() => {
        securityMiddleware.sessionSecurity(mockRequest as any, mockResponse as Response, mockNext);
      }).toThrow('Session security error');
    });
  });
});
