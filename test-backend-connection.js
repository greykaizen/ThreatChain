const http = require('http');

console.log('Testing backend connection...\n');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Backend is running!');
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.log('❌ Backend is NOT running!');
  console.log('Error:', error.message);
  console.log('\nTo start the backend, run:');
  console.log('  npm run backend');
  console.log('  OR');
  console.log('  node server.js');
});

req.on('timeout', () => {
  console.log('❌ Connection timeout - backend is not responding');
  req.destroy();
});

req.end();
