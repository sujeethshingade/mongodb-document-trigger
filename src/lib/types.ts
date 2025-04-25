export interface User {
  _id?: string;
  name: string;
  email: string;
  role: string;
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
}