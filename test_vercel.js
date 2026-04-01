const https = require('https');

https.get('https://attendance-management-software-nine.vercel.app/assets/index-PuIw-pIl.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // find the api url pattern
    const match = data.match(/http[s]?:\/\/[^"']+/g);
    if(match) {
        console.log("Found URLs in JS:", new Set(match));
    }
  });
});
