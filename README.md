# MongoDB Document Trigger

A comprehensive audit logging system for MongoDB that automatically tracks and logs every document change in real-time using MongoDB Change Streams and Database Triggers.

## How It Works?

### Step-by-Step Process

1. **Change Detection**: When any document in your MongoDB database is modified (insert, update, delete, replace), MongoDB's Change Stream automatically detects the change
2. **Trigger Activation**: The database trigger (`Trigger.js`) is instantly activated with the change event details
3. **Field Analysis**: The trigger analyzes the change at the field level, comparing old vs new values
4. **Audit Log Creation**: For each changed field, a separate audit log entry is created with complete metadata
5. **Storage**: Audit logs are stored in dedicated collections (e.g., `users_logs` for `users` collection)
6. **Web Interface**: The Next.js dashboard provides real-time access to view, search, and analyze all audit data

### What Gets Logged?

**For Each Changed Field:**

- Document ID of the affected record
- Operation Type (INSERT, UPDATE, DELETE, REPLACE)
- Changed Filed (including nested fields)
- Old value (before change)
- New value (after change)
- Updated By (User who made the change)
- Exact timestamp of the change

**Example**: When a user updates their email from `old@email.com` to `new@email.com`, the system creates:

``` json
{
  "documentId": "507f1f77bcf86cd799439011",
  "operationType": "update",
  "changedFields": "email",
  "oldValue": "old@email.com",
  "newValue": "new@email.com",
  "updatedBy": "admin@email.com",
  "timestamp": "2025-06-12T10:30:00.000Z"
}
```

## User Interface Guide

### Home Page (`http://localhost:3000/`)

**What You'll See:**

- **Create User Tab**: Form to add new users with name, email, role, and complete address
- **Manage Users Tab**: Table showing all users with edit/delete buttons
- **Real-time Updates**: User list automatically refreshes after any operation

**What Gets Audited:**

- Every user creation, update, and deletion
- Field-level changes (name, email, role, address components)

### Audit Logs Page (`http://localhost:3000/logs`)

**What You'll See:**

- **Collection Selector**: Dropdown to choose which collection's logs to view
- **Search & Filters**:
  - Global search across all fields
  - Document ID filter
  - Changed field filter
- **Document Summary Table**: Shows documents that have been modified with:
  - Document ID (clickable for detailed history)
  - Last operation performed
  - Last modification timestamp

**How to Use:**

1. Select a Collection from the dropdown
2. Use filters to narrow down results
3. Click any document ID to see detailed change history

### Document History Page (`http://localhost:3000/document/[id]`)

**What You'll See:**

- **Document Information**: Document ID
- **Complete Change Timeline**: Chronological table showing:
  - Operation Type (INSERT/UPDATE/DELETE)
  - Changed Field
  - Previous Value
  - New Value
  - Updated By
  - Timestamp

**How to Access:**

- Click any document ID in the logs page
- Or navigate directly: `/document/[documentId]?collection=[collectionName]`

## Setup Guide

### Step 1: Project Setup

```bash
# Clone the repository
git clone https://github.com/sujeethshingade/mongodb-document-trigger.git
cd mongodb-document-trigger

# Install dependencies
npm install

# Create environment file
touch .env.local
```

### Step 2: MongoDB Atlas Configuration

```bash
# Edit .env.local with your credentials
MONGODB_URI=your_mongodb_connection_string

# MongoDB Atlas API Configuration for Triggers Setup
ATLAS_PUBLIC_KEY=your_atlas_public_key_here
ATLAS_PRIVATE_KEY=your_atlas_private_key_here
ATLAS_PROJECT_ID=your_atlas_project_id_here
ATLAS_APP_ID=your_atlas_app_id_here
```

**How to Get Atlas Credentials?**

1. **API Keys**: Atlas → Access Manager → Project Access → Applications → API Keys → Create a new key
2. **Project ID**: Atlas → Project Settings
3. **App ID**: Atlas → App Services → Create App Service → App Settings

### Step 3: Deploy Database Triggers

**Option A: Automated Deployment (Recommended)**

```bash
# Deploy the audit function to Atlas App Services
npm run deploy-functions

# Create triggers automatically from triggers.json
npm run setup-triggers
```

**Configure Triggers for Your Collections:**

Edit [`triggers/triggers.json`](triggers/triggers.json) to match your collections:

```json
[
  {
    "name": "trigger_name",    // Adjust trigger name as requried
    "type": "DATABASE",
    "disabled": false,
    "function_name": "auditLogFunction",
    "config": {
      "operation_types": ["INSERT", "UPDATE", "DELETE", "REPLACE"],
      "database": "your_database_name",    // Adjust database name as requried
      "collection": "collection_name",                 // Adjust collection name as requried for trigger to be setup on
      "service_name": "mongodb-document-trigger",
      "match": {},
      "full_document": true,
      "full_document_before_change": true
    }
  }      // Add more trigger objects for additional collections
]
```

**Option B: Manual Setup via Atlas Dashboard**

1. **Create App Service**:
   - Atlas → App Services → Create App Service
   - Choose your cluster and database
   - Note the App ID for your `.env.local`

2. **Deploy Function**:
   - App Services → Functions → Create New Function
   - Function Name: `auditLogFunction`
   - Copy contents from [`triggers/auditLogFunction.js`](triggers/auditLogFunction.js)
   - Save and Deploy

3. **Create Triggers**:
   - App Services → Triggers → Add Trigger
   - **Trigger Details**:
     - Trigger Type: Database
     - Watch Against: Collection
     - Cluster Name: Select your cluster
     - Database Name: Select your database
     - Collection Name: Select the collection to monitor
     - Operation Type: Select all (Insert, Update, Delete, Replace)
     - Full Document: ✅ Yes
     - Document Preimage: ✅ Yes (REQUIRED)

4. **Function Configuration**:
   - Auto-Resume: ✅ Yes
   - Event Ordering: ✅ Yes
   - Event Type: Function
   - Function: Select `auditLogFunction` or Copy and paste the entire contents of `Trigger.js` from this project and run
   - Trigger Name: Name the trigger
   - Save the trigger

5. **Export Trigger App in App Services (Not Requried for Setup)**:
   - App Services → Select Created App → Deployment → Export App → Download as a .zip file

### Step 4: Run the Application

```bash
# Start development server
npm run dev

# Or build for production
npm run build
npm start
```

**Access the application at**: `http://localhost:3000`

## Bulk Trigger Management

The [`triggers/`](triggers/) directory contains:

- [`auditLogFunction.js`](triggers/auditLogFunction.js) - Main audit logging function
- [`triggers.json`](triggers/triggers.json) - Trigger definitions for bulk creation
- [`setup-triggers.js`](triggers/setup-triggers.js) - Automated trigger creation script
- [`deploy-functions.js`](triggers/deploy-functions.js) - Function deployment script

## Important Notes

**M0 (Free Cluster) Limitations:**

- **Auto-Resume**: Not supported for bulk creation of triggers on M0 clusters (works on individual creation). Database triggers cannot automatically resume after failures.
- **Change Stream Options**: Implement Change Stream options not available on M0 clusters. Cannot set  the retention time for pre- and post-images in change streams for requried time.
