# Module 8: Support & Complaints API Documentation

## 📢 Complaints API

### 1. File a Complaint
Report a song for copyright, inappropriate content, or other issues.

**Endpoint**: `POST /complaints/`  
**Auth**: Required (User)

**Request**:
```json
{
  "song_id": 123,
  "reason": "This song is a copy of my original work. I uploaded the original version last year."
}
```

**Response**:
```json
{
  "message": "Complaint submitted"
}
```

**Notes**:
- Song is immediately taken down upon complaint (status changed to 'TAKEN_DOWN')
- Admin will review and either restore or permanently remove the song
- Reason should be at least 20 characters

---

### 2. Get My Complaints
View all complaints filed by the logged-in user.

**Endpoint**: `GET /complaints/my`  
**Auth**: Required (User)

**Response**:
```json
[
  {
    "id": 1,
    "reason": "Copyright Infringement - This song copies my work...",
    "status": "OPEN",
    "created_at": "2026-02-06T10:00:00.000Z",
    "song_id": 123,
    "song_title": "Amazing Grace",
    "artist_name": "John Smith"
  },
  {
    "id": 2,
    "reason": "Inappropriate Content - Contains offensive lyrics...",
    "status": "RESOLVED",
    "created_at": "2026-02-05T15:30:00.000Z",
    "song_id": 456,
    "song_title": "Blessed Assurance",
    "artist_name": "Mary Johnson"
  }
]
```

**Status Values**:
- `OPEN` - Under review by admin
- `RESOLVED` - Admin has taken action

**Notes**:
- Returns complaints in reverse chronological order (newest first)
- Shows both open and resolved complaints

---

### 3. Get All Complaints (Admin Only)
View all open complaints for admin review.

**Endpoint**: `GET /complaints/admin`  
**Auth**: Required (Admin)

**Response**:
```json
[
  {
    "id": 1,
    "song_id": 123,
    "reported_by": 45,
    "reason": "Copyright Infringement...",
    "status": "OPEN",
    "created_at": "2026-02-06T10:00:00.000Z",
    "song_title": "Amazing Grace",
    "reporter": "Jane Doe"
  }
]
```

---

### 4. Resolve Complaint (Admin Only)
Take action on a complaint - restore or remove the song.

**Endpoint**: `POST /complaints/admin/resolve`  
**Auth**: Required (Admin)

**Request**:
```json
{
  "complaint_id": 1,
  "action": "RESTORE"
}
```

**Action Values**:
- `RESTORE` - Song was falsely reported, restore to APPROVED
- `REMOVE` - Complaint valid, permanently remove song (REJECTED)

**Response**:
```json
{
  "message": "Complaint resolved"
}
```

---

## 💬 Support Tickets API

### 1. Create Support Ticket
Submit a support request or inquiry.

**Endpoint**: `POST /support/`  
**Auth**: Required (User)

**Request**:
```json
{
  "subject": "Cannot download songs",
  "message": "I have a premium subscription but the download button is not working. I've tried restarting the app but still having issues.",
  "category": "TECHNICAL"
}
```

**Category Values**:
- `ACCOUNT` - Account-related issues
- `PAYMENT` - Payment and subscription problems
- `TECHNICAL` - Technical/app issues
- `OTHER` - General inquiries

**Response**:
```json
{
  "message": "Support ticket created",
  "ticket": {
    "id": 42,
    "subject": "Cannot download songs",
    "message": "I have a premium subscription...",
    "category": "TECHNICAL",
    "status": "OPEN",
    "admin_reply": null,
    "created_at": "2026-02-06T10:00:00.000Z",
    "updated_at": "2026-02-06T10:00:00.000Z"
  }
}
```

**Validation**:
- Subject: Required, 5-200 characters
- Message: Required, minimum 20 characters
- Category: Required, must be one of the allowed values

---

### 2. Get My Support Tickets
View all support tickets created by the logged-in user.

**Endpoint**: `GET /support/my`  
**Auth**: Required (User)

**Response**:
```json
[
  {
    "id": 42,
    "subject": "Cannot download songs",
    "message": "I have a premium subscription but...",
    "category": "TECHNICAL",
    "status": "RESOLVED",
    "admin_reply": "Try clearing your app cache: Settings > Storage > Clear Cache. If issue persists, please reinstall the app.",
    "created_at": "2026-02-06T10:00:00.000Z",
    "updated_at": "2026-02-06T14:30:00.000Z"
  },
  {
    "id": 41,
    "subject": "Payment not reflected",
    "message": "I paid yesterday but still showing as free user...",
    "category": "PAYMENT",
    "status": "IN_PROGRESS",
    "admin_reply": "We're checking with our payment provider. Will update you within 24 hours.",
    "created_at": "2026-02-05T15:30:00.000Z",
    "updated_at": "2026-02-06T09:00:00.000Z"
  },
  {
    "id": 40,
    "subject": "Feature request",
    "message": "Can you add a sleep timer feature?",
    "category": "OTHER",
    "status": "OPEN",
    "admin_reply": null,
    "created_at": "2026-02-01T12:00:00.000Z",
    "updated_at": "2026-02-01T12:00:00.000Z"
  }
]
```

**Status Values**:
- `OPEN` - Awaiting admin response
- `IN_PROGRESS` - Admin is working on it
- `RESOLVED` - Admin has provided solution
- `CLOSED` - Ticket closed (user satisfied or timeout)

**Notes**:
- Returns tickets in reverse chronological order (newest first)
- Includes admin replies if available

---

### 3. Get Open Support Tickets (Admin Only)
View all tickets that need admin attention.

**Endpoint**: `GET /support/admin`  
**Auth**: Required (Admin)

**Response**:
```json
[
  {
    "id": 42,
    "user_id": 123,
    "subject": "Cannot download songs",
    "message": "I have a premium subscription but...",
    "category": "TECHNICAL",
    "status": "OPEN",
    "admin_reply": null,
    "created_at": "2026-02-06T10:00:00.000Z",
    "updated_at": "2026-02-06T10:00:00.000Z",
    "user_name": "John Doe",
    "user_email": "john@example.com"
  }
]
```

**Notes**:
- Returns only OPEN and IN_PROGRESS tickets
- Ordered by creation date (oldest first - FIFO)
- Includes user contact information for follow-up

---

### 4. Reply to Support Ticket (Admin Only)
Respond to a user's support ticket.

**Endpoint**: `POST /support/admin/reply`  
**Auth**: Required (Admin)

**Request**:
```json
{
  "ticket_id": 42,
  "admin_reply": "Try clearing your app cache: Settings > Storage > Clear Cache. If the issue persists after cache clear, please reinstall the app.",
  "status": "RESOLVED"
}
```

**Status Values** (when replying):
- `IN_PROGRESS` - Working on it, need more time
- `RESOLVED` - Solution provided, ticket resolved
- `CLOSED` - No longer relevant, closing

**Response**:
```json
{
  "message": "Reply sent"
}
```

**Notes**:
- Admin reply is visible to the user in their ticket list
- Status is updated to inform user of progress
- Good practice: Be clear and helpful in replies

---

## 🔄 API Flow Examples

### User Reports a Song

```
1. User finds problematic song
2. POST /complaints/ 
   { song_id: 123, reason: "Copyright violation..." }
3. Song immediately taken down (TAKEN_DOWN status)
4. Admin reviews: GET /complaints/admin
5. Admin decides: POST /complaints/admin/resolve
   { complaint_id: 1, action: "REMOVE" }
6. Song status → REJECTED (permanently removed)
```

---

### User Gets Support

```
1. User has an issue
2. POST /support/
   { subject: "Cannot download", message: "...", category: "TECHNICAL" }
3. Ticket created with status OPEN
4. Admin sees it: GET /support/admin
5. Admin replies: POST /support/admin/reply
   { ticket_id: 42, admin_reply: "Try clearing cache...", status: "RESOLVED" }
6. User checks: GET /support/my
7. User sees admin's solution
```

---

## 🚀 Quick Setup Guide

### Step 1: Run Migration
```bash
node scripts/migrate-support-tickets.js
```

### Step 2: Test Complaints Endpoints

**Test filing a complaint**:
```bash
curl -X POST http://localhost:3000/complaints/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "song_id": 123,
    "reason": "This is a test complaint about copyright"
  }'
```

**Test getting my complaints**:
```bash
curl -X GET http://localhost:3000/complaints/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 3: Test Support Ticket Endpoints

**Test creating a ticket**:
```bash
curl -X POST http://localhost:3000/support/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test support request",
    "message": "This is a test message asking for help with downloads",
    "category": "TECHNICAL"
  }'
```

**Test getting my tickets**:
```bash
curl -X GET http://localhost:3000/support/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 Flutter Integration Tips

### Complaint Status Badge Colors
```dart
Color getComplaintStatusColor(String status) {
  switch (status) {
    case 'OPEN':
      return Colors.orange;
    case 'RESOLVED':
      return Colors.green;
    default:
      return Colors.grey;
  }
}
```

### Support Ticket Status Badge Colors
```dart
Color getTicketStatusColor(String status) {
  switch (status) {
    case 'OPEN':
      return Colors.orange;
    case 'IN_PROGRESS':
      return Colors.blue;
    case 'RESOLVED':
      return Colors.green;
    case 'CLOSED':
      return Colors.grey;
    default:
      return Colors.grey;
  }
}
```

### Category Icons
```dart
IconData getCategoryIcon(String category) {
  switch (category) {
    case 'ACCOUNT':
      return Icons.person;
    case 'PAYMENT':
      return Icons.payment;
    case 'TECHNICAL':
      return Icons.bug_report;
    case 'OTHER':
      return Icons.help;
    default:
      return Icons.support;
  }
}
```

---

## ✅ Testing Checklist

- [ ] User can file a complaint
- [ ] User can view their complaints
- [ ] Admin can view all complaints
- [ ] Admin can resolve complaints (restore/remove)
- [ ] User can create support ticket
- [ ] User can view their support tickets
- [ ] Admin can view open tickets
- [ ] Admin can reply to tickets
- [ ] Status updates correctly
- [ ] Timestamps are accurate
- [ ] Error handling works

---

## 🎯 Module 8 Complete!

You now have:
- ✅ Full complaints system
- ✅ Support ticket system
- ✅ User and admin endpoints
- ✅ Ready for Flutter integration

**Estimated Implementation Time**: 5-7 days for complete Module 8 (backend + Flutter)
