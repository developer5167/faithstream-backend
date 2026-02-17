const { log } = require('../repositories/adminAction.repo');
const artistService = require('../services/artist.service');

exports.requestArtist = async (req, res) => {
  await artistService.requestArtist(req.user.id, req.body);
  res.json({ message: 'Artist request submitted' });
};

exports.getArtistStatus = async (req, res) => {
  const status = await artistService.getArtistStatus(req.user.id);
  res.json(status);
};

exports.getArtistRequests = async (req, res) => {
  const requests = await artistService.getArtistRequests();
  res.json(requests);
};

exports.approveArtist = async (req, res) => {
  console.log(req.user.id, 'APPROVE_ARTIST', `Approved artist ID ${req.body.artistId}`);
  await artistService.approveArtist(req.body.artistId, req.user.id);
  res.json({ message: 'Artist approved' });
};

exports.rejectArtist = async (req, res) => {
  await artistService.rejectArtist(req.body.artistId, req.body.reason);
  res.json({ message: 'Artist rejected' });
};

exports.getVerifiedArtists = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const artists = await artistService.getVerifiedArtists({ search, page: parseInt(page), limit: parseInt(limit) });
  res.json(artists);
};

exports.getVerifiedArtistById = async (req, res) => {
  const artist = await artistService.getVerifiedArtistById(req.params.artistId);
  res.json(artist);
};

exports.getSupportingLinks = async (req, res) => {
  const links = await artistService.getSupportingLinks(req.params.artistId);
  res.json({ supporting_links: links });
};

exports.getSupportingLinksByUserId = async (req, res) => {
  const links = await artistService.getSupportingLinksByUserId(req.params.userId);
  res.json({ supporting_links: links });
};

exports.getArtistSongs = async (req, res) => {
  const songs = await require('../services/song.service').getArtistPublicSongs(req.params.artistId);
  res.json(songs);
};

exports.getArtistAlbums = async (req, res) => {
  const albums = await require('../services/album.service').getArtistPublicAlbums(req.params.artistId);
  res.json(albums);
};
