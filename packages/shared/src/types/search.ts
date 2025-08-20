export interface Search {
	userKey: string;
	query: string;
	createdAt: Date;
}

export interface SearchWithId extends Search {
	_id: string;
}

export interface LibraryFilters {
	q: string;
	sort: "rating_asc" | "rating_desc" | "";
	withReview: boolean;
}

export const SEARCH_CONSTRAINTS = {
	QUERY: {
		MIN_LENGTH: 1,
		MAX_LENGTH: 200,
	},
	MAX_RECENT_SEARCHES: 10,
} as const;

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
	q: "",
	sort: "",
	withReview: false,
};
