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

// Legacy audit log format (for backward compatibility)
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

// New field-based audit log format (one entry per changed field)
export interface FieldAuditLog {
  _id?: string;
  documentId: string;
  operationType: 'insert' | 'update' | 'delete';
  changedFields: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
  timestamp: Date;
}

// For filtering logs
export interface LogFilter {
  documentId?: string;
  operationType?: string;
  changedFields?: string;
  updatedBy?: string;
  startDate?: Date;
  endDate?: Date;
}