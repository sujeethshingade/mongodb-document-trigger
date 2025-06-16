// MongoDB Change Stream Trigger for Audit Logging - Atlas App Services Version
exports = async function(changeEvent) {
    try {
        const collectionName = changeEvent.ns?.coll || changeEvent.namespace?.collection; // Get the collection name from the change event
        if (!collectionName || collectionName.endsWith("_logs")) return; // Skip logging for log collections to prevent infinite loops

        const mongodb = context.services.get("mongodb-atlas"); // Atlas App Services uses "mongodb-atlas" as default service name
        const logsCollection = mongodb.db("test").collection(`${collectionName}_logs`); // Adjust database name as needed
        
        const { operationType } = changeEvent; // Get the operation type from the change event
        const documentId = (changeEvent.documentKey?._id || changeEvent.fullDocument?._id || changeEvent.fullDocumentBeforeChange?._id || "Unknown").toString(); // Get the document ID from the change event, fallback to "Unknown" if not available
        const doc = changeEvent.fullDocument || changeEvent.fullDocumentBeforeChange; // Get the full document from the change event, either current or before change
        const updatedBy = doc?.updatedBy || doc?.name || "System"; // Get the user who updated the document, fallback to "System" if not available
        const timestamp = new Date(); // Create timestamp for when this audit log entry is being created
        const logEntries = []; // Array to store all the individual field change log entries
        const excludedFields = ['_id', '__v', 'updatedAt']; // Fields to exclude from logging

        // Helper function to create and add a new audit log entry for a specific field change
        const addLog = (field, oldValue, newValue) => 
            logEntries.push({ documentId, operationType, changedFields: field, oldValue, newValue, updatedBy, timestamp });

        // Helper function to check if a value is meaningful (not null, undefined, empty string, or empty object)
        const isMeaningfulValue = (value) => {
            if (value === null || value === undefined || value === '') return false;
            if (typeof value === 'object' && !Array.isArray(value)) {
                // Check if object is empty or all values are null/undefined/empty
                const keys = Object.keys(value);
                if (keys.length === 0) return false;
                return keys.some(key => isMeaningfulValue(value[key]));
            }
            return true;
        };

        // Helper function to handle nested objects dynamically
        const processNestedObject = (fieldName, oldObj, newObj, prefix = "", isInsert = false, isDelete = false) => {
            const oldObject = oldObj || {};
            const newObject = newObj || {};
            
            // Get all possible field names from both objects
            const allFields = new Set([...Object.keys(oldObject), ...Object.keys(newObject)]);
            
            for (const subField of allFields) {
                if (excludedFields.includes(subField)) continue;
                
                const oldValue = oldObject[subField];
                const newValue = newObject[subField];
                
                if (isInsert) {
                    if (isMeaningfulValue(newValue)) {
                        const fullFieldName = prefix ? `${prefix}.${subField}` : `${fieldName}.${subField}`;
                        
                        // Check if this is another nested object that needs further processing
                        if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
                            processNestedObject(subField, null, newValue, fullFieldName, true, false);
                        } else {
                            addLog(fullFieldName, null, newValue);
                        }
                    }
                } 
                else if (isDelete) {
                    if (isMeaningfulValue(oldValue)) {
                        const fullFieldName = prefix ? `${prefix}.${subField}` : `${fieldName}.${subField}`;
                        
                        // Check if this is another nested object that needs further processing
                        if (typeof oldValue === 'object' && oldValue !== null && !Array.isArray(oldValue)) {
                            processNestedObject(subField, oldValue, null, fullFieldName, false, true);
                        } else {
                            addLog(fullFieldName, oldValue, null);
                        }
                    }
                }
                else {
                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                        const fullFieldName = prefix ? `${prefix}.${subField}` : `${fieldName}.${subField}`;
                        
                        // Check if this is another nested object that needs further processing
                        if (typeof oldValue === 'object' && typeof newValue === 'object' &&
                            oldValue !== null && newValue !== null && 
                            !Array.isArray(oldValue) && !Array.isArray(newValue)) {
                            processNestedObject(subField, oldValue, newValue, fullFieldName, false, false);
                        } else {
                            addLog(fullFieldName, oldValue, newValue);
                        }
                    }
                }
            }
        };

        // Loop through each field in the inserted document and create audit entries (oldValue = null for created fields)
        if (operationType === "insert" && changeEvent.fullDocument) {
            for (const [field, value] of Object.entries(changeEvent.fullDocument)) {
                // Skip excluded fields
                if (excludedFields.includes(field)) continue;
                
                if (isMeaningfulValue(value)) {
                    // Handle nested objects dynamically
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        // Process any nested object with isInsert flag
                        processNestedObject(field, null, value, "", true, false);
                    } else {
                        // For primitive values and arrays
                        addLog(field, null, value);
                    }
                }
            }
        
        // Loop through each field in the deleted document and create audit entries (newValue = null for deleted fields)
        } else if (operationType === "delete" && changeEvent.fullDocumentBeforeChange) {
            for (const [field, value] of Object.entries(changeEvent.fullDocumentBeforeChange)) {
                if (excludedFields.includes(field)) continue;
                
                if (isMeaningfulValue(value)) {
                    // Handle nested objects dynamically
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        processNestedObject(field, value, null, "", false, true);
                    } else {
                        addLog(field, value, null);
                    }
                }
            }

        // Loop through each field in the updated document and create audit entries for changed fields
        } else if ((operationType === "update" || operationType === "replace") && changeEvent.fullDocument && changeEvent.fullDocumentBeforeChange) {
            const allFields = new Set([...Object.keys(changeEvent.fullDocumentBeforeChange), ...Object.keys(changeEvent.fullDocument)]); 
            
            allFields.forEach(field => {
                if (excludedFields.includes(field)) return; // Skip excluded fields
                const oldValue = changeEvent.fullDocumentBeforeChange[field]; // Get the old value of the field before the change
                const newValue = changeEvent.fullDocument[field]; // Get the new value of the field after the change
                
                // Only log if there's actually a change
                if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                    // Handle nested objects dynamically
                    if (typeof oldValue === 'object' && typeof newValue === 'object' &&
                        oldValue !== null && newValue !== null && 
                        !Array.isArray(oldValue) && !Array.isArray(newValue)) {
                        // For complex nested objects, do a deep comparison
                        processNestedObject(field, oldValue, newValue, "", false, false);
                    }
                    // Handle cases where one is object and other is not (or one is null)
                    else if ((typeof oldValue === 'object' && oldValue !== null && !Array.isArray(oldValue)) ||
                            (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue))) {
                        // Process as nested object (handles null to object or object to null transitions)
                        processNestedObject(field, oldValue, newValue, "", false, false);
                    }
                    // Handle primitive values and arrays
                    else {
                        addLog(field, oldValue, newValue);
                    }
                }
            });
        }

        if (logEntries.length > 0) {
            await logsCollection.insertMany(logEntries); // Insert all the log entries into the logs collection
            console.log(`Created ${logEntries.length} audit log entries`);
            return { success: true, entriesCreated: logEntries.length };
        }
        
        console.log("No changes to log");
        return { success: true, message: "No changes to log" };
    } catch (error) {
        console.error("Audit log error:", error);
        return { error: error.message };
    }
};