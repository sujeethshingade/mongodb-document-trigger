# MongoDB Document Trigger

A comprehensive audit logging system for MongoDB that tracks document changes using MongoDB Change Streams and Database Triggers. This project provides real-time monitoring and detailed field-level audit trails for all CRUD operations.

## 🚀 Features

- **Real-time Change Tracking**: Monitors MongoDB collections using change streams
- **Field-level Audit Logs**: Tracks individual field changes with old/new values
- **Nested Object Support**: Handles complex nested objects and arrays intelligently
- **Web Dashboard**: Modern React/Next.js interface for viewing audit logs
- **User Management**: Built-in user CRUD operations with audit trail
- **Filter & Search**: Advanced filtering capabilities for audit logs
- **Document History**: Complete change history for individual documents
- **TTL Support**: Automatic cleanup of old audit logs
- **Collection-based Logging**: Separate log collections for each monitored collection

## 🏗️ Architecture

### Components

1. **MongoDB Trigger** (`Trigger.js`): Database-side trigger function that captures change events
2. **Next.js Frontend**: React-based web interface for viewing and managing data
3. **API Routes**: RESTful endpoints for data operations
4. **Audit Log Collections**: Dedicated collections for storing change history

### Data Flow

```
MongoDB Collection → Change Stream → Database Trigger → Audit Log Collection → Web Interface
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: MongoDB with Change Streams
- **Backend**: Next.js API Routes
- **UI Components**: Shadcn/ui, Lucide React Icons

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas M10+ cluster (for change streams and pre/post images)
- MongoDB database with change streams enabled

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sujeethshingade/mongodb-document-trigger.git
cd mongodb-document-trigger
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/test?retryWrites=true&w=majority
```

### 4. MongoDB Configuration

#### Enable Change Streams and Pre/Post Images

Connect to your MongoDB cluster using mongosh and run:

```javascript
// Enable pre and post images for change streams (requires M10+ cluster)
db.adminCommand({ 
  setClusterParameter: {
    changeStreamOptions: { 
      preAndPostImages: { 
        expireAfterSeconds: 604800 // 7 days retention
      } 
    }
  }
})

// Create TTL index for automatic cleanup of audit logs
db.users_logs.createIndex(
  { "timestamp": 1 },
  { expireAfterSeconds: 604800, name: "timestamp_1" }
);
```

#### Deploy the Database Trigger

1. Go to MongoDB Atlas → Database → Triggers
2. Create a new trigger with the following configuration:
   - **Trigger Type**: Database
   - **Name**: `audit-trigger`
   - **Enabled**: Yes
   - **Event Ordering**: Yes
   - **Skip Events**: No
   - **Cluster Name**: Your cluster name
   - **Database Name**: `test` (or your database name)
   - **Collection Name**: Leave empty to monitor all collections
   - **Operation Type**: Insert, Update, Delete
   - **Full Document**: Yes
   - **Document Preimage**: Yes

3. Copy the contents of `Trigger.js` into the function editor
4. Save and deploy the trigger

### 5. Run the Application

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📖 Usage

### Web Interface

#### Home Page (`/`)
- Create, edit, and delete users
- All operations are automatically audited
- Real-time updates to the user list

#### Audit Logs Page (`/logs`)
- View document summaries by collection
- Filter logs by document ID, changed fields, or search terms
- Click on any document to view detailed change history

#### Document History (`/document/[id]`)
- Complete audit trail for a specific document
- Field-level changes with old/new values
- Timeline view of all modifications

### API Endpoints

#### Collections
- `GET /api/collections` - List all available collections
- `GET /api/collections/[collection]` - Get documents from a collection
- `GET /api/collections/[collection]/[id]` - Get specific document
- `POST /api/collections/[collection]` - Create new document
- `PUT /api/collections/[collection]/[id]` - Update document
- `DELETE /api/collections/[collection]/[id]` - Delete document

#### Audit Logs
- `GET /api/logs` - Get audit logs with filtering options

Query parameters:
- `collection` - Target collection name
- `documentId` - Filter by document ID
- `operationType` - Filter by operation (insert/update/delete)
- `changedFields` - Filter by field name
- `updatedBy` - Filter by user
- `startDate` / `endDate` - Date range filtering
- `limit` / `skip` - Pagination
- `sortBy` / `sortOrder` - Sorting options

## 🔧 Configuration

### Excluded Fields

The trigger automatically excludes certain fields from audit logging:

```javascript
const excludedFields = ['_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', '__v'];
```

### Meaningful Value Detection

The system only logs fields with meaningful values (not null, undefined, empty string, or empty objects):

```javascript
const isMeaningfulValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value);
        if (keys.length === 0) return false;
        return keys.some(key => isMeaningfulValue(value[key]));
    }
    return true;
};
```

### TTL Configuration

Audit logs are automatically cleaned up after 7 days by default. To modify retention:

```javascript
// Change retention period (in seconds)
db.collection_logs.createIndex(
  { "timestamp": 1 },
  { expireAfterSeconds: 2592000 } // 30 days
);
```

## 📊 Audit Log Schema

### Field-based Audit Log

```typescript
interface FieldAuditLog {
  _id?: string;
  documentId: string;           // ID of the changed document
  operationType: 'insert' | 'update' | 'delete';
  changedFields: string;        // Field path (e.g., "Address.City")
  oldValue: any;               // Previous value
  newValue: any;               // New value
  updatedBy: string;           // User who made the change
  timestamp: Date;             // When the change occurred
}
```

### User Schema

```typescript
interface User {
  _id?: string;
  name: string;
  email: string;
  role?: string | null;
  Address?: {
    AddressLine1?: string | null;
    AddressLine2?: string | null;
    City?: string | null;
    State?: string | null;
    Country?: string | null;
    ZipCode?: string | null;
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Change Streams Not Working**
   - Ensure you're using MongoDB Atlas M10+ cluster
   - Verify change streams are enabled in cluster settings

2. **Pre/Post Images Missing**
   - Requires MongoDB 6.0+ and M10+ cluster
   - Enable using the admin command shown in setup

3. **Trigger Not Firing**
   - Check trigger is enabled in Atlas
   - Verify database and collection names match
   - Review trigger logs in Atlas

4. **Empty Audit Logs**
   - Ensure meaningful data is being changed
   - Check excluded fields configuration
   - Verify trigger deployment

### Performance Considerations

- Use TTL indexes to prevent unlimited log growth
- Consider sharding for high-volume collections
- Monitor change stream performance
- Implement proper indexes on audit collections

## 🧪 Testing

### Manual Testing

1. **Create a User**
   ```bash
   # Navigate to home page and create a new user
   # Check logs page to verify audit entries
   ```

2. **Update Operations**
   ```bash
   # Edit user information
   # Verify field-level changes are captured
   ```

3. **Delete Operations**
   ```bash
   # Delete a user
   # Confirm deletion is logged with all field values
   ```

### Database Testing

```javascript
// Connect to MongoDB and test manually
db.users.insertOne({
  name: "Test User",
  email: "test@example.com",
  Address: {
    City: "New York",
    State: "NY"
  }
});

// Check audit logs
db.users_logs.find().sort({timestamp: -1});
```



---

**Built with ❤️ using MongoDB and Next.js**
