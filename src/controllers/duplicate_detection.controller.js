const duplicateDetectionService = require('../services/duplicate_detection.service');

exports.getPotentialDuplicates = async (req, res) => {
    try {
        const duplicates = await duplicateDetectionService.getPotentialDuplicates();
        res.json(duplicates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.mergeSongs = async (req, res) => {
    try {
        const { master_id, duplicate_id } = req.body;
        if (!master_id || !duplicate_id) {
            return res.status(400).json({ error: 'master_id and duplicate_id are required' });
        }

        const result = await duplicateDetectionService.mergeSongs(master_id, duplicate_id, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
