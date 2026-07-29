'use client';
import { useEffect, useState } from 'react';
import { Check, X, Trash2, Star, MessageSquare, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

// ── Star renderer ──────────────────────────────────────────────────────────────
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}

// ── Rating bar row (for summary) ───────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-gray-400 text-right">{star}</span>
      <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
      <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-gray-400 text-right text-xs">{count}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data.reviews);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load reviews');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (id: string, is_approved: boolean) => {
    try {
      await api.patch(`/reviews/${id}/approve`, { is_approved });
      toast.success(is_approved ? 'Review approved ✓' : 'Review hidden');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to update review status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
      : '0.0';
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));
  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  const filtered =
    filter === 'pending'
      ? reviews.filter((r) => !r.is_approved)
      : filter === 'approved'
      ? reviews.filter((r) => r.is_approved)
      : reviews;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reviews Management</h1>
        {pendingCount > 0 && (
          <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold border border-yellow-500/30">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average rating card */}
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center justify-center gap-2 col-span-1">
          <span className="text-5xl font-black text-white">{avgRating}</span>
          <StarRating rating={Math.round(Number(avgRating))} size={20} />
          <span className="text-xs text-gray-500 mt-1">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Rating distribution */}
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col justify-center gap-2 col-span-1">
          {starCounts.map(({ star, count }) => (
            <RatingBar key={star} star={star} count={count} total={totalReviews} />
          ))}
        </div>

        {/* Quick stats */}
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col justify-center gap-4 col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Reviews</p>
              <p className="text-lg font-bold text-white">{totalReviews}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Check size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-lg font-bold text-white">
                {reviews.filter((r) => r.is_approved).length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <TrendingUp size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Approval</p>
              <p className="text-lg font-bold text-white">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              filter === tab
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-card text-gray-400 border border-border hover:text-white hover:border-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reviews table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filtered.map((review) => (
                <tr
                  key={review.id}
                  className="hover:bg-elevated/30 transition-colors group"
                >
                  {/* Student */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {review.user_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {review.user_name}
                      </span>
                    </div>
                  </td>

                  {/* Item */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {review.item_name}
                  </td>

                  {/* ⭐ Star rating */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <StarRating rating={review.rating} size={15} />
                      <span className="text-xs text-gray-500">{review.rating} / 5</span>
                    </div>
                  </td>

                  {/* Comment */}
                  <td className="px-6 py-4 text-sm text-gray-400 max-w-xs">
                    <p className="line-clamp-2">{review.comment || '—'}</p>
                  </td>

                  {/* Status badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${
                        review.is_approved
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {review.is_approved ? (
                        <>
                          <Check size={11} />
                          Approved
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                          Pending
                        </>
                      )}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {!review.is_approved ? (
                        <button
                          onClick={() => handleApprove(review.id, true)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all"
                          title="Approve"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(review.id, false)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 transition-all"
                          title="Hide"
                        >
                          <X size={14} />
                          Hide
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Star size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">No reviews found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
