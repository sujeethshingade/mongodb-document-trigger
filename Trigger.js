// Note: This trigger relies on pre and post images being enabled on the monitored collections.
// Note: The default retention period (typically 3 days) will apply.
// Note: This to be run in Mongosh Terminal after connecting to the Cluster.
/*
db.runCommand({
 collMod: "auditLogs",
 changeStreamPreAndPostImages: {
   enabled: true
 }
})
*/

// db.users.deleteMany({});
// db.auditLogs.deleteMany({});

exports = async function(changeEvent) {
  console.log(JSON.stringify(changeEvent));
  
  const auditCollection = context.services
    .get("mongodb-document-trigger")
    .db("test")
    .collection("auditLogs");
  
  const operationType = changeEvent.operationType;
  
  let collectionName;
  if (changeEvent.ns && changeEvent.ns.coll) {
    collectionName = changeEvent.ns.coll;
  } else if (changeEvent.namespace && changeEvent.namespace.collection) {
    collectionName = changeEvent.namespace.collection;
  } else {
    collectionName = "unknown";
  }
  
  if (collectionName === "auditLogs") {
    return;
  }
  
  let documentId = "unknown";
  if (changeEvent.documentKey && changeEvent.documentKey._id) {
    documentId = changeEvent.documentKey._id.toString();
  } else if (changeEvent.fullDocument && changeEvent.fullDocument._id) {
    documentId = changeEvent.fullDocument._id.toString();
  } else if (changeEvent.fullDocumentBeforeChange && changeEvent.fullDocumentBeforeChange._id) {
    documentId = changeEvent.fullDocumentBeforeChange._id.toString();
  }
  
  const auditLog = {
    operationType: operationType,
    collectionName: collectionName,
    documentId: documentId,
    timestamp: new Date(),
    changedFields: [],
    preImage: null,
    postImage: null
  };
  
  if (operationType === "insert") {
    auditLog.postImage = changeEvent.fullDocument;
    auditLog.changedFields = Object.keys(changeEvent.fullDocument).filter(key => key !== '_id');
  } 
  else if (operationType === "update" || operationType === "replace") {
    if (changeEvent.fullDocument && changeEvent.fullDocumentBeforeChange) {
      // Determine changed fields and store only those in pre/post images
      const preImage = changeEvent.fullDocumentBeforeChange;
      const postImage = changeEvent.fullDocument;
      const changedFields = [];
      const filteredPreImage = {};
      const filteredPostImage = {};
      
      // Compare fields to find changes
      for (const key in postImage) {
        if (key === '_id') continue;
        
        // Handling for Address object to track individual field changes
        if (key === 'Address' && typeof postImage[key] === 'object' && typeof preImage[key] === 'object') {
          const addressFields = ['AddressLine1', 'AddressLine2', 'City', 'State', 'Country', 'ZipCode'];
          
          let addressChanged = false;
          for (const addrField of addressFields) {
            const preValue = preImage[key][addrField];
            const postValue = postImage[key][addrField];
            
            if (JSON.stringify(preValue) !== JSON.stringify(postValue)) {
              changedFields.push(`Address.${addrField}`);
              addressChanged = true;
              
              if (!filteredPreImage[key]) filteredPreImage[key] = {};
              if (!filteredPostImage[key]) filteredPostImage[key] = {};
              
              filteredPreImage[key][addrField] = preValue;
              filteredPostImage[key][addrField] = postValue;
            }
          }
          if (addressChanged) continue;
        }
        
        // Check if the field is new or has changed
        if (!preImage.hasOwnProperty(key) || 
            JSON.stringify(preImage[key]) !== JSON.stringify(postImage[key])) {
          changedFields.push(key);
          filteredPostImage[key] = postImage[key];
          if (preImage.hasOwnProperty(key)) {
            filteredPreImage[key] = preImage[key];
          }
        }
      }
      
      // Check for deleted fields
      for (const key in preImage) {
        if (key === '_id') continue;
        if (!postImage.hasOwnProperty(key)) {
          changedFields.push(key);
          filteredPreImage[key] = preImage[key];
        }
      }
      
      auditLog.changedFields = changedFields;
      auditLog.preImage = filteredPreImage;
      auditLog.postImage = filteredPostImage;
    } else {
      // Fallback if full documents are not available
      auditLog.postImage = changeEvent.fullDocument;
      auditLog.preImage = changeEvent.fullDocumentBeforeChange;
    }
  } 
  else if (operationType === "delete") {
    if (changeEvent.fullDocumentBeforeChange) {
      auditLog.preImage = changeEvent.fullDocumentBeforeChange;
      auditLog.changedFields = Object.keys(changeEvent.fullDocumentBeforeChange).filter(key => key !== '_id');
    }
  }
  
  try {
    const result = await auditCollection.insertOne(auditLog);
    console.log(`Successfully created audit log: ${result.insertedId}`);
    return result;
  } catch (err) {
    console.log(`Failed to create audit log: ${err.message}`);
    return { error: err.message };
  }
};