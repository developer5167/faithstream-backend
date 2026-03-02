const db = require('../config/db');

exports.create = async (data) => {
  const query = `
    INSERT INTO advertisements 
    (advertiser_id, title, ad_type, media_url, landing_url, start_time, end_time, payment_amount_inr, s3_key, daily_budget_limit)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`;
  
  const values = [
    data.advertiser_id, data.title, data.ad_type, data.media_url, data.landing_url,
    data.start_time, data.end_time, data.payment_amount_inr || 0, data.s3_key, data.daily_budget_limit || 500
  ];

  const res = await db.query(query, values);
  return res.rows[0];
};

exports.findForUser = async (userId) => {
  const res = await db.query(
    `SELECT * FROM advertisements WHERE advertiser_id = $1 AND status != 'DELETED' ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

exports.findByIdAndUser = async (adId, userId) => {
  const res = await db.query(
    `SELECT * FROM advertisements WHERE id = $1 AND advertiser_id = $2`,
    [adId, userId]
  );
  return res.rows[0];
};

exports.getAdAnalyticsByDate = async (adId) => {
  // Returns views and clicks grouped by day for the last 7 days
  const res = await db.query(`
    WITH dates AS (
        SELECT current_date - i AS date
        FROM generate_series(0, 6) i
    )
    SELECT 
        d.date,
        COUNT(CASE WHEN a.event_type = 'VIEW' THEN 1 END) as views,
        COUNT(CASE WHEN a.event_type = 'CLICK' THEN 1 END) as clicks
    FROM dates d
    LEFT JOIN ad_analytics a ON DATE(a.created_at) = d.date AND a.ad_id = $1
    GROUP BY d.date
    ORDER BY d.date ASC
  `, [adId]);
  return res.rows;
};

exports.getPending = async () => {
  const res = await db.query(
    `SELECT a.*, adv.company_name as advertiser_name, adv.email as advertiser_email 
     FROM advertisements a
     JOIN advertisers adv ON adv.id = a.advertiser_id
     WHERE a.status = 'PENDING'
     ORDER BY a.created_at ASC`
  );
  return res.rows;
};

exports.updateStatus = async (adId, status) => {
  const res = await db.query(
    `UPDATE advertisements SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [adId, status]
  );
  return res.rows[0];
};

exports.getNextAd = async (adType) => {
  // 1. Status is APPROVED
  // 2. Event is currently active (start_time <= NOW <= end_time)
  // 3. Advertiser has a positive wallet balance
  // 4. Ad hasn't exceeded its daily budget
  // 5. Prioritize ads with the lowest view count (Least-Served First)
  const res = await db.query(
    `SELECT a.* FROM advertisements a
     JOIN advertisers adv ON a.advertiser_id = adv.id
     WHERE a.status = 'APPROVED'
       AND a.ad_type = $1
       AND a.start_time <= NOW()
       AND a.end_time >= NOW()
       AND adv.wallet_balance > 0
       -- Ensure we haven't blown the daily budget
       -- (total_spend should be reset nightly, or calculated dynamically)
       AND a.total_spend < a.daily_budget_limit 
     ORDER BY a.views_count ASC
     LIMIT 1`,
    [adType]
  );
  return res.rows[0];
};

exports.trackEvent = async (adId, userId, eventType) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Log the event
    await client.query(
      `INSERT INTO ad_analytics (ad_id, user_id, event_type) VALUES ($1, $2, $3)`,
      [adId, userId, eventType]
    );

    // 2. Determine Cost & Deduction Details
    let metricField = null;
    let costField = null;
    let txType = null;

    if (eventType === 'VIEW') {
      metricField = 'views_count';
      // If it's a VIEW, we only charge if it's a POWER_VIDEO (CPM model)
      costField = 'cpm_rate / 1000'; 
      txType = 'SPEND_CPM';
    } else if (eventType === 'CLICK') {
      metricField = 'clicks_count';
      // If it's a CLICK, we only charge for COVER_OVERLAY (CPC model)
      costField = 'cpc_rate';
      txType = 'SPEND_CPC';
    }

    if (metricField) {
      // 3. Update the ad metrics and get cost data
      const adRes = await client.query(
        `UPDATE advertisements 
         SET ${metricField} = ${metricField} + 1 
         WHERE id = $1 
         RETURNING advertiser_id, ad_type, cpc_rate, cpm_rate`,
        [adId]
      );
      
      const adData = adRes.rows[0];

      // 4. Determine if we should deduct money
      let amountToDeduct = 0;
      // POWER_VIDEO and APP_OPEN are both CPM (impression-based) ad types
      if (eventType === 'VIEW' && (adData.ad_type === 'POWER_VIDEO' || adData.ad_type === 'APP_OPEN')) {
        amountToDeduct = parseFloat(adData.cpm_rate) / 1000;
      } else if (eventType === 'CLICK' && adData.ad_type === 'COVER_OVERLAY') {
        amountToDeduct = parseFloat(adData.cpc_rate);
      }

      if (amountToDeduct > 0) {
        // Log transaction (negative amount)
        await client.query(
          `INSERT INTO wallet_transactions (advertiser_id, amount, type, ad_id)
           VALUES ($1, $2, $3, $4)`,
          [adData.advertiser_id, -amountToDeduct, txType, adId]
        );

        // Update ad spend
        await client.query(
          `UPDATE advertisements SET total_spend = total_spend + $2 WHERE id = $1`,
          [adId, amountToDeduct]
        );

        // Deduct from wallet
        await client.query(
          `UPDATE advertisers SET wallet_balance = wallet_balance - $2 WHERE id = $1`,
          [adData.advertiser_id, amountToDeduct]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to track ad event and deduct wallet:', err);
  } finally {
    client.release();
  }
};

exports.getExpiredWithS3Keys = async () => {
  const res = await db.query(
    `SELECT id, s3_key FROM advertisements
     WHERE end_time < NOW() AND status != 'EXPIRED'`
  );
  return res.rows;
};

exports.deleteAd = async (adId) => {
  await db.query(`DELETE FROM advertisements WHERE id = $1`, [adId]);
};

exports.getAdvertiserDashboard = async (userId) => {
    // get total spending, views, clicks for the advertiser
    const res = await db.query(`
      SELECT 
        COALESCE(SUM(total_spend), 0) AS total_spent,
        COALESCE(SUM(views_count), 0) AS total_views,
        COALESCE(SUM(clicks_count), 0) AS total_clicks,
        CASE 
          WHEN SUM(views_count) > 0 THEN ROUND((SUM(clicks_count)::numeric / SUM(views_count)::numeric) * 100, 2)
          ELSE 0
        END AS ctr_percent
      FROM advertisements
      WHERE advertiser_id = $1 AND status != 'DELETED'
    `, [userId]);
    return res.rows[0];
};
