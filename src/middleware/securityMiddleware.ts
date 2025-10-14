/**
 * Phase 4 Security Middleware
 * Provides comprehensive security middleware for all routes
 */

import { Request, Response, NextFunction } from 'express';
import SecurityService from '../services/SecurityService';

// Extend Request interface to include session properties
interface RequestWithSession extends Request {
  session?: {
    userId?: string;
    destroy: (callback: (err?: any) => void) => void;
  };
  sessionID?: string;
}

const securityService = SecurityService.getInstance();

/**
 * Apply security headers to all responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const headers = securityService.generateSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  next();
};

/**
 * CSRF protection middleware for state-changing operations
 */
export const csrfProtection = (req: RequestWithSession, res: Response, next: NextFunction): void => {
  // Skip CSRF protection for GET requests and API routes that don't change state
  if (req.method === 'GET' || req.path.includes('/health') || req.path.includes('/api/decks') && req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const userId = req.session?.userId;
  const sessionId = req.sessionID;

  if (!token || !userId || !sessionId) {
    securityService.logSecurityEvent('CSRF_PROTECTION_FAILED', {
      method: req.method,
      path: req.path,
      hasToken: !!token,
      hasUserId: !!userId,
      hasSessionId: !!sessionId
    }, 'high', req);
    
    res.status(403).json({
      success: false,
      error: 'CSRF token required for this operation'
    });
    return;
  }

  if (!securityService.validateCSRFToken(token, userId, sessionId)) {
    securityService.logSecurityEvent('CSRF_TOKEN_INVALID', {
      method: req.method,
      path: req.path,
      token: token.substring(0, 8) + '...'
    }, 'high', req);
    
    res.status(403).json({
      success: false,
      error: 'Invalid CSRF token'
    });
    return;
  }

  next();
};

/**
 * Input sanitization middleware
 */
export const inputSanitization = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize request body
  if (req.body) {
    req.body = securityService.sanitizeInput(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = securityService.sanitizeInput(req.query);
  }

  // Sanitize route parameters
  if (req.params) {
    req.params = securityService.sanitizeInput(req.params);
  }

  next();
};

/**
 * Session security middleware
 */
export const sessionSecurity = (req: RequestWithSession, res: Response, next: NextFunction): void => {
  const userId = req.session?.userId;
  const sessionId = req.sessionID;

  if (userId && sessionId) {
    if (!securityService.checkSessionSecurity(sessionId, userId)) {
      // Session expired, destroy it
      req.session?.destroy((err?: any) => {
        if (err) {
          securityService.logSecurityEvent('SESSION_DESTROY_ERROR', { error: err.message }, 'medium', req);
        }
      });

      securityService.logSecurityEvent('SESSION_EXPIRED', {
        userId,
        sessionId
      }, 'medium', req);

      res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.'
      });
      return;
    }
  }

  next();
};

/**
 * Rate limiting middleware (enhanced from Phase 2)
 */
export const enhancedRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const operation = `${req.method}:${req.path}`;
  const key = `${ip}:${operation}`;

  // Check for failed attempts
  const failedAttempts = securityService['failedAttempts'].get(ip);
  if (failedAttempts && failedAttempts.count > 5) {
    const timeSinceLastAttempt = Date.now() - failedAttempts.lastAttempt.getTime();
    if (timeSinceLastAttempt < 300000) { // 5 minutes lockout
      securityService.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip,
        operation,
        failedAttempts: failedAttempts.count
      }, 'high', req);

      res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Please try again later.'
      });
      return;
    }
  }

  next();
};

/**
 * Security monitoring middleware
 */
export const securityMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Log the request
  securityService.logSecurityEvent('REQUEST_START', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer')
  }, 'low', req);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    
    securityService.logSecurityEvent('REQUEST_COMPLETE', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    }, 'low', req);

    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

/**
 * Content Security Policy middleware
 */
export const contentSecurityPolicy = (req: Request, res: Response, next: NextFunction): void => {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspHeader);
  next();
};

/**
 * Security audit middleware for sensitive operations
 */
export const securityAudit = (operation: string) => {
  return (req: RequestWithSession, res: Response, next: NextFunction): void => {
    const userId = req.session?.userId;
    const sessionId = req.sessionID;

    securityService.logSecurityEvent('SENSITIVE_OPERATION', {
      operation,
      userId,
      sessionId,
      method: req.method,
      path: req.path,
      body: req.body ? Object.keys(req.body) : null
    }, 'medium', req);

    next();
  };
};

/**
 * Error handling middleware for security events
 */
export const securityErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  securityService.logSecurityEvent('SECURITY_ERROR', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path
  }, 'high', req);

  // Don't expose internal errors to client
  res.status(500).json({
    success: false,
    error: 'An internal error occurred'
  });
};

export default {
  securityHeaders,
  csrfProtection,
  inputSanitization,
  sessionSecurity,
  enhancedRateLimit,
  securityMonitoring,
  contentSecurityPolicy,
  securityAudit,
  securityErrorHandler
};
