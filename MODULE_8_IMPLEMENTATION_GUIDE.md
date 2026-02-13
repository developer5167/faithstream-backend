# Module 8: Support & Complaints - Implementation Guide

## 🎯 Overview

Module 8 provides users with support channels and complaint mechanisms. This keeps the app safe and gives users a voice.

---

## ✅ What's Already in Your Backend

### Complaints System
- Users can report songs (copyright, inappropriate content, etc.)
- Song is immediately taken down when reported (safety first)
- Admin can review and restore or permanently remove

### Disputes System  
- Admin-only feature for handling copyright disputes
- Compare two similar songs and choose winner

---

## 🆕 Features to Add (Simple & Effective)

### For Users:
1. ✅ **File Complaint** - Report problematic content
2. ✅ **My Complaints** - View complaint history and status
3. 🆕 **Help Center/FAQ** - Self-service support
4. 🆕 **Contact Support** - Direct message to support team
5. 🆕 **Rate the App** - Encourage positive feedback

### For Admins:
1. ✅ **View All Complaints** - Already implemented
2. ✅ **Resolve Complaints** - Already implemented

---

## 📝 Backend Additions Needed

### 1. Get User's Own Complaints

Add this endpoint so users can see their complaint history:

**File**: `src/controllers/complaint.controller.js`

```javascript
exports.getMyComplaints = async (req, res) => {
  const complaints = await complaintService.getByUser(req.user.id);
  res.json(complaints);
};
```

**File**: `src/services/complaint.service.js`

```javascript
exports.getByUser = async (userId) => {
  return complaintRepo.findByUser(userId);
};
```

**File**: `src/repositories/complaint.repo.js`

```javascript
exports.findByUser = async (userId) => {
  const res = await db.query(
    `SELECT 
      c.id,
      c.reason,
      c.status,
      c.created_at,
      s.id AS song_id,
      s.title AS song_title,
      u.name AS artist_name
     FROM complaints c
     JOIN songs s ON s.id = c.song_id
     JOIN users u ON u.id = s.artist_user_id
     WHERE c.reported_by = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return res.rows;
};
```

**File**: `src/routes/complaint.routes.js`

```javascript
// Add this route
router.get('/my', auth, controller.getMyComplaints);
```

---

### 2. Support Tickets System (Optional but Recommended)

Create a simple support ticket system for general help requests.

**Migration**: `migrations/002_create_support_tickets.sql`

```sql
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'ACCOUNT', 'PAYMENT', 'TECHNICAL', 'OTHER'
  status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  admin_reply TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
```

**Repository**: `src/repositories/supportTicket.repo.js`

```javascript
const db = require('../config/db');

exports.create = async (userId, subject, message, category) => {
  const res = await db.query(
    `INSERT INTO support_tickets (user_id, subject, message, category)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, subject, message, category]
  );
  return res.rows[0];
};

exports.findByUser = async (userId) => {
  const res = await db.query(
    `SELECT id, subject, message, category, status, admin_reply, created_at
     FROM support_tickets
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

exports.findOpen = async () => {
  const res = await db.query(
    `SELECT t.*, u.name AS user_name, u.email AS user_email
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     WHERE t.status IN ('OPEN', 'IN_PROGRESS')
     ORDER BY t.created_at ASC`
  );
  return res.rows;
};

exports.reply = async (ticketId, adminReply, status) => {
  await db.query(
    `UPDATE support_tickets 
     SET admin_reply = $2, status = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [ticketId, adminReply, status]
  );
};
```

**Service**: `src/services/supportTicket.service.js`

```javascript
const supportTicketRepo = require('../repositories/supportTicket.repo');

exports.create = async (userId, subject, message, category) => {
  return supportTicketRepo.create(userId, subject, message, category);
};

exports.getByUser = async (userId) => {
  return supportTicketRepo.findByUser(userId);
};

exports.getOpenTickets = async () => {
  return supportTicketRepo.findOpen();
};

exports.reply = async (ticketId, adminReply, status = 'RESOLVED') => {
  await supportTicketRepo.reply(ticketId, adminReply, status);
};
```

**Controller**: `src/controllers/supportTicket.controller.js`

```javascript
const supportTicketService = require('../services/supportTicket.service');

exports.createTicket = async (req, res) => {
  const ticket = await supportTicketService.create(
    req.user.id,
    req.body.subject,
    req.body.message,
    req.body.category
  );
  res.json({ message: 'Support ticket created', ticket });
};

exports.getMyTickets = async (req, res) => {
  const tickets = await supportTicketService.getByUser(req.user.id);
  res.json(tickets);
};

// Admin endpoints
exports.getOpenTickets = async (req, res) => {
  const tickets = await supportTicketService.getOpenTickets();
  res.json(tickets);
};

exports.replyToTicket = async (req, res) => {
  await supportTicketService.reply(
    req.body.ticket_id,
    req.body.admin_reply,
    req.body.status
  );
  res.json({ message: 'Reply sent' });
};
```

**Routes**: `src/routes/supportTicket.routes.js`

```javascript
const router = require('express').Router();
const controller = require('../controllers/supportTicket.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

// User endpoints
router.post('/', auth, controller.createTicket);
router.get('/my', auth, controller.getMyTickets);

// Admin endpoints
router.get('/admin', auth, admin, controller.getOpenTickets);
router.post('/admin/reply', auth, admin, controller.replyToTicket);

module.exports = router;
```

**Add route to app.js**:

```javascript
app.use('/support', require('./routes/supportTicket.routes'));
```

---

## 📱 Flutter Screens for Module 8

### Screen 1: Support Hub (Main Screen)

```
┌─────────────────────────────────┐
│ [← Back]  Help & Support        │
├─────────────────────────────────┤
│ How can we help you?            │
├─────────────────────────────────┤
│ 📢 Report a Problem             │
│ Report songs or issues          │
│                                 │
│ 📝 My Complaints                │
│ View your reported issues       │
│                                 │
│ 💬 Contact Support              │
│ Get help from our team          │
│                                 │
│ 🎫 My Tickets                   │
│ View support conversations      │
│                                 │
│ ❓ Help Center                  │
│ FAQs and guides                 │
│                                 │
│ ⭐ Rate FaithStream             │
│ Share your feedback             │
└─────────────────────────────────┘
```

**Simple navigation hub - no complexity**

---

### Screen 2: File Complaint Screen

```
┌─────────────────────────────────┐
│ [← Back]  Report a Problem      │
├─────────────────────────────────┤
│ What's the issue?               │
│                                 │
│ ○ Copyright Infringement        │
│   This song copies my work      │
│                                 │
│ ○ Inappropriate Content         │
│   Offensive or explicit content │
│                                 │
│ ○ Wrong Information             │
│   Incorrect song/artist details │
│                                 │
│ ○ Technical Issue               │
│   Song won't play or errors     │
│                                 │
│ ○ Other                         │
│   Something else                │
├─────────────────────────────────┤
│ Which song? (tap to search)     │
│ [🔍 Search for song...]         │
│                                 │
│ Selected: Amazing Grace         │
│ by John Smith                   │
├─────────────────────────────────┤
│ Tell us more                    │
│ [________________________]      │
│ [________________________]      │
│ Min 20 characters               │
│                                 │
│ [Submit Report]                 │
└─────────────────────────────────┘
```

**API**: `POST /complaints/`

**Request**:
```json
{
  "song_id": 123,
  "reason": "This song is a copy of my original work uploaded last year..."
}
```

**Response**:
```json
{
  "message": "Complaint submitted"
}
```

---

### Screen 3: My Complaints

```
┌─────────────────────────────────┐
│ [← Back]  My Complaints         │
├─────────────────────────────────┤
│ 🟡 Amazing Grace                │
│    by John Smith                │
│    Copyright Infringement       │
│    Status: Under Review         │
│    Jan 15, 2026                 │
├─────────────────────────────────┤
│ ✅ Blessed Assurance            │
│    by Mary Johnson              │
│    Inappropriate Content        │
│    Status: Resolved - Removed   │
│    Jan 10, 2026                 │
├─────────────────────────────────┤
│ ✅ How Great Thou Art           │
│    by David Wilson              │
│    Wrong Information            │
│    Status: Resolved - Restored  │
│    Jan 5, 2026                  │
└─────────────────────────────────┘
```

**API**: `GET /complaints/my`

**Response**:
```json
[
  {
    "id": 1,
    "reason": "Copyright Infringement",
    "status": "OPEN",
    "created_at": "2026-01-15T10:00:00.000Z",
    "song_id": 123,
    "song_title": "Amazing Grace",
    "artist_name": "John Smith"
  },
  {
    "id": 2,
    "reason": "Inappropriate Content",
    "status": "RESOLVED",
    "created_at": "2026-01-10T15:30:00.000Z",
    "song_id": 456,
    "song_title": "Blessed Assurance",
    "artist_name": "Mary Johnson"
  }
]
```

**Status Badges**:
- 🟡 **OPEN** - Under review
- ✅ **RESOLVED** - Action taken

---

### Screen 4: Contact Support

```
┌─────────────────────────────────┐
│ [← Back]  Contact Support       │
├─────────────────────────────────┤
│ What do you need help with?     │
│                                 │
│ Category                        │
│ [▼ Select category]             │
│    • Account Issues             │
│    • Payment Problems           │
│    • Technical Issues           │
│    • General Question           │
│    • Feedback                   │
│                                 │
│ Subject *                       │
│ [________________]              │
│                                 │
│ Message *                       │
│ [________________________]      │
│ [________________________]      │
│ [________________________]      │
│ [________________________]      │
│                                 │
│ [Submit Ticket]                 │
│                                 │
│ Response time: 24-48 hours      │
└─────────────────────────────────┘
```

**API**: `POST /support/`

**Request**:
```json
{
  "subject": "Cannot download songs",
  "message": "I have premium subscription but download button is not working...",
  "category": "TECHNICAL"
}
```

**Response**:
```json
{
  "message": "Support ticket created",
  "ticket": {
    "id": 42,
    "subject": "Cannot download songs",
    "status": "OPEN",
    "created_at": "2026-02-06T10:00:00.000Z"
  }
}
```

---

### Screen 5: My Support Tickets

```
┌─────────────────────────────────┐
│ [← Back]  My Tickets            │
├─────────────────────────────────┤
│ 🟢 Cannot download songs        │
│    Technical • Resolved         │
│    Feb 6, 2026                  │
│    ↳ Admin: Try clearing cache  │
├─────────────────────────────────┤
│ 🟡 Payment not reflected        │
│    Payment • Open               │
│    Feb 5, 2026                  │
│    ↳ Awaiting response...       │
├─────────────────────────────────┤
│ 🔵 Feature request              │
│    General • In Progress        │
│    Feb 1, 2026                  │
│    ↳ Admin: Under consideration │
└─────────────────────────────────┘
```

**API**: `GET /support/my`

**Response**:
```json
[
  {
    "id": 42,
    "subject": "Cannot download songs",
    "message": "I have premium subscription but...",
    "category": "TECHNICAL",
    "status": "RESOLVED",
    "admin_reply": "Try clearing your app cache: Settings > Storage > Clear Cache",
    "created_at": "2026-02-06T10:00:00.000Z"
  },
  {
    "id": 41,
    "subject": "Payment not reflected",
    "message": "I paid yesterday but still showing as free...",
    "category": "PAYMENT",
    "status": "OPEN",
    "admin_reply": null,
    "created_at": "2026-02-05T15:30:00.000Z"
  }
]
```

**Status Colors**:
- 🟡 **OPEN** - Awaiting response
- 🔵 **IN_PROGRESS** - Being worked on
- 🟢 **RESOLVED** - Answer provided
- ⚫ **CLOSED** - Complete

---

### Screen 6: Help Center / FAQ (Static Content)

```
┌─────────────────────────────────┐
│ [← Back]  Help Center           │
│ [🔍 Search FAQs...]             │
├─────────────────────────────────┤
│ 📱 Getting Started              │
│ > How to create an account      │
│ > How to subscribe              │
│ > How to search for songs       │
├─────────────────────────────────┤
│ 💰 Subscription & Payment       │
│ > How much does it cost?        │
│ > How to cancel subscription    │
│ > Refund policy                 │
├─────────────────────────────────┤
│ 🎵 Playing Music                │
│ > How to download songs         │
│ > How to create playlists       │
│ > Offline playback              │
├─────────────────────────────────┤
│ 🎤 For Artists                  │
│ > How to become an artist       │
│ > How to upload songs           │
│ > Artist payment system         │
├─────────────────────────────────┤
│ ⚠️ Report Issues                │
│ > How to report a song          │
│ > Copyright guidelines          │
│ > Content policy                │
├─────────────────────────────────┤
│ Still need help?                │
│ [Contact Support]               │
└─────────────────────────────────┘
```

**Implementation**: Static content stored locally in the app (no API needed)

**Optional**: You can create a simple CMS endpoint later if you want to update FAQs remotely:
- `GET /help/faqs` - Returns JSON with categories and questions

---

### Screen 7: Rate the App (Simple)

```
┌─────────────────────────────────┐
│            [× Close]            │
├─────────────────────────────────┤
│                                 │
│    Enjoying FaithStream? 🎵     │
│                                 │
│    Help us by rating the app!   │
│                                 │
│    ⭐ ⭐ ⭐ ⭐ ⭐               │
│                                 │
│    [Rate on App Store]          │
│    [Rate on Play Store]         │
│                                 │
│    [Maybe Later]                │
│                                 │
└─────────────────────────────────┘
```

**Implementation**: Use Flutter packages:
- `rate_my_app` - Prompts users to rate
- `url_launcher` - Opens app store pages

**Trigger**: Show after:
- User has listened to 10+ songs
- User has been active for 3+ days
- Not shown more than once per month

---

## 🎨 Additional Simple Features (Optional)

### 1. Quick Feedback Button

Add a floating action button on profile screen:

```
┌─────────────────────────────────┐
│ Profile Screen                  │
│                                 │
│                              💬 │ ← Quick feedback button
└─────────────────────────────────┘
```

Tapping opens a simple dialog:
```
How's your experience?

😃 Great    😐 Okay    😞 Poor

[Optional: Add comment]

[Send Feedback]
```

Store locally or send to simple endpoint: `POST /feedback`

---

### 2. In-App Announcements

Show important updates at top of home screen (dismissible):

```
┌─────────────────────────────────┐
│ 📢 New feature: Offline Mode!  │
│    Download your favorite songs [×]│
└─────────────────────────────────┘
```

**Optional API**: `GET /announcements/active`

---

### 3. Report User (Not just songs)

Allow reporting inappropriate user profiles:

**API**: `POST /users/report`

```json
{
  "user_id": 123,
  "reason": "Spam profile"
}
```

---

## 📊 Admin Panel Updates (Module 9 Preview)

Add these sections to admin dashboard:

### Complaints Tab
```
┌─────────────────────────────────┐
│ Open Complaints (15)            │
├─────────────────────────────────┤
│ 🔴 Amazing Grace                │
│    by John Smith                │
│    Reporter: Jane Doe           │
│    Reason: Copyright            │
│    Date: Feb 6, 2026            │
│    [View Details] [Resolve]     │
└─────────────────────────────────┘
```

### Support Tickets Tab
```
┌─────────────────────────────────┐
│ Open Tickets (8)                │
├─────────────────────────────────┤
│ Cannot download songs           │
│    User: Jane Doe               │
│    Category: Technical          │
│    Created: Feb 6, 2026         │
│    [Reply] [Resolve]            │
└─────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Backend Tasks:
- [ ] Add `GET /complaints/my` endpoint
- [ ] Run migration for support_tickets table
- [ ] Create support ticket routes/controllers/services
- [ ] Test all endpoints

### Flutter Tasks:
- [ ] Create Support Hub screen
- [ ] Implement File Complaint screen with song search
- [ ] Create My Complaints list view
- [ ] Create Contact Support form
- [ ] Create My Tickets list view
- [ ] Build Help Center with FAQ sections
- [ ] Add Rate App prompt logic
- [ ] Add navigation from Profile to Support Hub

### Nice-to-Have:
- [ ] Push notifications for complaint/ticket updates
- [ ] Email notifications
- [ ] Image upload for complaints (proof)
- [ ] Chat-style support interface

---

## 🎯 Keep It Simple!

**Don't add**:
- ❌ Real-time chat (too complex)
- ❌ Video calls with support
- ❌ Community forums (separate app better)
- ❌ AI chatbots (overkill for MVP)

**Keep it focused**:
- ✅ Simple forms
- ✅ Clear status updates  
- ✅ Easy navigation
- ✅ Quick responses from admin panel

---

## 📚 API Summary for Module 8

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/complaints/` | User | File a complaint |
| GET | `/complaints/my` | User | Get my complaints |
| GET | `/complaints/admin` | Admin | Get all complaints |
| POST | `/complaints/admin/resolve` | Admin | Resolve complaint |
| POST | `/support/` | User | Create support ticket |
| GET | `/support/my` | User | Get my tickets |
| GET | `/support/admin` | Admin | Get open tickets |
| POST | `/support/admin/reply` | Admin | Reply to ticket |

---

## 🚀 Next Steps

1. **Implement backend endpoints** (1-2 days)
2. **Build Flutter screens** (3-4 days)
3. **Test user flows** (1 day)
4. **Add to admin panel** (2 days)

**Total time**: ~1 week

This keeps Module 8 clean, useful, and not overcomplicated! 🎵
