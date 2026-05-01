const resolve = require('expo-modules-autolinking');
console.log(JSON.stringify(resolve(process.argv.slice(2)), null, 2));
