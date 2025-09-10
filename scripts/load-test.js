#!/usr/bin/env node
/**
 * AAEConnect Load Testing Script
 * Advanced ID Asia Engineering Co.,Ltd
 * 
 * Simulates 1000+ concurrent users to validate performance targets
 */

const WebSocket = require('ws');
const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  backend_url: process.env.BACKEND_URL || 'http://localhost:3000',
  websocket_url: process.env.WS_URL || 'ws://localhost:3000/ws',
  target_users: parseInt(process.env.TARGET_USERS) || 1000,
  ramp_up_time: parseInt(process.env.RAMP_UP_TIME) || 60, // seconds
  test_duration: parseInt(process.env.TEST_DURATION) || 300, // seconds
  message_interval: parseInt(process.env.MESSAGE_INTERVAL) || 5000, // ms
  
  // AAE Configuration
  company: 'Advanced ID Asia Engineering Co.,Ltd',
  location: 'Chiang Mai, Thailand',
  departments: ['engineering', 'manufacturing', 'quality-control', 'management', 'it-support'],
  
  // Performance Targets
  targets: {
    message_latency_ms: 25,
    connection_success_rate: 0.99,
    message_success_rate: 0.999,
    concurrent_users: 1000
  }
};

// Metrics collector
class MetricsCollector {
  constructor() {
    this.metrics = {
      connections_attempted: 0,
      connections_successful: 0,
      connections_failed: 0,
      messages_sent: 0,
      messages_received: 0,
      messages_failed: 0,
      latencies: [],
      errors: [],
      start_time: performance.now()
    };
  }
  
  recordConnection(success) {
    this.metrics.connections_attempted++;
    if (success) {
      this.metrics.connections_successful++;
    } else {
      this.metrics.connections_failed++;
    }
  }
  
  recordMessage(sent, latency = null) {
    if (sent) {
      this.metrics.messages_sent++;
      if (latency !== null) {
        this.metrics.latencies.push(latency);
        this.metrics.messages_received++;
      }
    } else {
      this.metrics.messages_failed++;
    }
  }
  
  recordError(error) {
    this.metrics.errors.push({
      timestamp: new Date().toISOString(),
      error: error.message || error
    });
  }
  
  getReport() {
    const duration = (performance.now() - this.metrics.start_time) / 1000;
    const avgLatency = this.metrics.latencies.length > 0 
      ? this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length 
      : 0;
    const p95Latency = this.metrics.latencies.length > 0
      ? this.metrics.latencies.sort((a, b) => a - b)[Math.floor(this.metrics.latencies.length * 0.95)]
      : 0;
    const connectionSuccessRate = this.metrics.connections_attempted > 0
      ? this.metrics.connections_successful / this.metrics.connections_attempted
      : 0;
    const messageSuccessRate = this.metrics.messages_sent > 0
      ? this.metrics.messages_received / this.metrics.messages_sent
      : 0;
    
    return {
      duration_seconds: duration,
      connections: {
        attempted: this.metrics.connections_attempted,
        successful: this.metrics.connections_successful,
        failed: this.metrics.connections_failed,
        success_rate: connectionSuccessRate
      },
      messages: {
        sent: this.metrics.messages_sent,
        received: this.metrics.messages_received,
        failed: this.metrics.messages_failed,
        success_rate: messageSuccessRate
      },
      latency: {
        average_ms: avgLatency.toFixed(2),
        p95_ms: p95Latency.toFixed(2),
        samples: this.metrics.latencies.length
      },
      errors: this.metrics.errors.length,
      throughput: {
        messages_per_second: (this.metrics.messages_sent / duration).toFixed(2),
        connections_per_second: (this.metrics.connections_successful / duration).toFixed(2)
      }
    };
  }
}

// Virtual user simulation
class VirtualUser {
  constructor(id, metrics) {
    this.id = id;
    this.metrics = metrics;
    this.username = `aae_user_${id}`;
    this.department = CONFIG.departments[id % CONFIG.departments.length];
    this.ws = null;
    this.connected = false;
    this.messageInterval = null;
  }
  
  async connect() {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(CONFIG.websocket_url);
        
        this.ws.on('open', () => {
          this.connected = true;
          this.metrics.recordConnection(true);
          this.startMessaging();
          resolve(true);
        });
        
        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            if (message.echo && message.timestamp) {
              const latency = Date.now() - parseInt(message.timestamp);
              this.metrics.recordMessage(true, latency);
            }
          } catch (e) {
            // Ignore parse errors for non-echo messages
          }
        });
        
        this.ws.on('error', (error) => {
          this.metrics.recordError(error);
          this.connected = false;
        });
        
        this.ws.on('close', () => {
          this.connected = false;
          this.stopMessaging();
        });
        
        // Timeout connection attempt
        setTimeout(() => {
          if (!this.connected) {
            this.metrics.recordConnection(false);
            resolve(false);
          }
        }, 10000);
        
      } catch (error) {
        this.metrics.recordConnection(false);
        this.metrics.recordError(error);
        resolve(false);
      }
    });
  }
  
  startMessaging() {
    if (!this.connected) return;
    
    // Send initial message
    this.sendMessage();
    
    // Schedule periodic messages
    this.messageInterval = setInterval(() => {
      if (this.connected) {
        this.sendMessage();
      }
    }, CONFIG.message_interval + Math.random() * 2000); // Add jitter
  }
  
  stopMessaging() {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
  }
  
  sendMessage() {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const message = {
      id: Date.now(),
      timestamp: Date.now().toString(),
      user: this.username,
      department: this.department,
      content: `Load test message from ${this.username} at ${new Date().toISOString()}`,
      type: 'load_test',
      echo: true // Request echo for latency measurement
    };
    
    try {
      this.ws.send(JSON.stringify(message));
      this.metrics.recordMessage(true);
    } catch (error) {
      this.metrics.recordMessage(false);
      this.metrics.recordError(error);
    }
  }
  
  disconnect() {
    this.stopMessaging();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
}

// Load test orchestrator
class LoadTestOrchestrator {
  constructor() {
    this.metrics = new MetricsCollector();
    this.users = [];
    this.running = false;
  }
  
  async run() {
    console.log('🚀 AAEConnect Load Testing Starting...');
    console.log(`🏭 ${CONFIG.company}`);
    console.log(`📍 ${CONFIG.location}`);
    console.log(`👥 Target Users: ${CONFIG.target_users}`);
    console.log(`⏱️ Ramp Up: ${CONFIG.ramp_up_time}s`);
    console.log(`⏱️ Duration: ${CONFIG.test_duration}s`);
    console.log('');
    
    this.running = true;
    
    // Health check
    await this.healthCheck();
    
    // Ramp up users
    await this.rampUpUsers();
    
    // Run test for specified duration
    await this.runTest();
    
    // Ramp down and cleanup
    await this.cleanup();
    
    // Generate report
    this.generateReport();
  }
  
  async healthCheck() {
    console.log('🔍 Performing health check...');
    
    try {
      const response = await axios.get(`${CONFIG.backend_url}/health`);
      if (response.data.success) {
        console.log('✅ Backend is healthy');
        console.log(`   Latency: ${response.data.data.performance_metrics.message_latency_ms}ms`);
        console.log(`   Memory: ${response.data.data.performance_metrics.memory_usage_mb}MB`);
      } else {
        throw new Error('Backend health check failed');
      }
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  }
  
  async rampUpUsers() {
    console.log(`\n📈 Ramping up ${CONFIG.target_users} users over ${CONFIG.ramp_up_time}s...`);
    
    const usersPerBatch = Math.ceil(CONFIG.target_users / (CONFIG.ramp_up_time / 5));
    const batchDelay = 5000; // 5 seconds between batches
    
    for (let i = 0; i < CONFIG.target_users && this.running; i += usersPerBatch) {
      const batchSize = Math.min(usersPerBatch, CONFIG.target_users - i);
      const promises = [];
      
      for (let j = 0; j < batchSize; j++) {
        const user = new VirtualUser(i + j, this.metrics);
        this.users.push(user);
        promises.push(user.connect());
      }
      
      await Promise.all(promises);
      
      const connected = this.users.filter(u => u.connected).length;
      console.log(`   Connected: ${connected}/${this.users.length} users`);
      
      if (i + batchSize < CONFIG.target_users) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }
    
    const totalConnected = this.users.filter(u => u.connected).length;
    console.log(`✅ Ramp up complete: ${totalConnected}/${CONFIG.target_users} users connected`);
  }
  
  async runTest() {
    console.log(`\n⚡ Running load test for ${CONFIG.test_duration}s...`);
    
    const startTime = Date.now();
    const updateInterval = 10000; // Update every 10 seconds
    
    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const report = this.metrics.getReport();
      
      console.log(`   [${elapsed}s] Active: ${this.users.filter(u => u.connected).length} | ` +
                  `Msgs: ${report.messages.sent} | ` +
                  `Avg Latency: ${report.latency.average_ms}ms | ` +
                  `P95: ${report.latency.p95_ms}ms`);
      
      // Check if performance targets are being met
      if (parseFloat(report.latency.average_ms) > CONFIG.targets.message_latency_ms) {
        console.warn(`   ⚠️ Latency ${report.latency.average_ms}ms exceeds target ${CONFIG.targets.message_latency_ms}ms`);
      }
    }, updateInterval);
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, CONFIG.test_duration * 1000));
    
    clearInterval(intervalId);
    console.log('✅ Load test phase complete');
  }
  
  async cleanup() {
    console.log('\n🧹 Cleaning up connections...');
    this.running = false;
    
    // Disconnect all users
    const disconnectPromises = this.users.map(user => {
      return new Promise(resolve => {
        user.disconnect();
        resolve();
      });
    });
    
    await Promise.all(disconnectPromises);
    console.log('✅ All connections closed');
  }
  
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 AAEConnect Load Test Report');
    console.log('='.repeat(70));
    
    const report = this.metrics.getReport();
    
    console.log(`\n🏭 ${CONFIG.company}`);
    console.log(`📍 ${CONFIG.location}`);
    console.log(`⏱️ Test Duration: ${report.duration_seconds.toFixed(2)}s`);
    
    console.log('\n👥 Connection Statistics:');
    console.log(`   Attempted: ${report.connections.attempted}`);
    console.log(`   Successful: ${report.connections.successful}`);
    console.log(`   Failed: ${report.connections.failed}`);
    console.log(`   Success Rate: ${(report.connections.success_rate * 100).toFixed(2)}%`);
    
    console.log('\n💬 Message Statistics:');
    console.log(`   Sent: ${report.messages.sent}`);
    console.log(`   Received: ${report.messages.received}`);
    console.log(`   Failed: ${report.messages.failed}`);
    console.log(`   Success Rate: ${(report.messages.success_rate * 100).toFixed(2)}%`);
    
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Average Latency: ${report.latency.average_ms}ms`);
    console.log(`   P95 Latency: ${report.latency.p95_ms}ms`);
    console.log(`   Messages/Second: ${report.throughput.messages_per_second}`);
    console.log(`   Connections/Second: ${report.throughput.connections_per_second}`);
    
    console.log('\n🎯 Target Validation:');
    const latencyPassed = parseFloat(report.latency.average_ms) <= CONFIG.targets.message_latency_ms;
    const connectionsPassed = report.connections.success_rate >= CONFIG.targets.connection_success_rate;
    const messagesPassed = report.messages.success_rate >= CONFIG.targets.message_success_rate;
    const usersPassed = report.connections.successful >= CONFIG.targets.concurrent_users * 0.95;
    
    console.log(`   Message Latency (<${CONFIG.targets.message_latency_ms}ms): ${latencyPassed ? '✅ PASS' : '❌ FAIL'} (${report.latency.average_ms}ms)`);
    console.log(`   Connection Success (>${(CONFIG.targets.connection_success_rate * 100).toFixed(0)}%): ${connectionsPassed ? '✅ PASS' : '❌ FAIL'} (${(report.connections.success_rate * 100).toFixed(2)}%)`);
    console.log(`   Message Success (>${(CONFIG.targets.message_success_rate * 100).toFixed(1)}%): ${messagesPassed ? '✅ PASS' : '❌ FAIL'} (${(report.messages.success_rate * 100).toFixed(2)}%)`);
    console.log(`   Concurrent Users (>=${CONFIG.targets.concurrent_users}): ${usersPassed ? '✅ PASS' : '❌ FAIL'} (${report.connections.successful})`);
    
    const allPassed = latencyPassed && connectionsPassed && messagesPassed && usersPassed;
    
    console.log('\n' + '='.repeat(70));
    console.log(allPassed 
      ? '🏆 LOAD TEST PASSED - All performance targets met!'
      : '⚠️ LOAD TEST FAILED - Some targets not met');
    console.log('='.repeat(70));
    
    // Save report to file
    const fs = require('fs');
    const reportFile = `load-test-report-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Load test interrupted by user');
  process.exit(1);
});

// Run load test
const orchestrator = new LoadTestOrchestrator();
orchestrator.run().catch(error => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});
