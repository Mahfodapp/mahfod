const fs = require('fs');
const https = require('https');

const state = JSON.parse(fs.readFileSync('C:\\Users\\dell\\.expo\\state.json', 'utf8'));
const sessionSecret = encodeURIComponent(state.auth.sessionSecret);

const query = `
query {
  app {
    byId(appId: "a0bc9f38-a0a6-4c35-a4b7-77de626ddc2b") {
      id
      builds(limit: 10) {
        id
        projectArchiveUrl
      }
    }
  }
}
`;

const req = https.request('https://api.expo.dev/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `expo-session=${sessionSecret}`
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', console.error);
req.write(JSON.stringify({ query }));
req.end();
