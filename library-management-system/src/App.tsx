import { useState, useEffect } from 'react';
import { BookOpen, Users, BookCheck, Library, BarChart3 } from 'lucide-react';
import { BooksPanel } from './components/BooksPanel';
import { MembersPanel } from './components/MembersPanel';
import { CheckoutsPanel } from './components/CheckoutsPanel';
import { supabase } from './lib/supabase';

type Tab = 'dashboard' | 'books' | 'members' | 'checkouts';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalMembers: 0,
    activeCheckouts: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    const [booksResult, membersResult, checkoutsResult] = await Promise.all([
      supabase.from('books').select('total_copies, available_copies'),
      supabase.from('members').select('id', { count: 'exact' }),
      supabase.from('checkouts').select('id', { count: 'exact' }).eq('status', 'checked_out'),
    ]);

    const totalBooks = booksResult.data?.reduce((sum, book) => sum + book.total_copies, 0) || 0;
    const availableBooks = booksResult.data?.reduce((sum, book) => sum + book.available_copies, 0) || 0;

    setStats({
      totalBooks,
      availableBooks,
      totalMembers: membersResult.count || 0,
      activeCheckouts: checkoutsResult.count || 0,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Library className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Library Management System</h1>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === 'books'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Books
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-5 h-5" />
              Members
            </button>
            <button
              onClick={() => setActiveTab('checkouts')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === 'checkouts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookCheck className="w-5 h-5" />
              Checkouts
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Books</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Available</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.availableBooks}</p>
                  </div>
                  <BookCheck className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Members</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
                  </div>
                  <Users className="w-12 h-12 text-orange-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Checkouts</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeCheckouts}</p>
                  </div>
                  <BookCheck className="w-12 h-12 text-red-600 opacity-20" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('books')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
                >
                  <BookOpen className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Manage Books</h4>
                  <p className="text-sm text-gray-600">Add, edit, or remove books from catalog</p>
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
                >
                  <Users className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Manage Members</h4>
                  <p className="text-sm text-gray-600">Register and manage library members</p>
                </button>
                <button
                  onClick={() => setActiveTab('checkouts')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
                >
                  <BookCheck className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Process Checkouts</h4>
                  <p className="text-sm text-gray-600">Check out and return books</p>
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'books' && <BooksPanel />}
        {activeTab === 'members' && <MembersPanel />}
        {activeTab === 'checkouts' && <CheckoutsPanel />}
      </main>
    </div>
  );
}

export default App;

