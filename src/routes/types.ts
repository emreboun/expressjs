export interface User {
  id: number;
  name: string;
  borrows?: Borrow[];
}

export interface Book {
  id: number;
  name: string;
  borrows?: Borrow[];
  score?: number;
}

export interface Borrow {
  id: number;
  user: User;
  userId: number;
  book: Book;
  bookId: number;
  userScore?: number | null;
  borrowDate: Date;
  returnDate?: Date | null;
}
