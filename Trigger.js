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
      preImage: null,
      postImage: null
    };
    
    if (operationType === "insert") {
      auditLog.postImage = changeEvent.fullDocument;
    } 
    else if (operationType === "update" || operationType === "replace") {
      auditLog.postImage = changeEvent.fullDocument;
      
      if (changeEvent.fullDocumentBeforeChange) {
        auditLog.preImage = changeEvent.fullDocumentBeforeChange;
      }
    } 
    else if (operationType === "delete") {
      if (changeEvent.fullDocumentBeforeChange) {
        auditLog.preImage = changeEvent.fullDocumentBeforeChange;
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