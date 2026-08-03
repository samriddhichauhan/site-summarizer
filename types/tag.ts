export interface Tag {
  id: number;
  name: string;
  color?: string | null;
  createdAt: string | Date;
  _count?: {
    notes: number;
  };
}

export interface TagCreateInput {
  name: string;
  color?: string;
}
