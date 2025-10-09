/**
 * Unit Tests - Input Validation
 * Test delle funzioni di validazione input
 */

const { expect } = require('chai');

describe('Input Validation (Unit Tests)', () => {
  
  describe('Email Validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'name+tag@company.org'
      ];

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).to.be.true;
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example'
      ];

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).to.be.false;
      });
    });
  });

  describe('Password Validation', () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    const minLength = 8;

    const isPasswordValid = (password) => {
      return password.length >= minLength && passwordRegex.test(password);
    };

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'Password123',
        'MySecure1Pass',
        'Test123Password'
      ];

      strongPasswords.forEach(password => {
        expect(isPasswordValid(password)).to.be.true;
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',           // Troppo corta
        'password123',    // Nessuna maiuscola
        'PASSWORD123',    // Nessuna minuscola
        'PasswordOnly',   // Nessun numero
        'Pass1'           // Troppo corta
      ];

      weakPasswords.forEach(password => {
        expect(isPasswordValid(password)).to.be.false;
      });
    });

    it('should check minimum length requirement', () => {
      expect('Ab1'.length >= minLength).to.be.false;
      expect('AbCd1234'.length >= minLength).to.be.true;
    });

    it('should check uppercase requirement', () => {
      expect(/[A-Z]/.test('password123')).to.be.false;
      expect(/[A-Z]/.test('Password123')).to.be.true;
    });

    it('should check lowercase requirement', () => {
      expect(/[a-z]/.test('PASSWORD123')).to.be.false;
      expect(/[a-z]/.test('Password123')).to.be.true;
    });

    it('should check number requirement', () => {
      expect(/\d/.test('PasswordOnly')).to.be.false;
      expect(/\d/.test('Password123')).to.be.true;
    });
  });

  describe('Username Validation', () => {
    const isUsernameValid = (username) => {
      if (!username || typeof username !== 'string') return false;
      return username.length >= 3 && username.length <= 50;
    };

    it('should accept valid usernames', () => {
      const validUsernames = [
        'user',
        'test_user',
        'john.doe',
        'a'.repeat(50) // Max length
      ];

      validUsernames.forEach(username => {
        expect(isUsernameValid(username)).to.be.true;
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'ab',            // Troppo corto
        'a'.repeat(51),  // Troppo lungo
        '',              // Vuoto
        null,            // Null
        undefined        // Undefined
      ];

      invalidUsernames.forEach(username => {
        expect(isUsernameValid(username)).to.be.false;
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    const dangerousPatterns = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users--"
    ];

    it('should detect SQL injection patterns', () => {
      dangerousPatterns.forEach(pattern => {
        // Verifica che contenga caratteri pericolosi
        const hasDangerousChars = /'|--|;|\bUNION\b|\bDROP\b/i.test(pattern);
        expect(hasDangerousChars).to.be.true;
      });
    });
  });

  describe('XSS Prevention', () => {
    const xssPatterns = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="malicious.com"></iframe>'
    ];

    it('should detect XSS patterns', () => {
      xssPatterns.forEach(pattern => {
        const hasHtmlTags = /<[^>]*>/i.test(pattern);
        const hasJavascript = /javascript:/i.test(pattern);
        expect(hasHtmlTags || hasJavascript).to.be.true;
      });
    });
  });
});
