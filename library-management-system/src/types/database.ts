export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          isbn: string | null;
          genre: string | null;
          published_year: number | null;
          total_copies: number;
          available_copies: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author: string;
          isbn?: string | null;
          genre?: string | null;
          published_year?: number | null;
          total_copies?: number;
          available_copies?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          author?: string;
          isbn?: string | null;
          genre?: string | null;
          published_year?: number | null;
          total_copies?: number;
          available_copies?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          membership_date: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          membership_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          membership_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      checkouts: {
        Row: {
          id: string;
          book_id: string;
          member_id: string;
          checkout_date: string;
          due_date: string;
          return_date: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          member_id: string;
          checkout_date?: string;
          due_date: string;
          return_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          member_id?: string;
          checkout_date?: string;
          due_date?: string;
          return_date?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
