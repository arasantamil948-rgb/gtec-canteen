'use client';
import { useEffect, useState } from 'react';
import { Utensils, Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import StatsCard from '../../components/StatsCard';
import StatusToggle from '../../components/StatusToggle';
import api from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { CanteenStatus } from '../../types';

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [canteenStatus, setCanteenStatus] = useState<CanteenStatus>({ is_open: false, busyness: 'low', broadcast_message: '' });
  const [broadcastInput, setBroadcastInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [avgRating, setAvgRating] = useState<string>('0.0');
  const [totalReviews, setTotalReviews] = useState<number>(0);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes, statusRes, reviewsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/stats/recent-orders'),
        api.get('/canteen/status'),
        api.get('/reviews'),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.orders);
      setCanteenStatus(statusRes.data);
      setBroadcastInput(statusRes.data.broadcast_message || '');
      const rvs: any[] = reviewsRes.data.reviews ?? [];
      setTotalReviews(rvs.length);
      setAvgRating(
        rvs.length > 0
          ? (rvs.reduce((s: number, r: any) => s + r.rating, 0) / rvs.length).toFixed(1)
          : '0.0'
      );
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useSocket('canteen:status', (data) => {
    setCanteenStatus({
      is_open: data.isOpen,
      busyness: data.busyness,
      broadcast_message: data.broadcastMessage
    });
  });

  useSocket('admin:orderUpdate', (order) => {
    // Optimistically update recent orders list
    setRecentOrders(prev => {
      const exists = prev.find(o => o.id === order.id);
      if (exists) {
        return prev.map(o => o.id === order.id ? order : o);
      }
      return [order, ...prev].slice(0, 10);
    });
    // Re-fetch stats to keep them accurate
    api.get('/admin/stats').then(res => setStats(res.data));
  });

  const handleToggleStatus = async (isOpen: boolean) => {
    try {
      await api.put('/canteen/status', { is_open: isOpen });
      toast.success(`Canteen is now ${isOpen ? 'OPEN' : 'CLOSED'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateBusyness = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await api.put('/canteen/status', { busyness: e.target.value });
      toast.success('Busyness updated');
    } catch (error) {
      toast.error('Failed to update busyness');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastInput.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setIsBroadcasting(true);
    try {
      await api.put('/canteen/broadcast', { broadcast_message: broadcastInput });
      toast.success('Broadcast sent!');
      setCanteenStatus(prev => ({ ...prev, broadcast_message: broadcastInput }));
      setBroadcastInput('');
    } catch (error) {
      toast.error('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <div className="flex items-center space-x-4 bg-card px-4 py-2 rounded-lg shadow-sm border border-border">
          <span className="text-sm font-medium text-gray-400">Canteen Status:</span>
          <StatusToggle isOpen={canteenStatus.is_open} onChange={handleToggleStatus} />
          <span className={`text-sm font-bold ${canteenStatus.is_open ? 'text-primary' : 'text-gray-500'}`}>
            {canteenStatus.is_open ? 'OPEN' : 'CLOSED'}
          </span>
          <div className="h-6 w-px bg-border mx-2"></div>
          <select 
            className="text-sm border-border bg-background text-white rounded-md focus:ring-primary focus:border-primary p-1"
            value={canteenStatus.busyness}
            onChange={handleUpdateBusyness}
          >
            <option value="low">Low Traffic</option>
            <option value="moderate">Moderate</option>
            <option value="high">High Traffic</option>
            <option value="packed">Packed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard title="Total Menu Items" value={stats?.total_items || 0} icon={Utensils} />
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/10">
            <Star size={24} className="text-yellow-400 fill-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Student Rating</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{avgRating}</span>
              <span className="text-sm text-gray-500">/ 5</span>
            </div>
            <StarRating rating={Number(avgRating)} size={13} />
            <p className="text-xs text-gray-600 mt-0.5">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Broadcast Message */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-bold text-white">Broadcast Message</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-400 mb-4">Send a push notification and update the banner in the app for all students.</p>
            {canteenStatus.broadcast_message && (
              <div className="mb-4 p-3 rounded bg-elevated border border-border">
                <span className="text-xs text-primary font-bold uppercase tracking-wider block mb-1">Current Active Broadcast</span>
                <p className="text-white text-sm">{canteenStatus.broadcast_message}</p>
                <button 
                  onClick={async () => {
                    try {
                      await api.put('/canteen/broadcast', { broadcast_message: '' });
                      setCanteenStatus(prev => ({...prev, broadcast_message: ''}));
                      toast.success('Broadcast cleared');
                    } catch (error) {
                      toast.error('Failed to clear broadcast');
                    }
                  }}
                  className="mt-2 text-xs text-red-500 hover:text-red-400 font-medium"
                >
                  Clear Message
                </button>
              </div>
            )}
            <textarea
              className="w-full border border-border bg-background text-white rounded-lg p-3 text-sm focus:ring-primary focus:border-primary placeholder-gray-500"
              rows={4}
              placeholder="E.g., Special meals available today!"
              value={broadcastInput}
              onChange={(e) => setBroadcastInput(e.target.value)}
            ></textarea>
            <button 
              onClick={handleSendBroadcast}
              disabled={isBroadcasting}
              className="mt-4 w-full md:w-auto flex justify-center items-center px-6 py-3 rounded-xl font-bold text-[#0D1117] bg-primary hover:bg-[#00C853] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 0 20px rgba(0,230,118,0.3)" }}
            >
              {isBroadcasting ? (
                <div className="w-5 h-5 border-2 border-[#0D1117] border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Send size={18} className="mr-2" />
              )}
              {isBroadcasting ? 'Broadcasting...' : 'Broadcast Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
