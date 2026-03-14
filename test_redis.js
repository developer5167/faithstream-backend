const redisClient = require('./src/config/redis');

async function test() {
    console.log('Waiting for redis connect...');
    // wait for connection
    while (!redisClient.isReady) {
        await new Promise(r => setTimeout(r, 100));
    }
    console.log('Redis ready.');
    
    const key = 'test_queue';
    await redisClient.lPush(key, 'test_val');
    console.log('Pushed test_val');
    
    const val = await redisClient.rPop(key);
    console.log('Popped:', val);
    
    process.exit(0);
}

test().catch(console.error);
