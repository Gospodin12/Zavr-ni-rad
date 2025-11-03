import axios from "axios";

const API_URL = "http://localhost:3000/movies";

export interface AddMovieResponse {
  success: boolean;
  message: string;
  movie: {
    _id: string;
    name: string;
    description?: string;
    picture?: string;
  };
}

/** 🧩 Get all movies for logged-in user */
export async function getMyMovies(token: string) {
  const response = await axios.get(`${API_URL}/my-movies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.movies;
}

export async function getNotMyMovies(token: string) {
  const response = await axios.get(`${API_URL}/not-my-movies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.movies;
}
/** 🎬 Add new movie (only for directors — role 1) */
export async function addMovie(
  token: string,
  name: string,
  description?: string,
  picture?: File
): Promise<AddMovieResponse> {
  const formData = new FormData();
  formData.append("name", name);
  if (description) formData.append("description", description);
  if (picture) formData.append("picture", picture);

  const response = await axios.post(`${API_URL}/add`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  // ✅ Now returns structured AddMovieResponse
  return response.data as AddMovieResponse;
}

export async function getMovieById(token: string, movieId: string) {
  const response = await axios.get(`${API_URL}/${movieId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.movie;
}

export async function getUserRoleForMovie(token: string, movieId: string) {
  const response = await axios.get(`${API_URL}/${movieId}/my-role`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}


export async function getUsersForMovie(token: string, movieId: string) {
  const response = await axios.get(`${API_URL}/${movieId}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}


export async function getFREEUsersForMovie(token: string, movieId: string) {
  const response = await axios.get(`${API_URL}/${movieId}/available-users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/** 🎭 Assign a user to a movie (director adds someone to film) */
export async function assignUserToMovie(
  token: string,
  movieId: string,
  userId: string,
  role: number,
  character?: string
) {
  const response = await axios.post(
    `${API_URL}/${movieId}/assign-role`,
    { userId, role, character },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

