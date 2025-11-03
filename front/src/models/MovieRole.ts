import type { Movie } from "./Movie";

export interface MovieRole {
  movie: Movie;
  role: number;
  character?: string | null;
}
