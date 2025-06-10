// Note: This trigger relies on pre and post images being enabled on the monitored collections.
// Note: This to be run in Mongosh Terminal after connecting to the Cluster.
/*

// Drop the existing TTL index (Time-To-Live)
db.auditLogs.dropIndex("timestamp_1");

// Create new TTL index with 7-day retention (604800 seconds)
db.auditLogs.createIndex(
  { "timestamp": 1 },
  { expireAfterSeconds: 604800, name: "timestamp_1" }
);

// Verify the index was created
db.auditLogs.getIndexes()

// Setting up 7-day retention for pre/post images (requires admin privileges and M10 Cluster)
db.adminCommand({ 
  setClusterParameter: {
    changeStreamOptions: { 
      preAndPostImages: { 
        expireAfterSeconds: 604800 // 7 days in seconds
      } 
    }
  }
})

*/

// Clear data
// db.users.deleteMany({});
// db.auditLogs.deleteMany({});

    exports = async function(changeEvent) {
    console.log("Trigger Event:", JSON.stringify(changeEvent, null, 2));
    
    try {
        // Get collection name
        let collectionName;
        if (changeEvent.ns && changeEvent.ns.coll) {
        collectionName = changeEvent.ns.coll;
        } else if (changeEvent.namespace && changeEvent.namespace.collection) {
        collectionName = changeEvent.namespace.collection;
        } else {
        console.log("Unable to determine collection name");
        return;
        }
        
        // Skip if this is already a logs collection
        if (collectionName.endsWith("_logs")) {
        console.log(`Skipping logs collection: ${collectionName}`);
        return;
        }
        
        // Get the corresponding logs collection
        const logsCollectionName = `${collectionName}_logs`;
        const logsCollection = context.services
        .get("mongodb-document-trigger")
        .db("test")
        .collection(logsCollectionName);
        
        const operationType = changeEvent.operationType;
        
        // Get document ID
        let documentId = "unknown";
        if (changeEvent.documentKey && changeEvent.documentKey._id) {
        documentId = changeEvent.documentKey._id.toString();
        } else if (changeEvent.fullDocument && changeEvent.fullDocument._id) {
        documentId = changeEvent.fullDocument._id.toString();
        } else if (changeEvent.fullDocumentBeforeChange && changeEvent.fullDocumentBeforeChange._id) {
        documentId = changeEvent.fullDocumentBeforeChange._id.toString();
        }
        
        // Determine updatedBy field
        let updatedBy = "system";
        try {
        // Try to get user info from the document
        if (changeEvent.fullDocument) {
            if (changeEvent.fullDocument.email) {
            updatedBy = changeEvent.fullDocument.email;
            } else if (changeEvent.fullDocument.updatedBy) {
            updatedBy = changeEvent.fullDocument.updatedBy;
            } else if (changeEvent.fullDocument.userId) {
            updatedBy = changeEvent.fullDocument.userId;
            }
        }
        
        // Fallback to pre-change document
        if (updatedBy === "system" && changeEvent.fullDocumentBeforeChange) {
            if (changeEvent.fullDocumentBeforeChange.email) {
            updatedBy = changeEvent.fullDocumentBeforeChange.email;
            } else if (changeEvent.fullDocumentBeforeChange.updatedBy) {
            updatedBy = changeEvent.fullDocumentBeforeChange.updatedBy;
            } else if (changeEvent.fullDocumentBeforeChange.userId) {
            updatedBy = changeEvent.fullDocumentBeforeChange.userId;
            }
        }
        } catch (e) {
        console.log("Error determining updatedBy:", e.message);
        }
        
        const timestamp = new Date();
        const logEntries = [];
        
        // Helper function to create log entry
        const createLogEntry = (fieldName, oldValue, newValue) => {
        return {
            documentId: documentId,
            operationType: operationType,
            changedFields: fieldName,
            oldValue: oldValue,
            newValue: newValue,
            updatedBy: updatedBy,
            timestamp: timestamp
        };
        };
        
        // Helper function to handle nested objects (like Address)
        const processNestedObject = (fieldName, oldObj, newObj, prefix = "") => {
        const oldObject = oldObj || {};
        const newObject = newObj || {};
        
        // Get all possible field names from both objects
        const allFields = new Set([...Object.keys(oldObject), ...Object.keys(newObject)]);
        
        for (const subField of allFields) {
            const oldValue = oldObject[subField];
            const newValue = newObject[subField];
            
            // Only log if there's actually a change
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            const fullFieldName = prefix ? `${prefix}.${subField}` : subField;
            logEntries.push(createLogEntry(fullFieldName, oldValue, newValue));
            }
        }
        };
        
        // Process different operation types
        if (operationType === "insert") {
        const postImage = changeEvent.fullDocument;
        if (postImage) {
            for (const [field, value] of Object.entries(postImage)) {
            if (field === '_id') continue;
            
            // Handle nested objects
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Special handling for Address and other nested objects
                if (field === 'Address') {
                processNestedObject(field, null, value);
                } else {
                // For other nested objects, log as a single field change
                logEntries.push(createLogEntry(field, null, value));
                }
            } else if (value !== null && value !== undefined && value !== '') {
                logEntries.push(createLogEntry(field, null, value));
            }
            }
        }
        } 
        else if (operationType === "update" || operationType === "replace") {
        const preImage = changeEvent.fullDocumentBeforeChange;
        const postImage = changeEvent.fullDocument;
        
        if (preImage && postImage) {
            // Get all possible field names from both documents
            const allFields = new Set([...Object.keys(preImage), ...Object.keys(postImage)]);
            
            for (const field of allFields) {
            if (field === '_id') continue;
            
            const oldValue = preImage[field];
            const newValue = postImage[field];
            
            // Handle nested objects specially
            if (field === 'Address' && 
                (typeof oldValue === 'object' || typeof newValue === 'object')) {
                processNestedObject(field, oldValue, newValue);
            } 
            // Handle other nested objects
            else if (typeof oldValue === 'object' && typeof newValue === 'object' &&
                    oldValue !== null && newValue !== null && 
                    !Array.isArray(oldValue) && !Array.isArray(newValue)) {
                // For complex nested objects, do a deep comparison
                if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                processNestedObject(field, oldValue, newValue, field);
                }
            }
            // Handle primitive values and arrays
            else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                logEntries.push(createLogEntry(field, oldValue, newValue));
            }
            }
        }
        } 
        else if (operationType === "delete") {
        const preImage = changeEvent.fullDocumentBeforeChange;
        if (preImage) {
            for (const [field, value] of Object.entries(preImage)) {
            if (field === '_id') continue;
            
            // Handle nested objects
            if (field === 'Address' && typeof value === 'object' && value !== null) {
                processNestedObject(field, value, null);
            } else if (value !== null && value !== undefined && value !== '') {
                logEntries.push(createLogEntry(field, value, null));
            }
            }
        }
        }
        
        // Insert all log entries
        if (logEntries.length > 0) {
        const result = await logsCollection.insertMany(logEntries);
        console.log(`Successfully created ${logEntries.length} audit log entries for ${collectionName}:`, 
                    Object.values(result.insertedIds).map(id => id.toString()));
        return {
            success: true,
            collection: logsCollectionName,
            entriesCreated: logEntries.length,
            insertedIds: Object.values(result.insertedIds)
        };
        } else {
        console.log(`No changes detected for ${collectionName} document ${documentId}`);
        return { 
            success: true, 
            message: "No changes to log",
            collection: logsCollectionName
        };
        }
        
    } catch (error) {
        console.error("Error in audit trigger:", error);
        return { 
        error: error.message, 
        stack: error.stack 
        };
    }
};