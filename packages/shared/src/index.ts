// Tipos de libro
export { Book, BookWithId, BookInput, BookUpdate, BOOK_CONSTRAINTS, isValidRating, isValidReview } from "./types/book.js";

// Tipos de búsqueda
export { Search, SearchWithId, LibraryFilters, SEARCH_CONSTRAINTS, DEFAULT_LIBRARY_FILTERS } from "./types/search.js";

// Tipos de API
export { ApiResponse, PaginatedResponse, LibraryApiResponse, BookApiResponse, ApiError, HTTP_STATUS, AuthData } from "./types/api.js";

// Utilidades de validación
export { ValidationResult, validateBook, validateSearchQuery, sanitizeString, isValidEmail } from "./utils/validation.js";
