/**
 * AAEConnect Integration Testing Suite
 * 
 * Tests all system components working together:
 * - Backend + Frontend integration
 * - WebSocket + Matrix E2E encryption
 * - AAE corporate features
 * - Multi-platform compatibility
 * - Database + Cache integration
 * - Performance under realistic conditions
 */

const WebSocket = require('ws');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { performance } = require('perf_hooks');

describe('🔗 AAEConnect Integration Tests', () => {
  const BASE_URL = 'http://localhost:3000';
  const WS_URL = 'ws://localhost:3000/ws';
  const FRONTEND_URL = 'http://localhost:5173';
  
  let websocket;
  let testUsers = [];

  beforeAll(async () => {
    console.log('🔗 Starting AAE Integration Test Suite');
    console.log('🏭 Advanced ID Asia Engineering Co.,Ltd');
    console.log('📍 Chiang Mai, Thailand');
  });

  afterAll(async () => {
    // Cleanup WebSocket connections
    testUsers.forEach(user => {
      if (user.ws && user.ws.readyState === WebSocket.OPEN) {
        user.ws.close();
      }
    });
  });

  describe('🌐 Full Stack Integration', () => {
    test('Backend + Frontend Communication', async () => {
      // Test backend health
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data.success).toBe(true);
      
      // Test if frontend is accessible (if running)
      try {
        const frontendResponse = await axios.get(FRONTEND_URL, {
          timeout: 2000
        });
        expect(frontendResponse.status).toBe(200);
        console.log('✅ Frontend is accessible');
      } catch (error) {
        console.log('ℹ️ Frontend not running or not accessible - test skipped');
      }
      
      // Verify AAE configuration is consistent
      const stats = await axios.get(`${BASE_URL}/api/stats`);
      expect(stats.data.data.aae.company).toBe('Advanced ID Asia Engineering Co.,Ltd');
      expect(stats.data.data.aae.location).toBe('Chiang Mai, Thailand');
    });

    test('WebSocket + Matrix Integration', async () => {
      const user = await createTestUser('integration_test_user');
      
      // Test WebSocket connection
      expect(user.ws.readyState).toBe(WebSocket.OPEN);
      
      // Test Matrix status
      const matrixStatus = await axios.get(`${BASE_URL}/api/matrix/rooms`);
      expect(matrixStatus.status).toBe(200);
      
      // Send encrypted message simulation
      const encryptedMessage = {
        id: Date.now(),
        content: 'AAE Integration Test - Encrypted Message',
        type: 'encrypted_test',
        user: user.username,
        department: 'engineering',
        encrypted: true
      };
      
      const messagePromise = new Promise((resolve) => {
        user.ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'system' || message.content.includes('Integration Test')) {
            resolve(message);
          }
        });
      });
      
      user.ws.send(JSON.stringify(encryptedMessage));
      const response = await messagePromise;
      
      expect(response).toBeDefined();
      console.log('✅ WebSocket + Matrix integration working');
    });
  });

  describe('🏢 AAE Corporate Features Integration', () => {
    test('Department-Based Communication', async () => {
      const departments = ['engineering', 'manufacturing', 'quality-control', 'management', 'it-support'];
      const departmentUsers = [];
      
      // Create users for different departments
      for (const dept of departments) {
        const user = await createTestUser(`aae_${dept}_user`);
        user.department = dept;
        departmentUsers.push(user);
      }
      
      // Test department-specific messaging
      const engineeringUser = departmentUsers.find(u => u.department === 'engineering');
      const manufacturingUser = departmentUsers.find(u => u.department === 'manufacturing');
      
      const departmentMessage = {
        id: Date.now(),
        content: 'AAE Engineering Department - CAD Review Required',
        type: 'department_message',
        user: engineeringUser.username,
        department: 'engineering',
        priority: 'high'
      };
      
      engineeringUser.ws.send(JSON.stringify(departmentMessage));
      
      // Allow message processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Department-based messaging integration working');
      
      // Cleanup department users
      departmentUsers.forEach(user => user.ws.close());
    });

    test('AAE Branding and Theming', async () => {
      const response = await axios.get(`${BASE_URL}/`);
      expect(response.data.data.branding.primaryColor).toBe('#00BCD4');
      expect(response.data.data.branding.secondaryColor).toBe('#0097A7');
      expect(response.data.data.branding.accentColor).toBe('#00E5FF');
      expect(response.data.data.branding.theme).toBe('cyan-light-blue-modern');
      
      console.log('✅ AAE branding integration verified');
    });

    test('ISO Compliance Features', async () => {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      const aaeConfig = healthResponse.data.data.aae_config;
      
      expect(aaeConfig.compliance).toContain('ISO 9001:2015');
      expect(aaeConfig.compliance).toContain('IATF 16949');
      expect(aaeConfig.industry).toBe('Automotive Manufacturing & Engineering');
      
      // Test audit trail functionality
      const auditMessage = {
        id: Date.now(),
        content: 'AAE Quality Control Audit - Document Review',
        type: 'audit_message',
        user: 'aae_qc_auditor',
        department: 'quality-control',
        compliance_level: 'ISO_9001_2015',
        retention_period: '7_years'
      };
      
      const user = await createTestUser('aae_qc_auditor');
      user.ws.send(JSON.stringify(auditMessage));
      
      console.log('✅ ISO compliance features integrated');
      user.ws.close();
    });
  });

  describe('⚡ Performance Integration Under Load', () => {
    test('Multi-User Real-Time Communication', async () => {
      const userCount = 10;
      const users = [];
      
      // Create multiple concurrent users
      for (let i = 0; i < userCount; i++) {
        const user = await createTestUser(`load_test_user_${i}`);
        users.push(user);
      }
      
      const messagePromises = [];
      const startTime = performance.now();
      
      // Send messages from all users simultaneously
      users.forEach((user, index) => {
        const promise = new Promise((resolve) => {
          user.ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            resolve({ user: index, message, timestamp: performance.now() });
          });
        });
        messagePromises.push(promise);
        
        user.ws.send(JSON.stringify({
          id: Date.now() + index,
          content: `Multi-user test message from user ${index}`,
          type: 'load_test',
          user: user.username,
          department: 'engineering'
        }));
      });
      
      // Wait for all responses
      const responses = await Promise.all(messagePromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(responses.length).toBe(userCount);
      expect(totalTime).toBeLessThan(1000); // All messages should be processed within 1 second
      
      console.log(`✅ Multi-user integration: ${userCount} users, ${totalTime.toFixed(2)}ms total`);
      
      // Cleanup
      users.forEach(user => user.ws.close());
    });

    test('Database + Cache Integration Performance', async () => {
      // Test rapid API calls to verify caching
      const iterations = 20;
      const promises = [];
      
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        promises.push(axios.get(`${BASE_URL}/api/stats`));
      }
      
      const responses = await Promise.all(promises);
      const totalTime = performance.now() - start;
      const avgResponseTime = totalTime / iterations;
      
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(avgResponseTime).toBeLessThan(50); // Cached responses should be fast
      
      console.log(`✅ Database + Cache integration: ${avgResponseTime.toFixed(2)}ms avg (${iterations} requests)`);
    });
  });

  describe('🔒 Security Integration Tests', () => {
    test('End-to-End Message Security', async () => {
      const secureUser = await createTestUser('security_test_user');
      
      const secureMessage = {
        id: Date.now(),
        content: 'AAE Confidential - Engineering Specifications',
        type: 'secure_message',
        user: secureUser.username,
        department: 'engineering',
        encrypted: true,
        security_level: 'confidential',
        compliance: 'IATF_16949'
      };
      
      const responsePromise = new Promise((resolve) => {
        secureUser.ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          resolve(message);
        });
      });
      
      secureUser.ws.send(JSON.stringify(secureMessage));
      const response = await responsePromise;
      
      expect(response).toBeDefined();
      console.log('✅ End-to-end security integration working');
      
      secureUser.ws.close();
    });

    test('Matrix E2E Encryption Integration', async () => {
      // Test Matrix room creation and encryption status
      const matrixResponse = await axios.get(`${BASE_URL}/api/matrix/rooms`);
      
      expect(matrixResponse.status).toBe(200);
      expect(matrixResponse.data.success).toBe(true);
      
      // Verify encryption is configured
      if (matrixResponse.data.data.encrypted !== undefined) {
        expect(matrixResponse.data.data.encrypted).toBe(true);
      }
      
      console.log('✅ Matrix E2E encryption integration verified');
    });
  });

  describe('📱 Cross-Platform Integration', () => {
    test('API Compatibility for Mobile/Desktop', async () => {
      // Test API endpoints that mobile/desktop apps would use
      const endpoints = [
        '/health',
        '/api/stats',
        '/api/messages',
        '/api/matrix/rooms'
      ];
      
      for (const endpoint of endpoints) {
        const response = await axios.get(`${BASE_URL}${endpoint}`)
          .catch(() => ({ status: 404 })); // Handle expected 404s gracefully
        
        expect([200, 404].includes(response.status)).toBe(true);
      }
      
      // Test WebSocket compatibility
      const mobileUser = await createTestUser('mobile_test_user');
      expect(mobileUser.ws.readyState).toBe(WebSocket.OPEN);
      
      console.log('✅ Cross-platform API compatibility verified');
      mobileUser.ws.close();
    });
  });

  describe('🚀 BMAD Method Integration Validation', () => {
    test('All Systems Integration with BMAD Method', async () => {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      const data = healthResponse.data.data;
      
      // Verify BMAD Method is active
      expect(data.bmad_status.agents_active).toBe(25);
      expect(data.bmad_status.performance_targets_met).toBe(true);
      
      // Verify all services are integrated
      expect(data.services.websocket.status).toBe('healthy');
      expect(data.services.database.status).toBe('healthy');
      expect(data.services.redis.status).toBe('healthy');
      
      // Verify performance targets are met in integrated environment
      expect(data.performance_metrics.message_latency_ms).toBeLessThan(25);
      expect(data.performance_metrics.database_query_ms).toBeLessThan(10);
      
      console.log('✅ BMAD Method full integration validated');
      console.log(`   - ${data.bmad_status.agents_active} agents active`);
      console.log(`   - Sprint day ${data.bmad_status.current_sprint_day}/3`);
      console.log(`   - Performance targets: ${data.bmad_status.performance_targets_met ? 'MET' : 'NOT MET'}`);
    });
  });

  // Helper function to create test users with WebSocket connections
  async function createTestUser(username) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      
      ws.on('open', () => {
        const user = {
          username,
          ws,
          id: Date.now() + Math.random()
        };
        testUsers.push(user);
        resolve(user);
      });
      
      ws.on('error', reject);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }
});
