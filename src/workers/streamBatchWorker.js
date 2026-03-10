const redisClient = require('../config/redis');
const pool = require('../config/db');

// How often the worker checks Redis for stream events
const BATCH_INTERVAL_MS = 10000; // 10 seconds
const BATCH_SIZE = 500; // Max events to process in one SQL transaction

const processStreamQueue = async () => {
    try {
        // 1. Pop up to BATCH_SIZE events from the right side of the queue
        const rawEvents = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
            const event = await redisClient.rPop('stream_analytics_queue');
            if (!event) break; // Queue is empty
            rawEvents.push(event);
        }

        if (rawEvents.length === 0) return;

        console.log(`[StreamBatchWorker] Processing ${rawEvents.length} streaming events from RAM...`);

        // 2. Parse the JSON strings
        const events = rawEvents.map(e => JSON.parse(e));

        // 3. We must process them safely. Some events might be duplicates, 
        // some might be under 30 seconds. We apply the same logic as the old service.
        const validEvents = events.filter(e => e.duration >= 30);

        if (validEvents.length === 0) return;

        // 4. Perform a BULK Postgres connection (1 connection instead of N connections)
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const event of validEvents) {
                const { songId, userId, duration, timestamp } = event;

                // Server-side deduplication lock check
                const dedupKey = `stream_dedup:${userId}:${songId}`;
                const acquired = await redisClient.set(dedupKey, '1', {
                    NX: true,
                    PX: 5000 // 5 seconds
                });

                if (!acquired) {
                    continue; // Skip duplicate
                }

                // Insert into streams table
                await client.query(
                    'INSERT INTO streams (song_id, listener_id, duration_listened, created_at) VALUES ($1, $2, $3, $4)',
                    [songId, userId, duration, new Date(timestamp)]
                );
            }

            await client.query('COMMIT');
            console.log(`[StreamBatchWorker] Successfully batch-inserted valid streaming events to PostgreSQL.`);

        } catch (dbError) {
            await client.query('ROLLBACK');
            console.error(`[StreamBatchWorker] Postgres Transaction Failed. Putting events back into Redis queue...`);
            
            // Critical: If Postgres fails, put the events back into the front of the queue so we don't lose analytics!
            for (const raw of rawEvents) {
                await redisClient.lPush('stream_analytics_queue', raw);
            }
        } finally {
            client.release();
        }

    } catch (e) {
        console.error('[StreamBatchWorker] Unhandled Worker Exception:', e);
    }
};

// Start the daemon interval
exports.start = () => {
    console.log('[StreamBatchWorker] Service Daemon Started running every 10 seconds...');
    setInterval(processStreamQueue, BATCH_INTERVAL_MS);
};
