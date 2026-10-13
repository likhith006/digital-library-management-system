import api from './api';

export const bookService = {
  getBooks: (params) => api.get('/books', { params }),
  searchExternal: (query, limit = 60) => api.get('/books/external/search', { params: { query, limit } }),
  getBookById: (id) => api.get(`/books/${id}`),
  createBook: (bookData) => api.post('/books', bookData),
  updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
  deleteBook: (id) => api.delete(`/books/${id}`),
};

