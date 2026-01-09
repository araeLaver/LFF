'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { GatedContent, ContentType, CreateGatedContentDto } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Loading,
} from '@/components/ui';

const CONTENT_TYPES: { value: ContentType; label: string; icon: string }[] = [
  { value: 'VIDEO', label: 'Video', icon: '🎬' },
  { value: 'IMAGE', label: 'Image', icon: '🖼️' },
  { value: 'AUDIO', label: 'Audio', icon: '🎵' },
  { value: 'DOCUMENT', label: 'Document', icon: '📄' },
  { value: 'OTHER', label: 'Other', icon: '📦' },
];

function GatedContentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [contents, setContents] = useState<GatedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('new') === 'true');
  const [editingContent, setEditingContent] = useState<GatedContent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateGatedContentDto>({
    title: '',
    description: '',
    contentType: 'OTHER',
    contentUrl: '',
    previewUrl: '',
    requiredNftContract: '',
    requiredTokenId: '',
    status: 'PUBLISHED',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (user?.role !== 'CREATOR' && user?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    fetchContents();
  }, [isAuthenticated, user]);

  const fetchContents = async () => {
    if (!isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) return;

    setIsLoading(true);
    try {
      const data = await api.getMyGatedContent();
      setContents(data);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      contentType: 'OTHER',
      contentUrl: '',
      previewUrl: '',
      requiredNftContract: '',
      requiredTokenId: '',
      status: 'PUBLISHED',
    });
    setEditingContent(null);
    setError(null);
  };

  const handleEdit = (content: GatedContent) => {
    setFormData({
      title: content.title,
      description: content.description || '',
      contentType: content.contentType,
      contentUrl: content.contentUrl || '',
      previewUrl: content.previewUrl || '',
      requiredNftContract: content.requiredNftContract || '',
      requiredTokenId: content.requiredTokenId || '',
      status: content.status,
    });
    setEditingContent(content);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await api.deleteGatedContent(id);
      setContents(contents.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('Failed to delete content');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingContent) {
        const updated = await api.updateGatedContent(editingContent.id, formData);
        setContents(contents.map((c) => (c.id === editingContent.id ? updated : c)));
      } else {
        const created = await api.createGatedContent(formData);
        setContents([created, ...contents]);
      }
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated || (user?.role !== 'CREATOR' && user?.role !== 'ADMIN')) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  const contentTypeIcon = (type: string) => {
    const found = CONTENT_TYPES.find((t) => t.value === type);
    return found?.icon || '📦';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/creator" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <span>Gated Content</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gated Content</h1>
          <p className="text-gray-600 mt-1">Manage NFT holder exclusive content</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : 'Create Content'}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card variant="bordered" className="mb-8">
          <CardHeader>
            <CardTitle>{editingContent ? 'Edit Content' : 'Create New Content'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter content title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type *
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) =>
                      setFormData({ ...formData, contentType: e.target.value as ContentType })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CONTENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your content"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content URL *
                  </label>
                  <Input
                    value={formData.contentUrl}
                    onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                    placeholder="https://... (URL to the actual content)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Direct link to your content (video, image, document, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview Image URL
                  </label>
                  <Input
                    value={formData.previewUrl}
                    onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                    placeholder="https://... (optional preview image)"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Access Requirements (Optional)</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Leave empty for public access, or specify NFT requirements for gated access.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required NFT Contract
                    </label>
                    <Input
                      value={formData.requiredNftContract}
                      onChange={(e) =>
                        setFormData({ ...formData, requiredNftContract: e.target.value })
                      }
                      placeholder="0x... (contract address)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Token ID
                    </label>
                    <Input
                      value={formData.requiredTokenId}
                      onChange={(e) =>
                        setFormData({ ...formData, requiredTokenId: e.target.value })
                      }
                      placeholder="(optional) specific token ID"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'DRAFT' | 'PUBLISHED',
                      })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : editingContent
                    ? 'Update Content'
                    : 'Create Content'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="Loading contents..." />
        </div>
      ) : contents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <Card key={content.id} variant="bordered" className="overflow-hidden">
              {content.previewUrl && (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${content.previewUrl})` }}
                />
              )}
              {!content.previewUrl && (
                <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <span className="text-5xl">{contentTypeIcon(content.contentType)}</span>
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{content.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      content.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {content.status}
                  </span>
                </div>

                {content.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{content.description}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span>{contentTypeIcon(content.contentType)}</span>
                  <span>{content.contentType}</span>
                  {content.requiredNftContract && (
                    <>
                      <span className="mx-1">|</span>
                      <span className="text-purple-600">NFT Required</span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(content)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(content.id)}
                  >
                    Delete
                  </Button>
                  <Link href={`/content/${content.id}`} className="ml-auto">
                    <Button size="sm" variant="ghost">
                      Preview
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="bordered">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No gated content yet</p>
            <Button onClick={() => setShowForm(true)}>Create Your First Content</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CreatorGatedContentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loading size="lg" text="Loading..." />
        </div>
      }
    >
      <GatedContentPageContent />
    </Suspense>
  );
}
