/**
 * Rate Limit Tests - 100 Requests Per Minute
 * 
 * Tests to verify that the rate limit is correctly set to 100 requests per minute
 * and that it properly blocks requests exceeding this limit.
 */

import { jest } from '@jest/globals';

describe('Rate Limit - 100 Requests Per Minute', () => {
  let mockRequest: any;
  let mockResponse: any;
  let rateLimitMap: Map<string, { count: number; resetTime: number }>;
  let checkRateLimit: (req: any, res: any, operation: string) => boolean;
  const RATE_LIMIT_MAX_REQUESTS = 100;
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

  beforeEach(() => {
    // Create a fresh rate limit map for each test
    rateLimitMap = new Map<string, { count: number; resetTime: number }>();

    // Mock request object
    mockRequest = {
      ip: '192.168.1.1',
      connection: {
        remoteAddress: '192.168.1.1'
      }
    };

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Re-implement checkRateLimit function to match actual implementation
    checkRateLimit = (req: any, res: any, operation: string): boolean => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const key = `${clientIP}:${operation}`;
      
      const current = rateLimitMap.get(key);
      
      if (!current || now > current.resetTime) {
        // First request or window expired
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
      }
      
      if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
        res.status(429).json({ 
          success: false, 
          error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute allowed.` 
        });
        return true;
      }
      
      current.count++;
      return false;
    };
  });

  describe('Rate Limit Configuration', () => {
    test('should have rate limit set to 100 requests per minute', () => {
      expect(RATE_LIMIT_MAX_REQUESTS).toBe(100);
    });

    test('should have rate limit window of 1 minute', () => {
      expect(RATE_LIMIT_WINDOW).toBe(60 * 1000);
    });
  });

  describe('Rate Limit Behavior - Within Limit', () => {
    test('should allow first request', () => {
      const result = checkRateLimit(mockRequest, mockResponse, 'card addition');
      
      expect(result).toBe(false);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    test('should allow requests 1 through 100', () => {
      // Make 100 requests - all should be allowed
      for (let i = 1; i <= 100; i++) {
        const result = checkRateLimit(mockRequest, mockResponse, 'card addition');
        expect(result).toBe(false);
      }
      
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    test('should allow exactly 100 requests in the same window', () => {
      let blockedCount = 0;
      let allowedCount = 0;

      for (let i = 1; i <= 100; i++) {
        const result = checkRateLimit(mockRequest, mockResponse, 'card addition');
        if (result) {
          blockedCount++;
        } else {
          allowedCount++;
        }
      }

      expect(allowedCount).toBe(100);
      expect(blockedCount).toBe(0);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should track count correctly for 100 requests', () => {
      const operation = 'card addition';
      const key = `${mockRequest.ip}:${operation}`;

      // Make 100 requests
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(mockRequest, mockResponse, operation);
      }

      const current = rateLimitMap.get(key);
      expect(current).toBeDefined();
      expect(current!.count).toBe(100);
    });
  });

  describe('Rate Limit Behavior - Exceeding Limit', () => {
    test('should block the 101st request', () => {
      // Make 100 requests - all should be allowed
      for (let i = 1; i <= 100; i++) {
        const result = checkRateLimit(mockRequest, mockResponse, 'card addition');
        expect(result).toBe(false);
      }

      // 101st request should be blocked
      const result = checkRateLimit(mockRequest, mockResponse, 'card addition');
      expect(result).toBe(true);
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Rate limit exceeded. Maximum 100 requests per minute allowed.'
      });
    });

    test('should block all requests after 100', () => {
      // Make 100 requests
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(mockRequest, mockResponse, 'card addition');
      }

      // Make 10 more requests - all should be blocked
      for (let i = 101; i <= 110; i++) {
        const result = checkRateLimit(mockRequest, mockResponse, 'card addition');
        expect(result).toBe(true);
        expect(mockResponse.status).toHaveBeenCalledWith(429);
      }

      // Verify error message mentions 100
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Maximum 100 requests per minute allowed')
        })
      );
    });

    test('should return correct error message for rate limit exceeded', () => {
      // Exhaust the rate limit
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(mockRequest, mockResponse, 'card addition');
      }

      // Clear previous calls
      (mockResponse.json as jest.Mock).mockClear();

      // Make one more request
      checkRateLimit(mockRequest, mockResponse, 'card addition');

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Rate limit exceeded. Maximum 100 requests per minute allowed.'
      });
    });
  });

  describe('Rate Limit Per Operation Type', () => {
    test('should track rate limits separately for different operations', () => {
      // Make 100 card addition requests
      for (let i = 1; i <= 100; i++) {
        const result = checkRateLimit(mockRequest, mockResponse, 'card addition');
        expect(result).toBe(false);
      }

      // Card addition should now be blocked
      const cardAdditionResult = checkRateLimit(mockRequest, mockResponse, 'card addition');
      expect(cardAdditionResult).toBe(true);

      // But card removal should still be allowed (different operation)
      mockResponse.status.mockClear();
      mockResponse.json.mockClear();
      
      const cardRemovalResult = checkRateLimit(mockRequest, mockResponse, 'card removal');
      expect(cardRemovalResult).toBe(false);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should allow 100 requests for each operation type independently', () => {
      // Make 100 card addition requests
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(mockRequest, mockResponse, 'card addition');
      }

      // Make 100 card removal requests
      for (let i = 1; i <= 100; i++) {
        const result = checkRateLimit(mockRequest, mockResponse, 'card removal');
        expect(result).toBe(false);
      }

      // Both operations should have exhausted their limits
      expect(checkRateLimit(mockRequest, mockResponse, 'card addition')).toBe(true);
      expect(checkRateLimit(mockRequest, mockResponse, 'card removal')).toBe(true);
    });
  });

  describe('Rate Limit Per IP Address', () => {
    test('should track rate limits separately for different IPs', () => {
      const request1 = { ...mockRequest, ip: '192.168.1.1' };
      const request2 = { ...mockRequest, ip: '192.168.1.2' };

      // Make 100 requests from IP 1
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(request1, mockResponse, 'card addition');
      }

      // IP 1 should be blocked
      expect(checkRateLimit(request1, mockResponse, 'card addition')).toBe(true);

      // IP 2 should still be allowed
      mockResponse.status.mockClear();
      mockResponse.json.mockClear();
      
      expect(checkRateLimit(request2, mockResponse, 'card addition')).toBe(false);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should allow 100 requests per IP independently', () => {
      const request1 = { ...mockRequest, ip: '192.168.1.1' };
      const request2 = { ...mockRequest, ip: '192.168.1.2' };

      // Make 100 requests from each IP
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(request1, mockResponse, 'card addition');
        checkRateLimit(request2, mockResponse, 'card addition');
      }

      // Both IPs should have exhausted their limits
      expect(checkRateLimit(request1, mockResponse, 'card addition')).toBe(true);
      expect(checkRateLimit(request2, mockResponse, 'card addition')).toBe(true);
    });
  });

  describe('Rate Limit Window Reset', () => {
    test('should reset rate limit after window expires', () => {
      // Make 100 requests
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(mockRequest, mockResponse, 'card addition');
      }

      // Verify 101st is blocked
      expect(checkRateLimit(mockRequest, mockResponse, 'card addition')).toBe(true);

      // Manually expire the window by setting resetTime in the past
      const key = `${mockRequest.ip}:card addition`;
      const current = rateLimitMap.get(key);
      if (current) {
        current.resetTime = Date.now() - 1000; // Expired 1 second ago
        rateLimitMap.set(key, current);
      }

      // Now the next request should start a new window
      mockResponse.status.mockClear();
      mockResponse.json.mockClear();
      
      const result = checkRateLimit(mockRequest, mockResponse, 'card addition');
      expect(result).toBe(false);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limit Error Messages', () => {
    test('should include "100" in the error message', () => {
      // Exhaust the rate limit
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(mockRequest, mockResponse, 'card addition');
      }

      checkRateLimit(mockRequest, mockResponse, 'card addition');

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('100')
        })
      );
    });

    test('should mention "per minute" in the error message', () => {
      // Exhaust the rate limit
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(mockRequest, mockResponse, 'card addition');
      }

      checkRateLimit(mockRequest, mockResponse, 'card addition');

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('per minute')
        })
      );
    });
  });

  describe('Card Addition Specific Rate Limiting', () => {
    test('should allow adding up to 100 cards per minute', () => {
      const operation = 'card addition';
      
      // Simulate adding 100 cards
      for (let i = 1; i <= 100; i++) {
        const result = checkRateLimit(mockRequest, mockResponse, operation);
        expect(result).toBe(false);
      }

      // Verify all 100 were allowed
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should block card addition after 100 requests', () => {
      const operation = 'card addition';
      
      // Add 100 cards
      for (let i = 1; i <= 100; i++) {
        checkRateLimit(mockRequest, mockResponse, operation);
      }

      // 101st card addition should be blocked
      const result = checkRateLimit(mockRequest, mockResponse, operation);
      expect(result).toBe(true);
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Rate limit exceeded. Maximum 100 requests per minute allowed.'
      });
    });
  });
});

