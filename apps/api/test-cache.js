const { createCache } = require('cache-manager');

async function main() {
  const cache = createCache({ ttl: 5000 }); // 5 seconds
  await cache.set('key1', 'value1');
  console.log('key1:', await cache.get('key1'));
  
  await cache.set('key2', 'value2', 10000); // 10 seconds?
  console.log('key2:', await cache.get('key2'));
}
main();
