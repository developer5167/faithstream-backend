# Selfie Video Recording Feature

## Overview
A new selfie video recording feature has been implemented for artist registration in the FaithStream Music App. This feature is required for artists to complete their registration and resolves the database constraint error for `selfie_video_url` in the `artist_profiles` table.

## Features

### Video Recording Requirements
- **Duration**: Minimum 3 seconds, maximum 30 seconds
- **File Size Limit**: Maximum 15MB
- **Content**: User should say "Hi" and introduce themselves with their name
- **Camera**: Uses front-facing camera by default
- **Audio**: Records audio along with video

### User Experience
1. **Permission Request**: App automatically requests camera and microphone permissions
2. **Recording Interface**: Full-screen camera preview with clear instructions
3. **Real-time Feedback**: Shows recording duration and file size constraints
4. **Automatic Upload**: Video is uploaded to S3 immediately after recording
5. **Progress Indication**: Shows upload progress to the user
6. **File Cleanup**: Temporary video files are automatically cleaned up after upload

### S3 Storage Structure
Videos are stored in S3 with the following folder structure:
```
profiles/artist/{userId}/selfie_videos/selfie_video_{timestamp}.mp4
```

## Technical Implementation

### New Dependencies Added
- `camera: ^0.11.0` - For video recording functionality
- `video_player: ^2.8.6` - For video playback (future use)
- `path: ^1.9.0` - For file path manipulation

### New Files Created
1. `lib/utils/video_recording_helper.dart` - Main video recording functionality
2. `lib/utils/permissions_helper.dart` - Handles camera and microphone permissions

### Updated Files
1. **Backend**:
   - `src/services/upload.service.js` - Added video file type validation
   - `src/controllers/upload.controller.js` - Added `artist_selfie_video` upload type
   - `src/utils/s3.util.js` - Added S3 folder structure for selfie videos

2. **Flutter App**:
   - `pubspec.yaml` - Added video recording dependencies
   - `lib/services/upload_service.dart` - Added video content types and upload method
   - `lib/blocs/profile/profile_event.dart` - Added `selfieVideoUrl` parameter
   - `lib/blocs/profile/profile_bloc.dart` - Updated artist request to include video URL
   - `lib/repositories/user_repository.dart` - Updated API call with video URL
   - `lib/ui/screens/artist_registration_screen.dart` - Added video recording UI
   - `android/app/src/main/AndroidManifest.xml` - Added camera and microphone permissions

## Usage Instructions

### For Artists
1. Open the artist registration screen
2. Fill in the required information (name, bio, documents)
3. Tap "Record Selfie Video" button
4. Grant camera and microphone permissions if prompted
5. Follow on-screen instructions to record a 3-30 second video
6. Say "Hi" and introduce yourself with your name
7. Tap stop when finished recording
8. Video uploads automatically to cloud storage
9. Complete the rest of the registration form
10. Submit the artist application

### For Developers
The video recording feature integrates seamlessly with the existing artist registration flow. The `VideoRecordingHelper` class provides a simple interface:

```dart
final videoUrl = await VideoRecordingHelper.recordAndUploadSelfieVideo(
  context: context,
  uploadService: uploadService,
);
```

## Error Handling

### Common Issues
1. **Camera Permission Denied**: App guides users to settings to enable permissions
2. **No Camera Available**: Shows appropriate error message
3. **Video Too Short**: Minimum 3 seconds required, shows warning
4. **File Too Large**: Maximum 15MB limit, prompts user to record shorter video
5. **Upload Failed**: Shows error message and allows retry

### Database Constraint Resolution
The implementation ensures that `selfie_video_url` is always provided for artist registration, preventing the "null value in column 'selfie_video_url'" database error.

## Testing

### Manual Testing Steps
1. Install the app on a physical device (camera required)
2. Navigate to artist registration
3. Test permission flow
4. Record various video lengths (too short, acceptable, too long)
5. Verify upload functionality
6. Test with different network conditions
7. Verify database entry includes video URL

### Device Requirements
- Physical Android/iOS device with camera
- Microphone access
- Internet connection for video upload
- Sufficient storage space for temporary video files

## Security Considerations
- Videos are uploaded to secure S3 buckets
- Temporary files are cleaned up after upload
- User permissions are properly requested and handled
- Video files are organized by user ID for privacy

## Future Enhancements
1. Video preview before upload
2. Video editing capabilities (trim, filters)
3. Multiple video takes with selection option
4. Video compression optimization
5. Offline recording with batch upload
6. Video quality settings based on network conditions