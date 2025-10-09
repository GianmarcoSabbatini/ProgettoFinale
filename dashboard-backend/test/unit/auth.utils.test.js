const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication Utils - Unit Tests with Sinon', () => {
  
  describe('Password Hashing with bcrypt (Stubbed)', () => {
    let bcryptHashStub;
    let bcryptCompareStub;

    beforeEach(() => {
      // Stub bcrypt methods to avoid real hashing (faster tests)
      bcryptHashStub = sinon.stub(bcrypt, 'hash');
      bcryptCompareStub = sinon.stub(bcrypt, 'compare');
    });

    afterEach(() => {
      // Restore original methods after each test
      bcryptHashStub.restore();
      bcryptCompareStub.restore();
    });

    it('should hash a password using bcrypt.hash', async () => {
      const password = 'TestPassword123';
      const hashedPassword = '$2b$10$mockHashedPassword';
      
      bcryptHashStub.resolves(hashedPassword);

      const result = await bcrypt.hash(password, 10);

      expect(result).to.equal(hashedPassword);
      expect(bcryptHashStub.calledOnce).to.be.true;
      expect(bcryptHashStub.calledWith(password, 10)).to.be.true;
    });

    it('should compare password with hash using bcrypt.compare', async () => {
      const password = 'TestPassword123';
      const hash = '$2b$10$mockHashedPassword';
      
      bcryptCompareStub.resolves(true);

      const result = await bcrypt.compare(password, hash);

      expect(result).to.be.true;
      expect(bcryptCompareStub.calledOnce).to.be.true;
      expect(bcryptCompareStub.calledWith(password, hash)).to.be.true;
    });

    it('should return false when password does not match hash', async () => {
      const password = 'WrongPassword';
      const hash = '$2b$10$mockHashedPassword';
      
      bcryptCompareStub.resolves(false);

      const result = await bcrypt.compare(password, hash);

      expect(result).to.be.false;
      expect(bcryptCompareStub.calledOnce).to.be.true;
    });

    it('should handle bcrypt.hash errors', async () => {
      const password = 'TestPassword123';
      const error = new Error('Hashing failed');
      
      bcryptHashStub.rejects(error);

      try {
        await bcrypt.hash(password, 10);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Hashing failed');
        expect(bcryptHashStub.calledOnce).to.be.true;
      }
    });
  });

  describe('JWT Token Generation and Verification (Stubbed)', () => {
    let jwtSignStub;
    let jwtVerifyStub;

    beforeEach(() => {
      // Stub JWT methods to avoid real token operations
      jwtSignStub = sinon.stub(jwt, 'sign');
      jwtVerifyStub = sinon.stub(jwt, 'verify');
    });

    afterEach(() => {
      // Restore original methods
      jwtSignStub.restore();
      jwtVerifyStub.restore();
    });

    it('should generate a JWT token with jwt.sign', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const secret = 'test-secret';
      const mockToken = 'mock.jwt.token';
      
      jwtSignStub.returns(mockToken);

      const token = jwt.sign(payload, secret, { expiresIn: '24h' });

      expect(token).to.equal(mockToken);
      expect(jwtSignStub.calledOnce).to.be.true;
      expect(jwtSignStub.calledWith(payload, secret)).to.be.true;
    });

    it('should verify a valid JWT token with jwt.verify', () => {
      const token = 'mock.jwt.token';
      const secret = 'test-secret';
      const decodedPayload = { userId: 1, email: 'test@example.com' };
      
      jwtVerifyStub.returns(decodedPayload);

      const result = jwt.verify(token, secret);

      expect(result).to.deep.equal(decodedPayload);
      expect(jwtVerifyStub.calledOnce).to.be.true;
      expect(jwtVerifyStub.calledWith(token, secret)).to.be.true;
    });

    it('should throw error for invalid JWT token', () => {
      const token = 'invalid.jwt.token';
      const secret = 'test-secret';
      const error = new Error('Invalid token');
      
      jwtVerifyStub.throws(error);

      try {
        jwt.verify(token, secret);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Invalid token');
        expect(jwtVerifyStub.calledOnce).to.be.true;
      }
    });

    it('should throw error for expired JWT token', () => {
      const token = 'expired.jwt.token';
      const secret = 'test-secret';
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      
      jwtVerifyStub.throws(error);

      try {
        jwt.verify(token, secret);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('jwt expired');
        expect(err.name).to.equal('TokenExpiredError');
        expect(jwtVerifyStub.calledOnce).to.be.true;
      }
    });
  });

  describe('Spy Example - Function Call Tracking', () => {
    it('should track function calls with sinon.spy', () => {
      const mockAuthService = {
        login: (email, password) => {
          return { success: true, token: 'mock-token' };
        }
      };

      const loginSpy = sinon.spy(mockAuthService, 'login');

      mockAuthService.login('test@example.com', 'password123');
      mockAuthService.login('admin@example.com', 'admin123');

      expect(loginSpy.callCount).to.equal(2);
      expect(loginSpy.firstCall.args).to.deep.equal(['test@example.com', 'password123']);
      expect(loginSpy.secondCall.args).to.deep.equal(['admin@example.com', 'admin123']);
      expect(loginSpy.alwaysReturned({ success: true, token: 'mock-token' })).to.be.true;

      loginSpy.restore();
    });

    it('should verify spy was called with specific arguments', () => {
      const callback = sinon.spy();

      callback('arg1', 'arg2');
      callback('arg3', 'arg4');

      expect(callback.calledTwice).to.be.true;
      expect(callback.calledWith('arg1', 'arg2')).to.be.true;
      expect(callback.calledWith('arg3', 'arg4')).to.be.true;
      expect(callback.getCall(0).args).to.deep.equal(['arg1', 'arg2']);
      expect(callback.getCall(1).args).to.deep.equal(['arg3', 'arg4']);
    });
  });

  describe('Mock Example - Complete Object Behavior', () => {
    it('should mock database query with expected behavior', async () => {
      const mockDb = {
        query: sinon.stub()
      };

      // Setup mock responses
      mockDb.query.withArgs('SELECT * FROM users WHERE id = ?', [1])
        .resolves([[{ id: 1, email: 'user1@example.com' }]]);
      
      mockDb.query.withArgs('SELECT * FROM users WHERE id = ?', [2])
        .resolves([[{ id: 2, email: 'user2@example.com' }]]);
      
      mockDb.query.withArgs('SELECT * FROM users WHERE id = ?', [999])
        .resolves([[]]);

      // Test queries
      const result1 = await mockDb.query('SELECT * FROM users WHERE id = ?', [1]);
      const result2 = await mockDb.query('SELECT * FROM users WHERE id = ?', [2]);
      const result3 = await mockDb.query('SELECT * FROM users WHERE id = ?', [999]);

      expect(result1[0][0].email).to.equal('user1@example.com');
      expect(result2[0][0].email).to.equal('user2@example.com');
      expect(result3[0]).to.be.empty;
      expect(mockDb.query.callCount).to.equal(3);
    });

    it('should mock logger calls to verify error logging', () => {
      const mockLogger = {
        info: sinon.spy(),
        error: sinon.spy(),
        warn: sinon.spy()
      };

      // Simulate application code
      mockLogger.info('User login attempt');
      mockLogger.error('Database connection failed');
      mockLogger.warn('Deprecated API usage');

      expect(mockLogger.info.calledOnce).to.be.true;
      expect(mockLogger.error.calledOnce).to.be.true;
      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockLogger.info.calledWith('User login attempt')).to.be.true;
      expect(mockLogger.error.calledWith('Database connection failed')).to.be.true;
      expect(mockLogger.warn.calledWith('Deprecated API usage')).to.be.true;
    });
  });

  describe('Fake Timers - Testing Time-Dependent Code', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should test setTimeout with fake timers', (done) => {
      const callback = sinon.spy();

      setTimeout(() => {
        callback();
        expect(callback.calledOnce).to.be.true;
        done();
      }, 1000);

      // Fast-forward time by 1 second
      clock.tick(1000);
    });

    it('should test token expiration with fake timers', () => {
      const mockToken = {
        expiresAt: Date.now() + 3600000, // 1 hour from now
        isExpired: function() {
          return Date.now() > this.expiresAt;
        }
      };

      expect(mockToken.isExpired()).to.be.false;

      // Fast-forward 2 hours
      clock.tick(7200000);

      expect(mockToken.isExpired()).to.be.true;
    });
  });

  describe('Stub Chaining - Complex Scenarios', () => {
    it('should stub function to return different values on consecutive calls', () => {
      const stub = sinon.stub();
      
      stub.onFirstCall().returns('first');
      stub.onSecondCall().returns('second');
      stub.onThirdCall().returns('third');

      expect(stub()).to.equal('first');
      expect(stub()).to.equal('second');
      expect(stub()).to.equal('third');
      expect(stub.callCount).to.equal(3);
    });

    it('should stub async function with different outcomes', async () => {
      const asyncStub = sinon.stub();
      
      asyncStub.onFirstCall().resolves({ success: true });
      asyncStub.onSecondCall().rejects(new Error('Network error'));
      asyncStub.onThirdCall().resolves({ success: false, reason: 'Invalid credentials' });

      const result1 = await asyncStub();
      expect(result1.success).to.be.true;

      try {
        await asyncStub();
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.equal('Network error');
      }

      const result3 = await asyncStub();
      expect(result3.success).to.be.false;
      expect(result3.reason).to.equal('Invalid credentials');
    });
  });

  describe('Argument Matchers - Flexible Stubbing', () => {
    it('should use sinon.match for flexible argument matching', () => {
      const stub = sinon.stub();
      
      stub.withArgs(sinon.match.string).returns('string argument');
      stub.withArgs(sinon.match.number).returns('number argument');
      stub.withArgs(sinon.match.object).returns('object argument');

      expect(stub('hello')).to.equal('string argument');
      expect(stub(123)).to.equal('number argument');
      expect(stub({ key: 'value' })).to.equal('object argument');
    });

    it('should match partial objects with sinon.match', () => {
      const stub = sinon.stub();
      
      stub.withArgs(sinon.match({ email: sinon.match.string })).returns('valid email object');

      expect(stub({ email: 'test@example.com', name: 'John' })).to.equal('valid email object');
      expect(stub({ email: 'admin@example.com' })).to.equal('valid email object');
    });
  });

});
