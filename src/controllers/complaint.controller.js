const complaintService = require('../services/complaint.service');

exports.createComplaint = async (req, res) => {
  await complaintService.create(
    req.body.title,
    req.body.description,
    req.body.content_id,
    req.body.content_type,
    req.user.id
  );
  res.json({ message: 'Complaint submitted' });
};

exports.getMyComplaints = async (req, res) => {
  const complaints = await complaintService.getByUser(req.user.id);
  res.json(complaints);
};

exports.getComplaints = async (req, res) => {
  res.json(await complaintService.getOpenComplaints());
};

exports.resolveComplaint = async (req, res) => {
  await complaintService.resolve(
    req.body.complaint_id,
    req.body.action
  );
  res.json({ message: 'Complaint resolved' });
};
