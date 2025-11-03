import type { Note } from "./Note";
import type { User } from "./User";

export interface Comment {
  _beleska_id: Note,
  _user_id: User,
  text:String,
  created_at: string
}

