# MongoDB Document Trigger with Field-Based Audit Logging

A Next.js application demonstrating MongoDB Atlas triggers for comprehensive field-level audit logging. Each collection automatically logs changes to individual fields in its corresponding `_logs` collection.

## Features

- **Field-Level Audit Logging**: Each changed field generates a separate audit log entry
- **Dynamic Collection Support**: Automatically creates `{collection}_logs` for any monitored collection
- **Real-time Change Tracking**: MongoDB Atlas triggers capture all document changes
- **Advanced Filtering**: Search and filter logs by document ID, operation type, field, user, and date range
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS
- **Responsive Design**: Mobile-friendly interface with ShadCN UI components

## Log Entry Format

Each log entry follows this structure:
```json
{
  "documentId": "<ObjectId>",
  "operationType": "update",
  "changedFields": "name",
  "oldValue": "rock",
  "newValue": "rockstar",
  "updatedBy": "user@example.com",
  "timestamp": "<ISODate>"
}
```

## Installation Steps

### 1. Clone the repository
```bash
git clone https://github.com/sujeethshingade/mongodb-document-trigger.git
cd mongodb-document-trigger
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/test?retryWrites=true&w=majority
```

### 4. Configure MongoDB Atlas

#### Enable Pre and Post Images
In MongoDB Atlas, ensure your cluster supports pre and post images (requires M10+ tier):

```javascript
// Run in MongoDB Compass or Mongosh
db.adminCommand({ 
  setClusterParameter: {
    changeStreamOptions: { 
      preAndPostImages: { 
        expireAfterSeconds: 604800 // 7 days retention
      } 
    }
  }
})
```

#### Create TTL Indexes for Log Cleanup
```javascript
// For users collection logs (7-day retention)
db.users_logs.createIndex(
  { "timestamp": 1 },
  { expireAfterSeconds: 604800, name: "timestamp_1" }
);

// For other collections, create similar indexes:
db.app_logs.createIndex(
  { "timestamp": 1 },
  { expireAfterSeconds: 604800, name: "timestamp_1" }
);
```

### 5. Set up MongoDB Atlas Triggers

#### Create Database Trigger
1. Go to your MongoDB Atlas project
2. Navigate to "Triggers" in the left sidebar
3. Click "Add Trigger"
4. Configure the trigger:
   - **Trigger Type**: Database
   - **Name**: `auditLogTrigger`
   - **Enabled**: Yes
   - **Event Ordering**: Yes
   - **Cluster Name**: Your cluster
   - **Database Name**: `test`
   - **Collection Name**: Leave empty to monitor all collections
   - **Operation Type**: Insert, Update, Delete
   - **Full Document**: Yes
   - **Document Preimage**: Yes

#### Trigger Function
Copy the content from `EnhancedTrigger.js` into the trigger function editor.

### 6. Run the development server
```bash
npm run dev
# or
yarn dev
```

### 7. Access the application
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating and Managing Documents
- Use the form to create new users with dynamic fields
- Edit existing users to see update tracking
- Delete users to see deletion logging

### Viewing Audit Logs
- **Field-based Logs**: Modern tabular view showing individual field changes
- **Document History**: Traditional view showing complete document changes
- **Advanced Filtering**: Filter by document ID, operation type, field name, user, or date range
- **Sorting**: Click column headers to sort by any field
- **Pagination**: Navigate through large log sets

### Searching and Filtering
- **Document ID**: Find all changes for a specific document
- **Operation Type**: Filter by insert, update, or delete operations
- **Changed Field**: Search for changes to specific fields
- **Updated By**: Filter changes by user email
- **Date Range**: Filter by timestamp (future enhancement)

## API Endpoints

### Users API
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Audit Logs API
- `GET /api/audit-logs` - Get audit logs with filtering
  - Query parameters:
    - `collection` - Collection name (default: 'users')
    - `documentId` - Filter by document ID
    - `operationType` - Filter by operation (insert/update/delete)
    - `changedFields` - Filter by field name
    - `updatedBy` - Filter by user
    - `useFieldLogs` - Use field-based logs (default: true)
    - `limit` - Number of results (default: 100)
    - `skip` - Pagination offset
    - `sortBy` - Sort field (default: 'timestamp')
    - `sortOrder` - Sort direction (asc/desc, default: desc)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── audit-logs/route.ts    # Audit logs API
│   │   └── users/                 # Users CRUD API
│   ├── document/[id]/page.tsx     # Individual document history
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main dashboard
├── components/
│   ├── AuditLogsTable.tsx         # Field-based audit logs table
│   ├── DocumentList.tsx           # Document history navigation
│   ├── Navbar.tsx                 # Navigation bar
│   ├── UserForm.tsx               # User creation/editing form
│   └── UsersList.tsx              # Users list table
└── lib/
    ├── mongodb.ts                 # MongoDB connection
    └── types.ts                   # TypeScript interfaces
```

## MongoDB Collections

### Primary Collections
- `users` - User documents with dynamic fields
- `app` - Application documents (example)

### Audit Collections
- `users_logs` - Field-level audit logs for users collection
- `app_logs` - Field-level audit logs for app collection

### Log Schema
```typescript
interface FieldAuditLog {
  _id?: string;
  documentId: string;
  operationType: 'insert' | 'update' | 'delete';
  changedFields: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
  timestamp: Date;
}
```

## Advanced Features

### Nested Object Handling
The trigger automatically handles nested objects like the `Address` field, creating separate log entries for each changed subfield:

```json
// Address changes create individual entries for each subfield
{
  "changedFields": "AddressLine1",
  "oldValue": "123 Old St",
  "newValue": "456 New Ave"
}
```

### User Context Tracking
The trigger attempts to identify the user making changes by checking:
1. `email` field in the document
2. `updatedBy` field in the document
3. `userId` field in the document
4. Falls back to "system" if none found

### Automatic Log Cleanup
TTL indexes automatically remove logs older than 7 days to manage storage.

## Technical Details

### MongoDB Change Streams
- Uses MongoDB Change Streams with pre and post images
- Requires MongoDB 4.0+ and M10+ cluster for pre-image support
- Automatic resume on connection interruption

### Performance Considerations
- TTL indexes for automatic cleanup
- Pagination for large log sets
- Efficient filtering with MongoDB indexes
- Bulk insert operations for multiple field changes

## Troubleshooting

### Common Issues

1. **Pre-images not available**: Ensure your cluster is M10+ and pre-images are enabled
2. **Trigger not firing**: Check trigger configuration and ensure it's enabled
3. **Connection issues**: Verify MONGODB_URI in .env.local
4. **Missing logs**: Check if TTL index is removing logs too quickly

### Debug Mode
Enable debug logging in the trigger function to troubleshoot issues:

```javascript
console.log("Trigger Event:", JSON.stringify(changeEvent, null, 2));
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.
