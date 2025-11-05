export interface Movie {
  _id: string;
  name: string;
  description: string;
  picture?: string;
  created_at?: string;
  roles?: { role: number; character?: string }[];
}
