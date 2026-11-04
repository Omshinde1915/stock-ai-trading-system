import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ScheduleTradeForm.css';

function ScheduleTradeForm({ symbol, analysis, timing }) {
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [myOrders, setMyOrders] = useState([]);

    function todayPlus(days) {
        const d = new Date();
        let added = 0;
        while (added < days) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0 && d.getDay() !== 6) added++;
        }
        return d.toISOString().split('T')[0];
    }

    const [form, setForm] = useState({
        quantity: analysis?.position_size || 10,
        buy_date: todayPlus(1),
        buy_time: '09:30',
        sell_date: todayPlus((timing?.holdingDays || 5) + 1),
        sell_time: '14:30',
        target_price: analysis?.target || '',
        stop_loss: analysis?.stop_loss || '',
        use_target_sl: false,
    });

    useEffect(() => {
        if (isAuthenticated) fetchMyOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, symbol]);

    const fetchMyOrders = async () => {
        try {
            const res = await api.get('/scheduled/');
            setMyOrders(res.data.filter((o) => o.symbol === symbol));
        } catch (err) {
            console.error('Failed to fetch scheduled orders:', err);
        }
    };

    const applyAITiming = () => {
        setForm((f) => ({
            ...f,
            buy_time: '09:30',
            sell_time: '14:30',
            sell_date: todayPlus((timing?.holdingDays || 5) + 1),
        }));
        toast.info('AI timing applied — you can still change it');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (form.sell_date < form.buy_date) {
            toast.error('Sell date must be after Buy date');
            return;
        }

        setLoading(true);
        try {
            await api.post('/scheduled/', {
                symbol,
                quantity: parseInt(form.quantity),
                buy_date: form.buy_date,
                buy_time: form.buy_time,
                sell_date: form.sell_date,
                sell_time: form.sell_time,
                target_price: form.use_target_sl
                    ? parseFloat(form.target_price) || null
                    : null,
                stop_loss: form.use_target_sl
                    ? parseFloat(form.stop_loss) || null
                    : null,
            });
            toast.success('✅ Order scheduled!');
            fetchMyOrders();
        } catch (err) {
            toast.error(
                err.response?.data?.detail || 'Failed to schedule'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this scheduled order?')) return;
        try {
            await api.delete(`/scheduled/${id}`);
            toast.success('Order cancelled');
            fetchMyOrders();
        } catch (err) {
            toast.error('Failed to cancel');
        }
    };

    return (
        <div className="schedule-section">
            <motion.div
                className="schedule-form-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="sched-header">
                    <h3>⏰ Schedule Trade — {symbol}</h3>
                    <button
                        className="sched-ai-btn"
                        onClick={applyAITiming}
                        type="button"
                    >
                        🤖 Use AI Timing
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="sched-login">
                        <p>Login required to schedule trades.</p>
                        <Link to="/login" className="sched-login-btn">
                            Sign In →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="sched-field">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={form.quantity}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        quantity: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="sched-group buy-group">
                            <h4>🟢 BUY Schedule</h4>
                            <div className="sched-row">
                                <div className="sched-field">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={form.buy_date}
                                        min={new Date()
                                            .toISOString()
                                            .split('T')[0]}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                buy_date: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="sched-field">
                                    <label>Time (IST)</label>
                                    <input
                                        type="time"
                                        value={form.buy_time}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                buy_time: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="sched-group sell-group">
                            <h4>🔴 SELL Schedule</h4>
                            <div className="sched-row">
                                <div className="sched-field">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={form.sell_date}
                                        min={form.buy_date}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                sell_date: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="sched-field">
                                    <label>Time (IST)</label>
                                    <input
                                        type="time"
                                        value={form.sell_time}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                sell_time: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="sched-advanced">
                            <label className="sched-checkbox">
                                <input
                                    type="checkbox"
                                    checked={form.use_target_sl}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            use_target_sl: e.target.checked,
                                        })
                                    }
                                />
                                Sell early on Target / Stop-loss?
                            </label>

                            {form.use_target_sl && (
                                <div className="sched-row">
                                    <div className="sched-field">
                                        <label>Target Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.target_price}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    target_price:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="sched-field">
                                        <label>Stop Loss</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.stop_loss}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    stop_loss:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="sched-submit-btn"
                            disabled={loading}
                        >
                            {loading ? '⏳ Scheduling...' : '⏰ Schedule Order'}
                        </button>
                    </form>
                )}
            </motion.div>

            {isAuthenticated && myOrders.length > 0 && (
                <motion.div
                    className="my-orders-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3>📅 My Scheduled Orders — {symbol}</h3>
                    <div className="orders-list">
                        {myOrders.map((order) => (
                            <div
                                key={order.id}
                                className={`order-item status-${order.status.toLowerCase()}`}
                            >
                                <div className="order-info">
                                    <div className="order-status">
                                        {order.status === 'PENDING_BUY' && '⏳'}
                                        {order.status === 'BOUGHT' && '✅'}
                                        {order.status === 'SOLD' && '🎉'}
                                        {order.status === 'CANCELLED' && '❌'}
                                        {order.status === 'FAILED' && '⚠️'}{' '}
                                        {order.status}
                                    </div>
                                    <div className="order-details">
                                        <div>
                                            🟢 Buy: {order.buy_date?.split('T')[0]}{' '}
                                            at {order.buy_time}
                                        </div>
                                        <div>
                                            🔴 Sell: {order.sell_date?.split('T')[0]}{' '}
                                            at {order.sell_time}
                                        </div>
                                        <div>📦 Qty: {order.quantity}</div>
                                    </div>
                                </div>
                                {order.status === 'PENDING_BUY' && (
                                    <button
                                        className="order-cancel-btn"
                                        onClick={() => handleCancel(order.id)}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default ScheduleTradeForm;