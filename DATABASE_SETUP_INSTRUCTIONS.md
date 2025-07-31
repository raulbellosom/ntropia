# Manual Database Configuration Required

To complete the real-time notification system implementation, you need to make the following changes in the Directus Admin Panel:

## 1. Add `viewed` Field to Invitations Collection

1. **Go to Directus Admin Panel** → Data Model → `invitations` collection
2. **Add a new field**:
   - **Field Name**: `viewed`
   - **Type**: Boolean
   - **Default Value**: `false`
   - **Required**: No
   - **Description**: "Indicates if the invitation notification has been viewed by the recipient"

## 2. Environment Variables

Ensure the following environment variables are set in your `.env` files:

### Backend (.env in root or back directory):

```env
SOCKET_SERVER_URL=http://localhost:4010
SOCKET_SERVER_PORT=4010
```

### Frontend (.env in front directory):

```env
VITE_SOCKET_URL=http://localhost:4010
```

## 3. Test the Implementation

After adding the `viewed` field and setting environment variables:

1. **Start the socket server**:

   ```bash
   cd back/socket-server
   npm install
   npm start
   ```

2. **Start the backend** (Directus):

   ```bash
   cd back
   # Start your Directus instance
   ```

3. **Start the frontend**:

   ```bash
   cd front
   npm run dev
   ```

4. **Test the workflow**:
   - Create a workspace
   - Invite a user
   - Check that:
     - Toast notification appears for the invited user
     - Dropdown shows the invitation
     - Real-time updates work in workspace config modal
     - Accept/reject functionality works
     - Socket events are properly emitted and received

## 4. Verification Checklist

- [ ] `viewed` field added to `invitations` collection
- [ ] Environment variables set correctly
- [ ] Socket server running on port 4010
- [ ] Toast notifications working
- [ ] Dropdown notifications updating in real-time
- [ ] Workspace config modal receiving socket events
- [ ] All socket events properly logged in console
- [ ] Database updates reflecting in UI without page refresh

## 5. Troubleshooting

- Check browser console for socket connection errors
- Verify socket server logs for event emissions
- Ensure Directus hooks are loaded correctly
- Check that all required fields exist in the database

The real-time notification system is now fully implemented according to the specification document.
