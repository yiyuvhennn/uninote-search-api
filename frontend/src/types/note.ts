export interface Author {
  id: number;
  name: string;
  email: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface ScoreDetail {
  titleMatch: number;
  descriptionMatch: number;
  contentMatch: number;
  popularity: number;
  recency: number;
  total: number;
}

export interface Note {
  id: number;
  title: string;
  description?: string | null;
  content?: string | null;
  fileUrl?: string | null;
  course?: string | null;
  category?: string | null;
  views?: number;
  likes?: number;
  createdAt?: string;
  updatedAt?: string;
  authorId?: number;
  author?: Author;
  tags?: Tag[];
  favorites?: unknown[];
  favoriteCount?: number;
  score?: number;
  scoreDetail?: ScoreDetail;
}

export interface SearchMeta {
  q?: string;
  course?: string;
  category?: string;
  tag?: string;
  sort: "relevance" | "latest" | "popular";
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  cache: "hit" | "miss";
}

export interface SearchResponse {
  data: Note[];
  meta: SearchMeta;
}
