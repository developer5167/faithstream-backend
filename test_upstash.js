const redisClient = require('./src/config/redis');

async function checkUpstash() {
    console.log('Connecting to Upstash...');
    while (!redisClient.isReady) {
        await new Promise(r => setTimeout(r, 100));
    }
    console.log('Connected.');
    
    const qName = 'hls_transcoding_queue';
    const len = await redisClient.lLen(qName);
    console.log(`Queue length for ${qName}: ${len}`);
    
    if (len > 0) {
        const items = await redisClient.lRange(qName, 0, -1);
        console.log('Queue items:', items);
    }
    
    process.exit(0);
}

checkUpstash().catch(console.error);
