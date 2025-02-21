import React, { useState, useEffect } from 'react';
import { Copy, X, Eye, Users, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShareDialogProps {
  shareUrl: string;
  isPublic: boolean;
  onTogglePublic: (isPublic: boolean) => void;
  onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  shareUrl,
  isPublic,
  onTogglePublic,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shareMode, setShareMode] = useState<'view' | 'collaborate'>('view');
  const [user, setUser] = useState<any>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setShowAuthForm(!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowAuthForm(!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCopy = async () => {
    try {
      // Get the share ID from the original URL
      const shareId = shareUrl.split('/').pop();
      
      // Construct the full URL using the current hostname
      const baseUrl = window.location.href.split('/').slice(0, 3).join('/');
      const urlToShare = shareMode === 'collaborate' 
        ? `${baseUrl}/collaborate/${shareId}`
        : `${baseUrl}/view/${shareId}`;
      
      await navigator.clipboard.writeText(urlToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      setSuccess('Successfully signed in!');
      setTimeout(() => {
        setShowAuthForm(false);
        onTogglePublic(true);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.href,
        },
      });

      if (signUpError) throw signUpError;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setSuccess('Account created and signed in successfully!');
      setTimeout(() => {
        setShowAuthForm(false);
        onTogglePublic(true);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const renderAuthForm = () => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sign In to Share</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
                placeholder="Enter your password"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Please wait...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderShareOptions = () => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Share Diagram</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center text-sm">
              <p className="text-gray-600">Logged in as: {user.email}</p>
              <button
                onClick={handleSignOut}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => onTogglePublic(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="public" className="text-sm">
                Make diagram public
              </label>
            </div>

            {isPublic && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShareMode('view')}
                    className={`flex-1 px-4 py-3 rounded-lg border flex items-center justify-center gap-2 transition-colors ${shareMode === 'view' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Only</span>
                  </button>
                  <button
                    onClick={() => setShareMode('collaborate')}
                    className={`flex-1 px-4 py-3 rounded-lg border flex items-center justify-center gap-2 transition-colors ${shareMode === 'collaborate' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Collaborate</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={(() => {
                      const shareId = shareUrl.split('/').pop();
                      const baseUrl = window.location.href.split('/').slice(0, 3).join('/');
                      return shareMode === 'collaborate' 
                        ? `${baseUrl}/collaborate/${shareId}`
                        : `${baseUrl}/view/${shareId}`;
                    })()}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return !user || showAuthForm ? renderAuthForm() : renderShareOptions();
};

export default ShareDialog;