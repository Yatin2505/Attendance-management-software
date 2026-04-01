import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock, Info, CheckCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import notificationService from '../services/notificationService';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const NotificationPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling for new notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'error': return <XCircle className="w-4 h-4 text-rose-500" />;
            default: return <Info className="w-4 h-4 text-primary-500" />;
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all focus:outline-none"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] items-center justify-center text-white font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-white/10"
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                    <Bell className="w-10 h-10 mb-2 opacity-20" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50 dark:divide-white/5">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            className={`p-4 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors group relative ${!notif.isRead ? 'bg-primary-500/5' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getTypeIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className={`text-xs font-bold truncate ${!notif.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                                                            {formatTime(notif.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs leading-relaxed ${!notif.isRead ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-500'}`}>
                                                        {notif.message}
                                                    </p>
                                                    
                                                    {!notif.isRead && (
                                                        <button 
                                                            onClick={() => handleMarkAsRead(notif._id)}
                                                            className="mt-2 text-[10px] font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline group-hover:gap-1.5 transition-all"
                                                        >
                                                            Mark as read <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-full blur-[2px]" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-center">
                            <button className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
                                View all history
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationPanel;
