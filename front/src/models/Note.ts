import type { User } from "./User";

export interface Note {
  _id: number;
  text:string;
  _film_id: number;
  title: string;
  quote: string;
  description:string;
  page: number;
  category: User;
  assignedTo: User[];
  
  createdBy: User;
  priority: string;
}
