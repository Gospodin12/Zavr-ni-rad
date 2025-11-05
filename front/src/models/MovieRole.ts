import type { Movie } from "./Movie";
import type { User } from "./User";

export interface MovieRole {
  user: User;
  movie: Movie;
  role: number;
  character?: string | null;
}
