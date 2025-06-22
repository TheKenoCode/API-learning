# Club Settings Implementation

## Overview

A comprehensive Club Settings section has been implemented that allows Club Admins and Site Admins to update club information including:

- Club Name
- Profile Picture
- Location (City/Territory) 
- Privacy Settings (Public/Private)
- Description

## Features Implemented

### 1. **UI Components**
- **ClubSettings.tsx**: Main settings form component with sections for:
  - Profile picture upload with preview
  - Basic information (name, description)
  - Location settings
  - Privacy toggle between Public/Private
  - Real-time validation and change tracking
  - Success/error notifications

### 2. **Permission System**
- Only users with `ADMIN` role in the club can access settings
- Site admins (`SUPER_ADMIN`, `ADMIN`) can edit any club settings
- Proper client and server-side permission checks

### 3. **Backend Integration**
- Uses existing `updateSettings` mutation in the club router
- New `generateImageUploadUrl` mutation for secure S3 image uploads
- Validation using existing SecurityValidator
- Audit logging for all changes

### 4. **Image Upload System**
- Secure presigned URL generation for S3 uploads
- File type validation (images only)
- File size validation (5MB limit)
- Unique file naming with user ID and timestamp
- Direct browser-to-S3 upload (no server processing)

## File Structure

```
packages/web/
├── components/club/
│   ├── ClubSettings.tsx          # Main settings component
│   └── AdminDashboard.tsx        # Updated to include settings tab
├── server/api/routers/
│   └── club.ts                   # Added generateImageUploadUrl mutation
└── lib/
    └── s3.ts                     # S3 utilities (existing)
```

## API Endpoints

### 1. Update Club Settings
- **Endpoint**: `club.updateSettings`
- **Method**: Mutation
- **Input**: Club ID + updated fields
- **Permissions**: Club ADMIN or Site ADMIN
- **Validation**: XSS prevention, location validation, image URL validation

### 2. Generate Image Upload URL
- **Endpoint**: `club.generateImageUploadUrl`
- **Method**: Mutation  
- **Input**: Club ID, filename, file type
- **Output**: Presigned S3 URL + final image URL
- **Permissions**: Club ADMIN or Site ADMIN

## Integration Points

### Admin Dashboard Integration
The ClubSettings component is integrated as a new tab in the existing AdminDashboard:

```tsx
<TabsTrigger value="settings">
  <Settings className="w-4 h-4 mr-2" />
  Settings
</TabsTrigger>
```

### Permission Checks
```tsx
// Client-side check
if (!club || (!isAdmin && !isSiteAdmin)) {
  return <AccessDenied />;
}

// Server-side check  
.use(async ({ ctx, next, input }) => {
  await requireClubPermission((input) => input.clubId, "ADMIN")(ctx, input);
  return next();
})
```

## Usage

### For Club Admins
1. Navigate to club page
2. Click "Admin" tab (crown icon)
3. Select "Settings" tab
4. Update desired fields
5. Click "Save Changes"

### For Site Admins
- Can access settings for any club
- Same interface with additional privileges
- All changes are audit logged

## Security Features

### Input Validation
- XSS prevention on all text inputs
- File type validation for images
- File size limits (5MB)
- Location field validation

### Permission Enforcement
- Role-based access control
- Server-side permission verification
- Rate limiting on admin operations

### Audit Logging
- All settings changes logged
- Image upload attempts tracked
- User ID and metadata recorded

## Environment Variables Required

```env
# S3/MinIO Configuration
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_REGION=us-east-1
S3_BUCKET_IMAGES=redline-images
S3_PUBLIC_URL=https://your-cdn-domain.com  # Optional
```

## Future Enhancements

### Planned Features
- Image cropping/resizing before upload
- Multiple image support for club galleries
- Bulk settings management for site admins
- Advanced privacy controls (member visibility, join approval workflows)

### Technical Improvements
- Image optimization and CDN integration
- Real-time settings sync across user sessions
- Advanced validation with schema constraints
- Toast notification system integration

## Testing

### Manual Testing Checklist
- [ ] Club admin can access settings
- [ ] Non-admin users cannot access settings
- [ ] Site admins can edit any club
- [ ] Image upload works with valid files
- [ ] Invalid files are rejected
- [ ] Form validation works correctly
- [ ] Privacy toggle updates club visibility
- [ ] Changes are saved and reflected immediately
- [ ] Audit logs are created for changes

### Security Testing
- [ ] Permission bypass attempts fail
- [ ] XSS attempts in form fields are blocked
- [ ] Large file uploads are rejected
- [ ] Invalid file types are blocked
- [ ] Rate limiting works on admin operations

## Deployment Notes

1. **Database**: No migrations required (uses existing Club table)
2. **S3**: Ensure buckets are created and accessible
3. **Permissions**: Verify environment variables are set
4. **CDN**: Configure S3_PUBLIC_URL for production
5. **Monitoring**: Check audit logs for settings changes

## Support

For issues or questions regarding the Club Settings feature:
- Check audit logs for debugging
- Verify S3 configuration and permissions
- Ensure user has proper club role assignment
- Review rate limiting if requests are failing 