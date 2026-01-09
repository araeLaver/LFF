'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, Button, Loading } from '@/components/ui';

export default function AdminContentPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchContents = async () => {
      if (!isAuthenticated || user?.role !== 'ADMIN') return;
      setIsLoading(true);
      try {
        const data = await api.getAdminGatedContent(page, 20);
        setContents(data.contents);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Failed to fetch contents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContents();
  }, [isAuthenticated, user, page]);

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return;
    }
    try {
      await api.deleteAdminGatedContent(contentId);
      setContents((prev) => prev.filter((c) => c.id !== contentId));
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('Failed to delete content');
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  const contentTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return '🎬';
      case 'IMAGE': return '🖼️';
      case 'AUDIO': return '🎵';
      case 'DOCUMENT': return '📄';
      default: return '📦';
    }
  };

  const statusColor = (status: string) => {
    return status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/admin" className="hover:text-blue-600">Admin</Link>
        <span>/</span>
        <span>Gated Content</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Content Moderation</h1>

      <Card variant="bordered">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Loading text="Loading content..." />
            </div>
          ) : contents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No gated content found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Content</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Creator</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contents.map((content) => (
                    <tr key={content.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {content.previewUrl && (
                            <img src={content.previewUrl} alt="" className="w-10 h-10 rounded object-cover" />
                          )}
                          <div>
                            <p className="font-medium">{content.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{content.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {content.creator?.user?.profile?.nickname || content.creator?.user?.email || 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <span>{contentTypeIcon(content.contentType)}</span>
                          <span className="text-sm">{content.contentType}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${statusColor(content.status)}`}>
                          {content.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(content.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(content.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
