const pool = require('../../config/db');
const homeService = require('../../services/home.service');
const adService = require('../../services/ad.service');
const appConfigRepo = require('../../repositories/appConfig.repo');

exports.bootstrap = async (req, res) => {
    try {
        const userId = req.user?.id; // Could be null if unauthenticated

        // Always fetch app configuration for version checking
        const appConfigs = await appConfigRepo.getConfigs([
            'android_latest_version', 
            'ios_latest_version'
        ]);

        // If unauthenticated, we return public home feed, ads, and the config
        if (!userId) {
            const homeFeed = await homeService.getHomeFeed(null);
            return res.json({
                success: true,
                data: {
                    user: null,
                    homeFeed: homeFeed,
                    ads: [],
                    appConfig: appConfigs
                }
            });
        }

        // 1. Fetch User Profile
        const userQuery = `
            SELECT id, name, email, bio, 
                   profile_pic_url, artist_status, 
                   is_admin, copyright_strikes, created_at 
            FROM users 
            WHERE id = $1
        `;

        // 2. Fetch Subscription
        const subQuery = `
            SELECT plan as plan_name, status, started_at as current_period_start, expires_at as current_period_end 
            FROM subscriptions 
            WHERE user_id = $1 AND status = 'ACTIVE'
            ORDER BY started_at DESC LIMIT 1
        `;

        // Run all main queries concurrently for maximum speed
        const [userResult, subResult, homeFeed] = await Promise.all([
            pool.query(userQuery, [userId]),
            pool.query(subQuery, [userId]),
            homeService.getHomeFeed(userId)
        ]);
        
        const adsData = []; // Temporary pass until AdsBloc is wired

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];
        let subscription = subResult.rows[0] ? {
            plan_name: subResult.rows[0].plan_name,
            status: subResult.rows[0].status,
            current_period_start: subResult.rows[0].current_period_start,
            current_period_end: subResult.rows[0].current_period_end
        } : null;

        // Construct final payload
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            profile_pic_url: user.profile_pic_url,
            artist_status: user.artist_status,
            role: user.role,
            is_admin: user.is_admin,
            copyright_strikes: user.copyright_strikes || 0,
            subscription: subscription,
            created_at: user.created_at
        };

        res.json({
            success: true,
            data: {
                user: userData,
                homeFeed: homeFeed,
                ads: adsData,
                appConfig: appConfigs
            }
        });

    } catch (error) {
        console.error('Bootstrap Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bootstrap application state'
        });
    }
};
