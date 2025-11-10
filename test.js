// test.js - Test API locally before deployment

const handler = require('./api/check');

// Mock request and response objects
const mockRequest = {
  query: {
    input: '@khaby.lame' // Change this to test different users
  },
  method: 'GET',
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const mockResponse = {
  statusCode: 200,
  headers: {},
  body: null,
  
  setHeader(key, value) {
    this.headers[key] = value;
  },
  
  status(code) {
    this.statusCode = code;
    return this;
  },
  
  json(data) {
    this.body = data;
    console.log('\n=== API Response ===');
    console.log('Status:', this.statusCode);
    console.log('Headers:', this.headers);
    console.log('\n=== Response Data ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n=== Quick Summary ===');
      console.log('Username:', data.quick.username);
      console.log('Followers:', data.quick.followers.toLocaleString());
      console.log('Quality Score:', data.quick.qualityScore + '/100');
      console.log('Engagement Rate:', data.quick.engagementRate + '%');
      console.log('Verified:', data.quick.verified ? '✅' : '❌');
      console.log('Private:', data.quick.private ? '🔒' : '🔓');
      console.log('\n✅ Test passed!');
    } else {
      console.log('\n❌ Test failed:', data.error);
    }
  },
  
  end() {
    // No-op
  }
};

// Run test
console.log('🧪 Testing TikTok Profile Checker API...');
console.log('Input:', mockRequest.query.input);
console.log('\n⏳ Fetching data from TikTok...\n');

handler(mockRequest, mockResponse).catch(error => {
  console.error('\n❌ Error during test:');
  console.error(error);
  process.exit(1);
});
