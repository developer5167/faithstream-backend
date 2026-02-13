# FaithStream Flutter App - Complete Planning Document

## 📱 App Overview

**Platform**: Flutter (iOS & Android)  
**App Type**: Music Streaming Platform (Gospel/Christian Music)  
**Target Users**: Listeners, Artists, Admins

---

## 🎯 User Roles

1. **Regular User/Listener** - Browse and stream music (requires subscription)
2. **Artist** - Upload and manage songs/albums (can also listen)
3. **Admin** - Manage content, approve songs/albums, handle complaints

---

## 📂 App Architecture & Modules

### Module 1: Authentication & Onboarding
- Splash Screen
- Onboarding/Welcome Screen
- Login Screen
- Register Screen
- Forgot Password Screen (future)

### Module 2: Home & Discovery
- Home Feed Screen
- Search Screen
- Browse Categories

### Module 3: Music Player
- Now Playing Screen (Full Player)
- Mini Player (Bottom Bar)
- Queue Management

### Module 4: Library & Collections
- My Library Screen
- Recently Played
- Favorites/Liked Songs
- Downloaded Songs (offline)

### Module 5: Artist Features
- Become Artist Screen
- Artist Dashboard
- Upload Song Screen
- Upload Album Screen
- Manage Songs/Albums
- Artist Analytics

### Module 6: Subscription
- Subscription Plans Screen
- Payment Screen
- Subscription Status

### Module 7: Profile & Settings
- Profile Screen
- Edit Profile
- Settings Screen
- About/Help

### Module 8: Support & Complaints
- File Complaint Screen
- Complaint History
- Support/Help Center

### Module 9: Admin Panel (In-App)
- Admin Dashboard
- Pending Approvals (Songs/Albums)
- Artist Verification Requests
- Complaints Management
- Payouts Management
- Audit Logs

---

## 📱 Complete Screen Breakdown

### 🎬 **SPLASH SCREEN**

**Purpose**: App initialization and branding

**UI Elements**:
- App logo with animation
- App name "FaithStream"
- Tagline
- Loading indicator

**Actions**:
```
1. Check if user is logged in (token exists)
2. Validate token with /auth/me
3. If valid → Navigate to Home
4. If invalid → Navigate to Onboarding
5. Duration: 2-3 seconds
```

**API Calls**:
- `GET /auth/me` (if token exists)

---

### 🌟 **ONBOARDING/WELCOME SCREEN**

**Purpose**: First-time user experience

**UI Elements**:
- 3-4 swipeable pages explaining features
  - Page 1: "Discover Gospel Music"
  - Page 2: "Stream Unlimited Songs"
  - Page 3: "Support Christian Artists"
  - Page 4: "Create & Share Your Music"
- Skip button (top-right)
- Next/Get Started button
- Page indicators (dots)

**Actions**:
```
1. User swipes through pages
2. "Skip" → Navigate to Login
3. "Get Started" (last page) → Navigate to Login
```

**Navigation**: → Login Screen

---

### 🔐 **LOGIN SCREEN**

**Purpose**: User authentication

**UI Elements**:
- Email input field
- Password input field (with show/hide toggle)
- "Remember Me" checkbox
- Login button
- "Forgot Password?" link
- Divider with "OR"
- Social login buttons (Google, Apple) - optional
- "Don't have an account? Sign Up" link

**Actions**:
```
1. User enters email & password
2. Tap "Login" button
3. Validate inputs (email format, password not empty)
4. Call login API
5. If success:
   - Store token in secure storage
   - Navigate to Home Screen
6. If error:
   - Show error message (invalid credentials, account locked, etc.)
```

**API Calls**:
- `POST /auth/login`
  ```json
  Request: { "email": "user@example.com", "password": "***" }
  Response: { "token": "jwt_token", "user": {...} }
  ```

**Validation**:
- Email: Valid email format
- Password: Minimum 6 characters

**Navigation**: → Home Screen (on success)

---

### 📝 **REGISTER SCREEN**

**Purpose**: New user registration

**UI Elements**:
- Full Name input field
- Email input field
- Password input field (with strength indicator)
- Confirm Password input field
- Terms & Conditions checkbox
- Register button
- "Already have an account? Login" link

**Actions**:
```
1. User fills all fields
2. Validate inputs:
   - Name not empty
   - Valid email format
   - Password min 6 chars
   - Passwords match
   - T&C accepted
3. Call register API
4. If success:
   - Show success message
   - Auto-login or navigate to Login
5. If error:
   - Show error (email already exists, etc.)
```

**API Calls**:
- `POST /auth/register`
  ```json
  Request: { "name": "John Doe", "email": "john@example.com", "password": "***" }
  Response: { "token": "jwt_token", "user": {...} }
  ```

**Navigation**: → Home Screen (if auto-login) or → Login Screen

---

### 🏠 **HOME SCREEN (Main Feed)**

**Purpose**: Primary music discovery screen

**UI Layout**:
```
┌─────────────────────────────────┐
│ App Logo    [Search] [Profile]  │ ← Header
├─────────────────────────────────┤
│ 🎵 Recently Played              │
│ ┌───┐ ┌───┐ ┌───┐              │ ← Horizontal scroll
│ │ 🎵│ │ 🎵│ │ 🎵│              │
│ └───┘ └───┘ └───┘              │
├─────────────────────────────────┤
│ 🔥 Popular Songs                │
│ ┌───┐ ┌───┐ ┌───┐              │
│ │ 🎵│ │ 🎵│ │ 🎵│              │
│ └───┘ └───┘ └───┘              │
├─────────────────────────────────┤
│ 📀 New Releases                 │
│ ┌───────────────┐               │
│ │ Album Cover   │               │
│ │ Title         │               │
│ └───────────────┘               │
├─────────────────────────────────┤
│ 🎤 Featured Artists             │
│ ○ ○ ○ ○                        │ ← Artist avatars
└─────────────────────────────────┘
│ [Mini Player]                   │ ← Sticky bottom
└─────────────────────────────────┘
```

**UI Elements**:
- Top App Bar:
  - App logo/title
  - Search icon
  - Profile icon
- Vertical scrollable content:
  - **Recently Played** (horizontal list)
    - Shows last 10 songs user played
    - Shows if user has active subscription
  - **Popular Songs** (horizontal list)
    - Top 20 popular songs
    - Song card: Cover, Title, Artist
  - **New Releases** (horizontal list)
    - Latest approved albums/songs
  - **Featured Artists** (horizontal list)
    - Verified artists
- Bottom Navigation Bar:
  - Home (selected)
  - Search
  - Library
  - Profile

**Actions**:
```
1. Tap song card → Open Now Playing Screen
2. Tap artist → Open Artist Profile (future)
3. Tap search icon → Navigate to Search Screen
4. Pull to refresh → Reload home feed
5. Scroll to load more content
```

**API Calls**:
- `GET /home/` - Get home feed (popular songs, new releases)

**Data Display**:
- Song cards show: Cover image, Title, Artist name
- Albums show: Album cover, Title, Artist, Number of tracks
- Recently played shows timestamp or "X hours ago"

**States**:
- Loading state (shimmer effect)
- Empty state (if no content)
- Error state (retry button)

---

### 🔍 **SEARCH SCREEN**

**Purpose**: Search for songs, albums, artists

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  [Search Box]  [Clear] │
├─────────────────────────────────┤
│ 🔥 Trending Searches            │
│ #Gospel  #Worship  #Praise      │
├─────────────────────────────────┤
│ 📜 Recent Searches              │
│ Amazing Grace                   │
│ John Smith                      │
└─────────────────────────────────┘
```

**After Search**:
```
┌─────────────────────────────────┐
│ [← Back]  [gospel]      [x]     │
├─────────────────────────────────┤
│ [Songs] [Albums] [Artists]      │ ← Tabs
├─────────────────────────────────┤
│ 🎵 Amazing Grace                │
│    John Smith • Gospel          │
│                                 │
│ 🎵 Grace Like Rain              │
│    Mary Johnson • Worship       │
└─────────────────────────────────┘
```

**UI Elements**:
- Search input field (auto-focus)
- Clear button (when typing)
- Tab bar: Songs | Albums | Artists
- Search results list
- Recent searches (if no search)
- Trending searches/tags

**Actions**:
```
1. User types in search box
2. Debounced search (300ms delay)
3. Display results in tabs
4. Tap result → Open song/album/artist detail
5. Save search to recent searches
6. Tap recent search → Auto-fill and search
```

**API Calls**:
- `GET /home/` (can filter results on client-side)
- Or implement: `GET /search?q=gospel&type=song`

**Features**:
- Auto-suggest while typing
- Filter by: Song, Album, Artist, Genre
- Sort by: Relevance, Latest, Popular
- Empty state: "No results found"

---

### 🎵 **NOW PLAYING SCREEN (Full Player)**

**Purpose**: Full-screen music player

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  Song Title    [⋮]     │
├─────────────────────────────────┤
│                                 │
│         ┌───────────┐           │
│         │           │           │
│         │   Album   │           │
│         │   Cover   │           │
│         │  (Large)  │           │
│         │           │           │
│         └───────────┘           │
│                                 │
│    Song Title                   │
│    Artist Name                  │
│                                 │
│    ━━━━━●━━━━━━━━━━━━           │ ← Progress bar
│    1:23        -2:15            │
│                                 │
│    [🔀] [⏮] [⏸] [⏭] [🔁]      │ ← Controls
│                                 │
│    [❤]  [+]  [⬇]  [🔗]        │ ← Actions
│                                 │
└─────────────────────────────────┘
│ 🎵 Up Next: 5 songs             │ ← Queue preview
└─────────────────────────────────┘
```

**UI Elements**:
- Large album/song cover art
- Song title (large font)
- Artist name
- Progress bar with timestamps
- Playback controls:
  - Shuffle button
  - Previous button
  - Play/Pause button (large, center)
  - Next button
  - Repeat button
- Action buttons:
  - Like/Favorite heart icon
  - Add to playlist
  - Download for offline
  - Share
- Volume slider (optional)
- Queue/Up Next preview (bottom)
- More options menu (⋮):
  - View Album
  - View Artist
  - Add to Playlist
  - Share
  - Report Issue

**Actions**:
```
1. Play/Pause → Toggle playback
2. Next/Previous → Skip tracks
3. Seek → Drag progress bar
4. Like → Add to favorites
5. Download → Save for offline
6. Share → Share song link
7. Swipe down → Return to previous screen (mini player shows)
8. Tap "Up Next" → Open queue screen
```

**API Calls**:
- `GET /stream/:songId/url` - Get streaming URL
- `POST /stream/log` - Log stream play
  ```json
  { "song_id": 123, "duration": 180, "timestamp": "..." }
  ```

**Features**:
- Streaming with buffering indicator
- Lyrics display (if available) - swipe up
- Audio quality settings
- Background playback
- Lock screen controls
- Bluetooth/headphone controls

**States**:
- Loading (fetching stream URL)
- Playing
- Paused
- Buffering
- Error (subscription expired, network error)

---

### 🎹 **MINI PLAYER (Bottom Bar)**

**Purpose**: Persistent playback controls across screens

**UI Layout**:
```
┌─────────────────────────────────┐
│ 🎵 Song Title • Artist Name  ⏸ │
└─────────────────────────────────┘
```

**UI Elements**:
- Small song cover thumbnail (left)
- Song title + artist (truncated)
- Play/Pause button (right)
- Progress bar (thin line at bottom)

**Actions**:
```
1. Tap anywhere → Open full Now Playing screen
2. Tap play/pause → Toggle playback
3. Swipe right → Next track
4. Swipe left → Previous track
```

**Visibility**:
- Shows on all screens except Now Playing
- Hides on splash, login, register screens
- Sticky at bottom above navigation bar

---

### 📚 **LIBRARY SCREEN**

**Purpose**: User's personal music collection

**UI Layout**:
```
┌─────────────────────────────────┐
│ My Library                      │
├─────────────────────────────────┤
│ [Recently Played] [Favorites]   │ ← Tabs
├─────────────────────────────────┤
│ 🎵 Amazing Grace                │
│    John Smith • 3:45            │
│    2 hours ago                  │
│                                 │
│ 🎵 Blessed Assurance            │
│    Mary Johnson • 4:20          │
│    Yesterday                    │
│                                 │
│ 🎵 How Great Thou Art           │
│    David Wilson • 5:10          │
│    3 days ago                   │
└─────────────────────────────────┘
```

**UI Elements**:
- Tab bar:
  - Recently Played
  - Favorites
  - Downloaded (offline songs)
- List of songs with:
  - Cover thumbnail
  - Title
  - Artist
  - Duration
  - Last played / Added date
- Search within library
- Sort options (Recent, A-Z, Artist)
- Empty state: "Start exploring music"

**Actions**:
```
1. Tap song → Play immediately
2. Long press → Show context menu:
   - Play Next
   - Add to Queue
   - Add to Playlist
   - Remove from Favorites
   - Download
   - Share
3. Pull to refresh
```

**API Calls**:
- Recently Played: Local storage or `GET /library/recent`
- Favorites: `GET /library/favorites`
- Downloads: Local storage

**Features**:
- Offline playback for downloaded songs
- Sync across devices
- Auto-clear old history (30 days)

---

### 🎤 **BECOME ARTIST SCREEN**

**Purpose**: Allow users to request artist verification

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  Become an Artist      │
├─────────────────────────────────┤
│ 🎤 Share Your Music with the    │
│    World                        │
│                                 │
│ Why become an artist?           │
│ • Upload unlimited songs        │
│ • Reach millions of listeners   │
│ • Earn from your streams        │
│ • Get verified badge            │
├─────────────────────────────────┤
│ Artist Information              │
│                                 │
│ Artist Name *                   │
│ [________________]              │
│                                 │
│ Bio / Description               │
│ [________________]              │
│ [________________]              │
│                                 │
│ Government ID                   │
│ [Upload Image] 📷               │
│                                 │
│ Selfie Verification Video       │
│ [Record Video] 🎥               │
│ (10-15 seconds)                 │
│                                 │
│ [ ] I agree to Terms & Conditions│
│                                 │
│ [Submit Request]                │
└─────────────────────────────────┘
```

**UI Elements**:
- Artist name input
- Bio/description textarea
- Government ID upload button (photo)
- Selfie video upload button (video recorder)
- Terms & conditions checkbox
- Submit button

**Actions**:
```
1. User fills all fields
2. Uploads government ID image
3. Records selfie video (face verification)
4. Accepts terms
5. Submits request
6. API call to create artist profile request
7. Show confirmation: "Request submitted! We'll review within 48 hours"
8. Navigate back to profile
```

**API Calls**:
- `POST /artist/request`
  ```json
  Request: {
    "artist_name": "John Gospel",
    "bio": "Gospel singer from LA",
    "govt_id_url": "s3_url",
    "selfie_video_url": "s3_url"
  }
  Response: { "message": "Request submitted", "status": "REQUESTED" }
  ```

**Validation**:
- Artist name: Required, 3-50 chars
- Bio: Required, max 500 chars
- Gov ID: Required, image format
- Selfie video: Required, 10-15 seconds, video format

**File Upload**:
- Use S3 presigned URLs
- Show upload progress
- Handle errors (file too large, wrong format)

---

### 🎨 **ARTIST DASHBOARD**

**Purpose**: Artist content management hub

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  Artist Dashboard      │
├─────────────────────────────────┤
│ Overview                        │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │ 125 │ │ 45K │ │ $89 │        │
│ │Songs│ │Plays│ │ Rev │        │
│ └─────┘ └─────┘ └─────┘        │
├─────────────────────────────────┤
│ [+ Upload Song] [+ Create Album]│
├─────────────────────────────────┤
│ [My Songs] [My Albums]          │ ← Tabs
├─────────────────────────────────┤
│ 🎵 Amazing Grace        APPROVED│
│    Single • 3:45 • 1.2K plays  │
│                                 │
│ 🎵 Blessed Be           PENDING │
│    Single • 4:20 • Under review│
│                                 │
│ 📀 Worship Album Vol 1  DRAFT   │
│    Album • 8 songs • Not submitted│
└─────────────────────────────────┘
```

**UI Elements**:
- Stats cards:
  - Total songs
  - Total streams
  - Revenue earned (this month)
- Action buttons:
  - Upload Song
  - Create Album
- Tabs:
  - My Songs
  - My Albums
- List of content with:
  - Cover thumbnail
  - Title
  - Type (Single/Album)
  - Status badge (DRAFT, PENDING, APPROVED, REJECTED)
  - Plays count
  - Actions menu (Edit, Delete, Submit)

**Actions**:
```
1. Tap "Upload Song" → Navigate to Upload Song Screen
2. Tap "Create Album" → Navigate to Create Album Screen
3. Tap song/album → View details
4. Tap status badge → Show status explanation
5. For DRAFT items: Show "Submit for Review" button
6. For REJECTED items: Show rejection reason
```

**API Calls**:
- `GET /artist/status` - Check if verified
- `GET /songs/my` - Get artist's songs
- `GET /albums/my` - Get artist's albums

**Status Badges**:
- 🔵 **DRAFT** - Not yet submitted
- 🟡 **PENDING** - Under admin review
- 🟢 **APPROVED** - Live and streaming
- 🔴 **REJECTED** - Rejected with reason

---

### 📤 **UPLOAD SONG SCREEN**

**Purpose**: Artists upload new songs

**UI Layout**:
```
┌─────────────────────────────────┐
│ [× Cancel]  Upload Song  [Save] │
├─────────────────────────────────┤
│ Song Type                       │
│ ○ Standalone Single             │
│ ○ Add to Album                  │
├─────────────────────────────────┤
│ [Select Album] (if album type)  │
│ ▼ Worship Collection Vol 1      │
├─────────────────────────────────┤
│ Song Title *                    │
│ [________________]              │
│                                 │
│ Language *                      │
│ [▼ English]                     │
│                                 │
│ Genre *                         │
│ [▼ Gospel]                      │
│                                 │
│ Description                     │
│ [________________]              │
│                                 │
│ Lyrics                          │
│ [________________]              │
│ [________________]              │
│                                 │
│ Cover Image *                   │
│ (Required for singles)          │
│ [Upload Image] 📷               │
│ ┌─────────┐                    │
│ │ Preview │                    │
│ └─────────┘                    │
│                                 │
│ Audio File *                    │
│ [Upload Audio] 🎵               │
│ FileName.mp3 • 4.2 MB          │
│ [🔊 Preview]                   │
│                                 │
│ Track Number (if album)         │
│ [__]                           │
│                                 │
│ [Save as Draft] [Upload & Submit]│
└─────────────────────────────────┘
```

**UI Elements**:
- Radio buttons: Standalone Single / Add to Album
- Album dropdown (if adding to album)
  - Shows only DRAFT albums
- Form fields:
  - Title (required)
  - Language dropdown (required)
  - Genre dropdown (required)
  - Description (optional)
  - Lyrics textarea (optional)
  - Cover image upload (required for singles)
  - Audio file upload (required)
  - Track number (if album song)
- Image preview
- Audio preview player
- Two submit buttons:
  - "Save as Draft" - Saves but doesn't submit
  - "Upload & Submit" - Uploads and submits for review

**Actions**:
```
1. Select song type (single/album)
2. If album: Select from DRAFT albums only
3. Fill all required fields
4. Upload cover image:
   - Max 5MB
   - JPG/PNG format
   - Min 1000x1000px recommended
5. Upload audio file:
   - MP3/WAV/FLAC
   - Max 50MB
   - Show upload progress
6. Preview audio before uploading
7. Save as draft OR Submit for review
8. Show success message
9. Navigate back to Artist Dashboard
```

**API Calls**:
- `GET /albums/my` - Get artist's DRAFT albums
- `POST /songs/`
  ```json
  Request: {
    "title": "Amazing Grace",
    "language": "English",
    "genre": "Gospel",
    "lyrics": "...",
    "description": "...",
    "audio_original_url": "s3_url",
    "cover_image_url": "s3_url",
    "album_id": null,
    "track_number": null
  }
  ```

**Validation**:
- Title: Required, 1-200 chars
- Language: Required
- Genre: Required
- Cover image: Required if single, optional if album
- Audio: Required
- Track number: Required if adding to album

**Upload Process**:
```
1. Get presigned URL from backend
2. Upload to S3 with progress tracking
3. Get final S3 URL
4. Submit song data with S3 URLs
```

**Error Handling**:
- File too large
- Invalid format
- Upload failed
- Network error
- Album already submitted (can't add songs)

---

### 📀 **CREATE ALBUM SCREEN**

**Purpose**: Artists create album containers

**UI Layout**:
```
┌─────────────────────────────────┐
│ [× Cancel]  Create Album [Save] │
├─────────────────────────────────┤
│ Album Title *                   │
│ [________________]              │
│                                 │
│ Description                     │
│ [________________]              │
│                                 │
│ Language *                      │
│ [▼ English]                     │
│                                 │
│ Release Type *                  │
│ [▼ Album] ▼                     │
│    • Album                      │
│    • EP                         │
│    • Single                     │
│                                 │
│ Cover Image *                   │
│ [Upload Image] 📷               │
│ ┌─────────────┐                │
│ │   Preview   │                │
│ └─────────────┘                │
│                                 │
│ [Create Album]                  │
└─────────────────────────────────┘
```

**UI Elements**:
- Album title input
- Description textarea
- Language dropdown
- Release type dropdown
- Cover image upload
- Create button

**Actions**:
```
1. Fill album details
2. Upload cover image
3. Create album (saves as DRAFT)
4. Show success: "Album created! Now add songs"
5. Navigate to Upload Song screen with album pre-selected
   OR Navigate back to dashboard
```

**API Calls**:
- `POST /albums/`
  ```json
  Request: {
    "title": "Worship Collection",
    "description": "...",
    "language": "English",
    "release_type": "ALBUM",
    "cover_image_url": "s3_url"
  }
  ```

**Workflow**:
```
Create Album → Add Songs → Submit Album for Review
```

**Note**: Album is created in DRAFT status. Artist must add songs separately, then submit the complete album for review.

---

### 💳 **SUBSCRIPTION SCREEN**

**Purpose**: Display and manage subscription plans

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  Choose Your Plan      │
├─────────────────────────────────┤
│ Current Status: Free Trial      │
│ 3 days remaining                │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 💎 PREMIUM                  │ │
│ │ $9.99/month                 │ │
│ │                             │ │
│ │ ✓ Unlimited streaming       │ │
│ │ ✓ HD audio quality          │ │
│ │ ✓ Offline downloads         │ │
│ │ ✓ No ads                    │ │
│ │ ✓ Support artists           │ │
│ │                             │ │
│ │ [Subscribe Now]             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎯 YEARLY                   │ │
│ │ $99.99/year                 │ │
│ │ (Save $20!)                 │ │
│ │                             │ │
│ │ All Premium features        │ │
│ │ + 2 months free             │ │
│ │                             │ │
│ │ [Subscribe Now]             │ │
│ └─────────────────────────────┘ │
│                                 │
│ • Cancel anytime               │
│ • 7-day free trial             │
│ • Secure payment               │
└─────────────────────────────────┘
```

**UI Elements**:
- Current subscription status card
- Plan cards:
  - Plan name (Premium, Yearly)
  - Price
  - Features list with checkmarks
  - Subscribe button
  - Badge (Popular, Best Value)
- Footer notes
- Payment providers logos (Razorpay, Stripe)

**Actions**:
```
1. Tap "Subscribe Now"
2. Navigate to Payment Screen
3. After successful payment:
   - Update subscription status
   - Show success message
   - Navigate back to Home
4. If already subscribed:
   - Show "Current Plan" badge
   - Show "Manage Subscription" button
```

**API Calls**:
- `GET /subscriptions/status` - Get current status
- `POST /subscriptions/create` - Create subscription
  ```json
  Request: { "plan": "monthly" }
  Response: { "payment_url": "razorpay_url" }
  ```

**Subscription States**:
- Not subscribed (Free - limited features)
- Active subscription
- Trial period (7 days)
- Expired/Cancelled

**Features Gating**:
- Free users: Can browse but can't play (show "Subscribe to Play")
- Subscribed users: Full access

---

### 💰 **PAYMENT SCREEN**

**Purpose**: Handle payment processing

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  Complete Payment      │
├─────────────────────────────────┤
│ Order Summary                   │
│                                 │
│ Premium Monthly Plan            │
│ Billed monthly                  │
│                                 │
│ Subtotal            $9.99       │
│ Tax                 $0.00       │
│ ─────────────────────────       │
│ Total               $9.99       │
├─────────────────────────────────┤
│ Payment Method                  │
│                                 │
│ ○ Credit/Debit Card            │
│ ○ UPI                          │
│ ○ Net Banking                  │
│ ○ Wallet                       │
├─────────────────────────────────┤
│ [Proceed to Payment]            │
│                                 │
│ 🔒 Secure payment by Razorpay   │
└─────────────────────────────────┘
```

**UI Elements**:
- Order summary
- Payment method selection
- Payment provider integration (Razorpay/Stripe)
- Secure payment badge
- Terms link

**Actions**:
```
1. Show order summary
2. User selects payment method
3. Tap "Proceed to Payment"
4. Open Razorpay/Stripe SDK
5. User completes payment
6. Payment webhook updates subscription
7. Show success screen
8. Navigate to Home with active subscription
```

**API Calls**:
- `POST /subscriptions/create` - Initiates payment
- Webhook handles: `POST /subscriptions/webhook`

**Payment Flow**:
```
User → Select Plan → Payment Screen → Razorpay → Webhook → Success
```

---

### 👤 **PROFILE SCREEN**

**Purpose**: User account management

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  Profile               │
├─────────────────────────────────┤
│       ┌─────┐                   │
│       │  👤 │                   │
│       └─────┘                   │
│    John Doe                     │
│    john@example.com             │
│    ✓ Premium Member             │
├─────────────────────────────────┤
│ Account                         │
│ > Edit Profile                  │
│ > Subscription                  │
│ > Payment History               │
├─────────────────────────────────┤
│ Artist Features                 │
│ > Become an Artist             │ (if not artist)
│ > Artist Dashboard             │ (if artist)
├─────────────────────────────────┤
│ Support                         │
│ > Help & FAQ                    │
│ > File a Complaint              │
│ > Contact Support               │
├─────────────────────────────────┤
│ Settings                        │
│ > Notifications                 │
│ > Audio Quality                 │
│ > Downloads                     │
│ > Privacy                       │
│ > Language                      │
├─────────────────────────────────┤
│ About                           │
│ > Terms & Conditions            │
│ > Privacy Policy                │
│ > Licenses                      │
│ > App Version 1.0.0             │
├─────────────────────────────────┤
│ [Logout]                        │
└─────────────────────────────────┘
```

**UI Elements**:
- Profile avatar (editable)
- User name
- Email
- Subscription badge
- Menu sections:
  - Account
  - Artist Features
  - Support
  - Settings
  - About
- Logout button (red)

**Actions**:
```
1. Tap menu item → Navigate to respective screen
2. Tap "Edit Profile" → Edit Profile Screen
3. Tap "Subscription" → Subscription Screen
4. Tap "Become Artist" → Become Artist Screen (if not artist)
5. Tap "Artist Dashboard" → Artist Dashboard (if artist)
6. Tap "Logout" → Show confirmation dialog → Clear token → Navigate to Login
```

**API Calls**:
- `GET /auth/me` - Get user profile
- `POST /auth/logout` - Logout

---

### ⚙️ **SETTINGS SCREEN**

**Purpose**: App configuration

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  Settings              │
├─────────────────────────────────┤
│ Audio & Video                   │
│ > Streaming Quality             │
│   Auto, Low, Normal, High, HD   │
│ > Download Quality              │
│   Normal, High                  │
│ > Equalizer                     │
├─────────────────────────────────┤
│ Playback                        │
│ > Crossfade              [Toggle]│
│ > Gapless Playback      [Toggle]│
│ > Normalize Volume      [Toggle]│
├─────────────────────────────────┤
│ Notifications                   │
│ > New Releases          [Toggle]│
│ > Artist Updates        [Toggle]│
│ > Subscription Alerts   [Toggle]│
├─────────────────────────────────┤
│ Storage                         │
│ > Downloaded Songs: 1.2 GB      │
│ > Clear Cache                   │
│ > Download Location             │
├─────────────────────────────────┤
│ Privacy                         │
│ > Private Session       [Toggle]│
│ > Share Listening Activity      │
└─────────────────────────────────┘
```

**UI Elements**:
- Grouped settings
- Toggle switches
- Dropdowns for selection
- Storage usage display
- Action buttons (Clear Cache)

**Settings Stored**:
- Local storage (SharedPreferences/Hive)
- Sync with backend for cross-device

---

### 📢 **FILE COMPLAINT SCREEN**

**Purpose**: Report issues or copyright violations

**UI Layout**:
```
┌─────────────────────────────────┐
│ [← Back]  File a Complaint      │
├─────────────────────────────────┤
│ Complaint Type *                │
│ [▼ Select type]                 │
│    • Copyright Infringement     │
│    • Inappropriate Content      │
│    • Technical Issue            │
│    • Payment Issue              │
│    • Other                      │
│                                 │
│ Related Song/Album (optional)   │
│ [Search & Select]               │
│                                 │
│ Description *                   │
│ [________________________]      │
│ [________________________]      │
│ [________________________]      │
│                                 │
│ Supporting Documents            │
│ [Upload Files]                  │
│                                 │
│ [Submit Complaint]              │
└─────────────────────────────────┘
```

**UI Elements**:
- Complaint type dropdown
- Song/album search (if applicable)
- Description textarea
- File upload (proof)
- Submit button

**Actions**:
```
1. Select complaint type
2. Optionally select related content
3. Describe issue (min 50 chars)
4. Upload supporting documents
5. Submit complaint
6. Show confirmation: "Complaint submitted! Ticket #12345"
7. Navigate back
```

**API Calls**:
- `POST /complaints/`
  ```json
  Request: {
    "type": "COPYRIGHT_INFRINGEMENT",
    "target_song_id": 123,
    "description": "...",
    "proof_url": "s3_url"
  }
  ```

---

### 👨‍💼 **ADMIN DASHBOARD (In-App)**

**Purpose**: Admin content moderation

**Note**: Only accessible to users with admin role

**UI Layout**:
```
┌─────────────────────────────────┐
│ [≡ Menu]  Admin Dashboard       │
├─────────────────────────────────┤
│ Overview                        │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │  15 │ │  8  │ │  23 │        │
│ │Songs│ │Album│ │Comp │        │
│ └─────┘ └─────┘ └─────┘        │
├─────────────────────────────────┤
│ Quick Actions                   │
│ > Pending Songs (15)            │
│ > Pending Albums (8)            │
│ > Artist Requests (5)           │
│ > Complaints (23)               │
│ > Payouts Pending (12)          │
│ > Audit Logs                    │
├─────────────────────────────────┤
│ Content Management              │
│ > All Songs                     │
│ > All Albums                    │
│ > All Artists                   │
│ > Upload for Artist             │
└─────────────────────────────────┘
```

**Admin Screens**:

1. **Pending Songs Review**
   - List of pending songs
   - Approve/Reject buttons
   - Preview audio
   - View lyrics
   - Check for copyright issues

2. **Pending Albums Review**
   - List of pending albums
   - View all songs in album
   - Bulk approve/reject

3. **Artist Verification Requests**
   - View artist details
   - Check government ID
   - Watch selfie video
   - Approve/Reject with reason

4. **Complaints Management**
   - View all complaints
   - Filter by type, status
   - Resolve/Dismiss complaints
   - Take action (remove content, ban user)

5. **Payouts Management**
   - View pending payouts
   - Mark as paid
   - View payment history

6. **Upload for Artist**
   - Select artist from list
   - Upload song/album on their behalf
   - Same as artist upload but with artist selection

---

## 🔄 Complete User Flows

### Flow 1: New User Registration & First Play

```
1. Launch App → Splash Screen
2. No token found → Onboarding Screen
3. User swipes through → Tap "Get Started"
4. Register Screen → Fill form → Submit
5. Auto-login → Navigate to Home
6. Home shows popular songs
7. User taps a song → Subscription prompt appears
8. "Subscribe to Play" → Subscription Screen
9. Select plan → Payment Screen → Pay
10. Payment success → Navigate back to Home
11. Tap same song → Now Playing Screen
12. Song starts playing → Mini player appears
13. User can browse while listening
```

### Flow 2: Artist Uploading First Song

```
1. Login as regular user
2. Profile → "Become an Artist"
3. Fill artist form → Upload ID & video
4. Submit request → Wait for approval
5. (Admin approves in backend)
6. User receives notification
7. Profile → "Artist Dashboard" now visible
8. Artist Dashboard → "Upload Song"
9. Select "Standalone Single"
10. Fill song details
11. Upload cover image
12. Upload audio file
13. "Save as Draft" or "Upload & Submit"
14. If submit → Song goes to PENDING
15. (Admin approves)
16. Song status → APPROVED
17. Song now visible in Home feed
18. Users can play and artist earns revenue
```

### Flow 3: Creating Album with Multiple Songs

```
1. Artist Dashboard → "Create Album"
2. Fill album details → Upload cover
3. Create Album (DRAFT status)
4. Dashboard shows new album in DRAFT
5. "Upload Song" → Select "Add to Album"
6. Select the album from dropdown
7. Fill song details → Upload audio
8. Save → Song added to album
9. Repeat for all songs (3-4-5 songs)
10. Album detail shows all songs
11. "Submit Album" button
12. Tap submit → Album + all songs → PENDING
13. (Admin reviews and approves)
14. Album status → APPROVED
15. Album visible on Home as "New Release"
```

### Flow 4: Admin Content Approval

```
1. Login as admin
2. Profile → Admin Dashboard
3. See "Pending Songs (15)"
4. Tap → Pending Songs Screen
5. List of all pending songs
6. Tap song → Preview screen
   - Play audio
   - Read lyrics
   - Check metadata
7. Approve → Song goes APPROVED
   OR
   Reject → Enter reason → Song goes REJECTED
8. Artist receives notification
9. If approved → Song goes live
10. If rejected → Artist can resubmit after fixes
```

### Flow 5: Handling Copyright Complaint

```
1. User discovers copyright violation
2. Profile → "File a Complaint"
3. Select "Copyright Infringement"
4. Search and select the offending song
5. Describe issue + upload proof
6. Submit → Complaint created
7. (Admin reviews in Admin Dashboard)
8. Admin → Complaints → View details
9. Admin decides:
   - Dismiss (not valid)
   - Remove content + notify artist
   - Ban artist (serious violation)
10. User receives notification of resolution
```

---

## 🎨 Design Guidelines

### Color Scheme (Suggested)
- Primary: Purple/Blue (#6366F1)
- Secondary: Gold (#F59E0B)
- Background: Dark (#1F2937) / Light (#FFFFFF)
- Text: Light Gray (#E5E7EB) / Dark Gray (#1F2937)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)

### Typography
- Headings: Bold, 20-24px
- Body: Regular, 14-16px
- Captions: Light, 12px

### Components
- Rounded corners (8-12px)
- Elevation/shadows for cards
- Smooth animations (200-300ms)
- Shimmer loading states

---

## 📦 State Management

**Recommended**: Provider or Riverpod

**States to Manage**:
- Authentication state (logged in/out)
- User profile data
- Current playing song
- Playback state (playing/paused)
- Queue/playlist
- Download progress
- Subscription status
- Network status
- Theme (dark/light mode)

---

## 🔧 Key Flutter Packages

### Essential
- `http` or `dio` - API calls
- `flutter_secure_storage` - Token storage
- `provider` or `riverpod` - State management
- `go_router` - Navigation
- `just_audio` - Music playback
- `audio_service` - Background audio
- `cached_network_image` - Image caching

### UI
- `shimmer` - Loading animations
- `flutter_svg` - SVG support
- `google_fonts` - Custom fonts
- `flutter_slidable` - Swipe actions

### Media
- `video_player` - Video preview
- `image_picker` - Image upload
- `file_picker` - File selection
- `permission_handler` - Permissions

### Payment
- `razorpay_flutter` - Razorpay integration

### Storage
- `hive` - Local database
- `path_provider` - File paths
- `shared_preferences` - Settings

---

## 🔐 Security Considerations

1. **Secure Token Storage**: Use flutter_secure_storage
2. **API Security**: HTTPS only, JWT tokens
3. **File Upload**: Presigned URLs, validate file types
4. **Payment**: Never store payment details locally
5. **DRM**: Consider encrypting downloaded audio files
6. **Certificate Pinning**: For production

---

## 📊 Analytics to Track

- User registration/login
- Song plays
- Search queries
- Subscription conversions
- Artist uploads
- Complaints filed
- Crashes/errors
- Session duration
- Popular songs/artists

---

## ✅ Feature Summary Checklist

### Phase 1 - Core Features
- [ ] Authentication (Login/Register/Logout)
- [ ] Home Feed (Browse songs)
- [ ] Music Player (Streaming)
- [ ] Search
- [ ] Subscription & Payment
- [ ] Profile Management

### Phase 2 - Artist Features
- [ ] Become Artist Request
- [ ] Upload Songs
- [ ] Create Albums
- [ ] Artist Dashboard
- [ ] Content Management

### Phase 3 - Advanced Features
- [ ] Offline Downloads
- [ ] Playlists
- [ ] Lyrics Display
- [ ] Share Songs
- [ ] Favorites/Likes
- [ ] Recently Played History

### Phase 4 - Admin Features
- [ ] Admin Dashboard
- [ ] Content Approval
- [ ] Artist Verification
- [ ] Complaints Management
- [ ] Payouts Management
- [ ] Audit Logs

### Phase 5 - Enhancements
- [ ] Push Notifications
- [ ] Social Sharing
- [ ] Artist Following
- [ ] Recommendations
- [ ] Sleep Timer
- [ ] Equalizer
- [ ] Dark/Light Theme
- [ ] Multi-language Support

---

## 🚀 Development Timeline (Estimated)

- **Week 1-2**: Project setup, authentication, home feed
- **Week 3-4**: Music player, streaming, mini player
- **Week 5-6**: Search, library, favorites
- **Week 7-8**: Subscription, payment integration
- **Week 9-10**: Artist features (upload, dashboard)
- **Week 11-12**: Admin panel, content moderation
- **Week 13-14**: Offline downloads, advanced features
- **Week 15-16**: Testing, bug fixes, polish
- **Week 17-18**: Beta testing, final adjustments
- **Week 19-20**: Production release

**Total**: 4-5 months for full feature set

---

This is a comprehensive plan for your Flutter music streaming app! Ready to start implementation? 🎵📱
