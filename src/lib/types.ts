export interface Address {
  AddressLine1?: string | null;
  AddressLine2?: string | null;
  City?: string | null;
  State?: string | null;
  Country?: string | null;
  ZipCode?: string | null;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  role?: string | null;
  Address?: Address | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuditLog {
  _id?: string;
  operationType: 'insert' | 'update' | 'delete';
  collectionName: string;
  documentId: string;
  timestamp: Date;  
  changedFields?: string[];
  preImage: any | null;
  postImage: any | null;
}