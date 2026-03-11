const http = require('http');
const https = require('https');

const imageUrl = 'https://pub-bebfb8756c034cec903236ae2544a084.r2.dev/images/1772450277847-matthew.jpg';

console.log(`Checking connectivity to R2: ${imageUrl}`);

const client = imageUrl.startsWith('https') ? https : http;

const req = client.get(imageUrl, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

  if (res.statusCode === 200) {
    console.log('SUCCESS: Image is reachable from this server.');
  } else {
    console.log('FAILURE: Image returned an error status.');
  }
});

req.on('error', (e) => {
  console.error(`ERROR: Connection failed: ${e.message}`);
});

req.end();
