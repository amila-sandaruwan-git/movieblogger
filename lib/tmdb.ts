// lib/tmdb.ts - Updated version with banner support
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  credits?: {
    cast: Array<{
      name: string;
      character: string;
    }>;
    crew: Array<{
      name: string;
      job: string;
    }>;
  };
  original_language: string;
  spoken_languages?: Array<{
    english_name: string;
    iso_639_1: string;
    name: string;
  }>;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }>;
  };
  imdb_id: string | null;
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

export const tmdbClient = {
  async searchMovies(query: string): Promise<TMDBMovie[]> {
    if (!query.trim() || !TMDB_API_KEY) {
      console.warn('Cannot search movies: No query or API key');
      return [];
    }

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`
      );

      if (!response.ok) {
        throw new Error('Failed to search movies');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  },

  async getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
    if (!TMDB_API_KEY) {
      console.warn('Cannot fetch movie details: No API key');
      return null;
    }

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits,videos`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  },

  getPosterUrl(posterPath: string | null, size: string = 'w500'): string {
    if (!posterPath) return '';
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
  },

  getBackdropUrl(backdropPath: string | null, size: string = 'w1280'): string {
    if (!backdropPath) return '';
    return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
  },

  formatRuntime(minutes: number | null): { hours: number; minutes: number } {
    if (!minutes) return { hours: 0, minutes: 0 };
    
    return {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60
    };
  }
};