export interface User {
    _id?: string;
    name: string;
    email: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface AuditLog {
    _id?: string;
    operationType: 'insert' | 'update' | 'delete';
    collectionName: string;
    documentId: string;
    timestamp: Date;
    preImage: any | null;
    postImage: any | null;
    user?: string; // If we want to track which user made the change
  }