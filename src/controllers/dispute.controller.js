const disputeService = require('../services/dispute.service');

exports.getDisputes = async (req, res) => {
  res.json(await disputeService.getOpenDisputes());
};

exports.resolveDispute = async (req, res) => {
  await disputeService.resolve(
    req.body.dispute_id,
    req.body.winner_song_id
  );
  res.json({ message: 'Dispute resolved' });
};
