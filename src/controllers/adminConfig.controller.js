const appConfigRepo = require('../repositories/appConfig.repo');
const notificationService = require('../services/notification.service');

/**
 * Get all app configurations for admin review
 */
exports.getAllAppConfigs = async (req, res) => {
    try {
        const configs = await appConfigRepo.getAllConfigs();
        res.json({ success: true, configs });
    } catch (error) {
        console.error('[AdminConfigController] Error fetching configs:', error);
        res.status(500).json({ success: false, message: 'Server error fetching app configurations' });
    }
};

/**
 * Update app configuration and optionally notify users
 */
exports.updateAppConfig = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || !value) {
            return res.status(400).json({ success: false, message: 'key and value are required' });
        }

        // 1. Fetch current config to compare version codes
        const currentConfig = await appConfigRepo.getConfig(key);
        
        // 2. Perform Update
        const updated = await appConfigRepo.updateConfig(key, value);

        // 3. Logic for FCM Notifications
        // If this is a version update and the version_code has increased, we notify users
        if (key.includes('latest_version')) {
            const currentVersionCode = currentConfig?.version_code || 0;
            const newVersionCode = value.version_code || 0;

            if (newVersionCode > currentVersionCode) {
                const platform = key.startsWith('android') ? 'android' : 'ios';
                const topic = `${platform}_app_update`;
                
                console.log(`[AdminConfigController] New version detected for ${platform}. Triggering FCM broadcast to topic: ${topic}`);
                
                await notificationService.sendToTopic(
                    topic,
                    '🚀 App Update Available!',
                    value.update_message || `New version ${value.version_name} is now available on the ${platform === 'android' ? 'Play Store' : 'App Store'}. Update now for the best experience!`,
                    { 
                        type: 'app_update', 
                        version_name: value.version_name,
                        is_mandatory: String(value.is_mandatory)
                    }
                );
            }
        }

        res.json({ 
            success: true, 
            message: 'App configuration updated successfully',
            config: updated
        });

    } catch (error) {
        console.error('[AdminConfigController] Error updating config:', error);
        res.status(500).json({ success: false, message: 'Server error updating app configuration' });
    }
};
