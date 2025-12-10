import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { BookCheck, Plus, RotateCcw, Calendar, User, BookOpen } from 'lucide-react';

type Checkout = Database['public']['Tables']['checkouts']['Row'];
type Book = Database['public']['Tables']['books']['Row'];
type Member = Database['public']['Tables']['members']['Row'];

interface CheckoutWithDetails extends Checkout {
  book?: Book;
  member?: Member;
}

export function CheckoutsPanel() {
  const [checkouts, setCheckouts] = useState<CheckoutWithDetails[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_out' | 'returned'>('all');
  const [formData, setFormData] = useState({
    book_id: '',
    member_id: '',
    due_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [checkoutsResult, booksResult, membersResult] = await Promise.all([
      supabase.from('checkouts').select('*').order('checkout_date', { ascending: false }),
      supabase.from('books').select('*'),
      supabase.from('members').select('*'),
    ]);

    if (booksResult.data) setBooks(booksResult.data);
    if (membersResult.data) setMembers(membersResult.data);

    if (checkoutsResult.data) {
      const checkoutsWithDetails = checkoutsResult.data.map(checkout => ({
        ...checkout,
        book: booksResult.data?.find(b => b.id === checkout.book_id),
        member: membersResult.data?.find(m => m.id === checkout.member_id),
      }));
      setCheckouts(checkoutsWithDetails);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const checkoutData = {
      book_id: formData.book_id,
      member_id: formData.member_id,
      due_date: formData.due_date,
      status: 'checked_out',
    };

    const { error } = await supabase.from('checkouts').insert([checkoutData]);

    if (!error) {
      const book = books.find(b => b.id === formData.book_id);
      if (book && book.available_copies > 0) {
        await supabase
          .from('books')
          .update({
            available_copies: book.available_copies - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.book_id);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    }
  };

  const handleReturn = async (checkout: CheckoutWithDetails) => {
    if (confirm('Mark this book as returned?')) {
      await supabase
        .from('checkouts')
        .update({
          status: 'returned',
          return_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', checkout.id);

      const book = books.find(b => b.id === checkout.book_id);
      if (book) {
        await supabase
          .from('books')
          .update({
            available_copies: book.available_copies + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', checkout.book_id);
      }

      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      book_id: '',
      member_id: '',
      due_date: '',
    });
  };

  const availableBooks = books.filter(book => book.available_copies > 0);

  const filteredCheckouts = checkouts.filter(checkout => {
    if (filterStatus === 'all') return true;
    return checkout.status === filterStatus;
  });

  const isOverdue = (dueDate: string, returnDate: string | null) => {
    if (returnDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="text-center py-8">Loading checkouts...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('checked_out')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'checked_out'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Checked Out
          </button>
          <button
            onClick={() => setFilterStatus('returned')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'returned'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Returned
          </button>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Checkout
        </button>
      </div>

      <div className="space-y-3">
        {filteredCheckouts.map((checkout) => (
          <div
            key={checkout.id}
            className={`bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow ${
              isOverdue(checkout.due_date, checkout.return_date)
                ? 'border-l-4 border-red-500'
                : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {checkout.book?.title || 'Unknown Book'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {checkout.book?.author || 'Unknown Author'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="w-4 h-4" />
                  <span>{checkout.member?.name || 'Unknown Member'}</span>
                  <span className="text-gray-400">•</span>
                  <span>{checkout.member?.email || ''}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Checked: {new Date(checkout.checkout_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span
                      className={
                        isOverdue(checkout.due_date, checkout.return_date)
                          ? 'text-red-600 font-medium'
                          : ''
                      }
                    >
                      Due: {new Date(checkout.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  {checkout.return_date && (
                    <div className="flex items-center gap-1">
                      <RotateCcw className="w-4 h-4" />
                      <span>Returned: {new Date(checkout.return_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 text-sm rounded ${
                    checkout.status === 'checked_out'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {checkout.status === 'checked_out' ? 'Checked Out' : 'Returned'}
                </span>
                {checkout.status === 'checked_out' && (
                  <button
                    onClick={() => handleReturn(checkout)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Return
                  </button>
                )}
              </div>
            </div>
            {isOverdue(checkout.due_date, checkout.return_date) && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ This book is overdue!
              </div>
            )}
          </div>
        ))}

        {filteredCheckouts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No checkouts found
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">New Checkout</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Book *
                  </label>
                  <select
                    required
                    value={formData.book_id}
                    onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a book</option>
                    {availableBooks.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title} by {book.author} (Available: {book.available_copies})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member *
                  </label>
                  <select
                    required
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a member</option>
                    {members
                      .filter((m) => m.status === 'active')
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
