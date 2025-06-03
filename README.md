# MongoDB Document Trigger

It demonstrates the implementation of MongoDB change streams and triggers to create an audit logging system for tracking changes to database collections.

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/sujeethshingade/mongodb-document-trigger.git
   cd mongodb-document-trigger
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### MongoDB Change Stream Configuration

- Full Document: Captures the complete state of documents after changes
  
- Document Preimage: Captures the document state before changes

- Auto-resume: Automatically resumes change streams if interrupted

- Event Ordering: Maintains consistent ordering of change events
