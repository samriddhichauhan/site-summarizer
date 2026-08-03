export interface Collection {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    notes: number;
  };
}

export interface CollectionCreateInput {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface CollectionUpdateInput {
  name?: string;
  color?: string;
  icon?: string;
  description?: string;
}
