export default function Main() {
    return (

        
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          MongoDB Document Trigger Application
        </h1>
        
        <div className="prose lg:prose-lg">
          <p>
            This application demonstrates the use of MongoDB Atlas triggers to track changes
            in documents and maintain an audit log.
          </p>
          
          <h2>Features:</h2>
          <ul>
            <li>Create, update, and delete user records</li>
            <li>MongoDB Atlas triggers capture document changes</li>
            <li>Pre-image and post-image are stored for each change</li>
            <li>All changes are recorded in an audit log</li>
            <li>View audit history for all document changes</li>
          </ul>
          
          <div className="mt-8 flex gap-4">
            <a href="/users" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Manage Users
            </a>
            <a href="/audit-logs" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
              View Audit Logs
            </a>
          </div>
        </div>
      </div>
    );
  }