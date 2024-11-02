import React, { useState, useMemo } from 'react';
import {
    Users, Camera, Heart, MessageCircle, TrendingUp,
    Calendar, Download, Filter, RefreshCw, Search,
    Trash2, Edit, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const AdminDashboard = ({
                            photos = [],
                            users = [],
                            challenges = [],
                            onExportData,
                            onRefreshData,
                            onDeletePhoto,
                            onUpdateChallenge
                        }) => {
    const [timeRange, setTimeRange] = useState('week');
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChallenge, setSelectedChallenge] = useState(null);

    // Continue from previous stats calculation...
// In AdminDashboard.jsx
    const stats = useMemo(() => {
        const now = new Date();
        const timeRangeFilter = (date) => {
            const photoDate = new Date(date);
            switch (timeRange) {
                case 'day':
                    return photoDate.getDate() === now.getDate();
                case 'week':
                    return (now - photoDate) / (1000 * 60 * 60 * 24) <= 7;
                case 'month':
                    return photoDate.getMonth() === now.getMonth();
                default:
                    return true;
            }
        };

        const filteredPhotos = photos.filter(p =>
            timeRangeFilter(p.uploadDate || p.createdAt)
        );

        return {
            // Basic Stats
            totalPhotos: filteredPhotos.length,
            totalUsers: new Set(filteredPhotos.map(p => p.uploadedBy)).size,

            // Photos per Challenge stats
            photosPerChallenge: challenges.map(c => ({
                name: c.title,
                count: filteredPhotos.filter(p => p.challengeId === c.id).length
            })),

            // Upload trends over time
            uploadsOverTime: Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return {
                    date: date.toLocaleDateString(),
                    uploads: filteredPhotos.filter(p =>
                        new Date(p.uploadDate || p.createdAt).getDate() === date.getDate()
                    ).length
                };
            }).reverse(),

            // User engagement stats
            userEngagement: users.map(user => ({
                name: user,
                photos: photos.filter(p => p.uploadedBy === user).length,
                challenges: new Set(photos
                    .filter(p => p.uploadedBy === user && p.challengeId)
                    .map(p => p.challengeId)).size,
                lastActive: new Date(
                    Math.max(...photos
                        .filter(p => p.uploadedBy === user)
                        .map(p => new Date(p.uploadDate || p.createdAt))
                    )
                )
            })),

            // Challenge completion stats
            challengeCompletion: challenges.map(challenge => ({
                name: challenge.title,
                completed: users.filter(user =>
                    photos.some(p => p.uploadedBy === user && p.challengeId === challenge.id)
                ).length,
                total: users.length
            })),

            // Overall stats
            avgPhotosPerUser: filteredPhotos.length / Math.max(new Set(filteredPhotos.map(p => p.uploadedBy)).size, 1),
            avgChallengesPerUser: users.reduce((acc, user) => {
                const userChallenges = new Set(photos
                    .filter(p => p.uploadedBy === user && p.challengeId)
                    .map(p => p.challengeId)).size;
                return acc + userChallenges;
            }, 0) / Math.max(users.length, 1),

            // Most active times
            activeHours: Array.from({ length: 24 }, (_, hour) => ({
                hour,
                count: filteredPhotos.filter(p =>
                    new Date(p.uploadDate || p.createdAt).getHours() === hour
                ).length
            })),

            // Challenge participation rate
            challengeParticipation: (users.filter(user =>
                photos.some(p => p.uploadedBy === user && p.challengeId)
            ).length / Math.max(users.length, 1)) * 100
        };
    }, [photos, challenges, users, timeRange]);
    const renderCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Upload Trends Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-purple-light/20">
                <h3 className="text-lg font-medium text-wedding-purple-dark mb-4">Upload Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.uploadsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="uploads"
                            stroke="#5603AD"
                            strokeWidth={2}
                            dot={{ fill: '#5603AD' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Challenge Completion Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-purple-light/20">
                <h3 className="text-lg font-medium text-wedding-purple-dark mb-4">Challenge Completion</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.challengeCompletion}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                            }}
                        />
                        <Bar dataKey="completed" fill="#93C572" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
    const calculateUploadTrends = (photos) => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => ({
            date: new Date(date).toLocaleDateString(),
            uploads: photos.filter(photo => {
                const photoDate = new Date(photo.uploadDate || photo.createdAt)
                    .toISOString().split('T')[0];
                return photoDate === date;
            }).length
        }));
    };
    const renderUserManagement = () => (
        <div className="bg-white rounded-lg shadow-sm border border-wedding-purple-light/20 overflow-hidden">
            <div className="p-4 border-b border-wedding-purple-light/20">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-wedding-purple-dark">User Activity</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wedding-purple-light" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-full border border-wedding-purple-light/30 focus:ring-2 focus:ring-wedding-purple text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                    <tr className="bg-wedding-accent-light">
                        <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">User</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">Photos</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">Challenges Completed</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">Last Active</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {stats.userEngagement
                        .filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(user => (
                            <tr key={user.name} className="border-t border-wedding-purple-light/10">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-wedding-purple-light/20 flex items-center justify-center">
                        <span className="text-wedding-purple font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                                        </div>
                                        <span className="text-wedding-purple-dark">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-wedding-purple">{user.photos}</td>
                                <td className="px-4 py-3 text-wedding-purple">{user.challenges}</td>
                                <td className="px-4 py-3 text-wedding-purple-light">
                                    {new Date(
                                        Math.max(...photos
                                            .filter(p => p.uploadedBy === user.name)
                                            .map(p => new Date(p.uploadDate || p.createdAt))
                                        )
                                    ).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button className="text-wedding-purple-light hover:text-wedding-purple">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="text-red-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderChallengeManagement = () => (
        <div className="bg-white rounded-lg shadow-sm border border-wedding-purple-light/20 overflow-hidden">
            <div className="p-4 border-b border-wedding-purple-light/20">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-wedding-purple-dark">Challenge Management</h3>
                    <button
                        onClick={() => setSelectedChallenge(null)}
                        className="px-4 py-2 rounded-lg bg-wedding-purple text-white hover:bg-wedding-purple-dark transition-colors"
                    >
                        <span>Create Challenge</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-wedding-accent-light">
                            <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">Challenge</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">Description</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">Start Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">End Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-wedding-purple">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {challenges.map(challenge => (
                            <tr key={challenge.id} className="border-t border-wedding-purple-light/10">
                                <td className="px-4 py-3 text-wedding-purple-dark">{challenge.title}</td>
                                <td className="px-4 py-3 text-wedding-purple">{challenge.description}</td>
                                <td className="px-4 py-3 text-wedding-purple-light">
                                    {new Date(challenge.startDate).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-wedding-purple-light">
                                    {new Date(challenge.endDate).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedChallenge(challenge)}
                                            className="text-wedding-purple-light hover:text-wedding-purple"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteChallenge(challenge.id)}
                                            className="text-red-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    const renderStats = () => (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-purple-light/20">
                    <div className="flex items-center justify-between">
                        <Camera className="w-8 h-8 text-wedding-purple" />
                        <span className="text-2xl font-bold text-wedding-purple">
                        {stats.totalPhotos}
                    </span>
                    </div>
                    <p className="text-wedding-purple-light mt-2">Total Photos</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-purple-light/20">
                    <div className="flex items-center justify-between">
                        <Users className="w-8 h-8 text-wedding-purple" />
                        <span className="text-2xl font-bold text-wedding-purple">
                        {stats.totalUsers}
                    </span>
                    </div>
                    <p className="text-wedding-purple-light mt-2">Active Users</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-purple-light/20">
                    <div className="flex items-center justify-between">
                        <TrendingUp className="w-8 h-8 text-wedding-purple" />
                        <span className="text-2xl font-bold text-wedding-purple">
                        {stats.avgPhotosPerUser.toFixed(1)}
                    </span>
                    </div>
                    <p className="text-wedding-purple-light mt-2">Avg Photos/User</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-purple-light/20">
                    <div className="flex items-center justify-between">
                        <Heart className="w-8 h-8 text-wedding-purple" />
                        <span className="text-2xl font-bold text-wedding-purple">
                        {Math.round(stats.challengeParticipation)}%
                    </span>
                    </div>
                    <p className="text-wedding-purple-light mt-2">Challenge Participation</p>
                </div>
            </div>

            {/* Additional Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Challenges Stats */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-purple-light/20">
                    <h3 className="text-lg font-medium text-wedding-purple-dark mb-4">Challenge Statistics</h3>
                    <div className="space-y-4">
                        {stats.photosPerChallenge.map(challenge => (
                            <div key={challenge.name} className="flex justify-between items-center">
                                <span className="text-wedding-purple">{challenge.name}</span>
                                <span className="text-wedding-purple-dark font-medium">{challenge.count} photos</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Hours */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-wedding-purple-light/20">
                    <h3 className="text-lg font-medium text-wedding-purple-dark mb-4">Active Hours</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.activeHours}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="hour" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip
                                contentStyle={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="count" fill="#5603AD" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderControls = () => (
        <div className="flex flex-wrap gap-4 mb-8">
            <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 rounded-lg border border-wedding-purple-light/30 focus:ring-2 focus:ring-wedding-purple text-wedding-purple"
            >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
            </select>

            <button
                onClick={onRefreshData}
                className="px-4 py-2 rounded-lg bg-wedding-purple text-white hover:bg-wedding-purple-dark transition-colors flex items-center gap-2"
            >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Data</span>
            </button>

            <button
                onClick={onExportData}
                className="px-4 py-2 rounded-lg bg-wedding-green text-white hover:bg-wedding-green-dark transition-colors flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
            </button>
        </div>
    );
    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-wedding-purple-light/20">
                {['overview', 'stats', 'users', 'challenges', 'settings'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 -mb-px text-sm font-medium capitalize transition-colors ${
                            activeTab === tab
                                ? 'border-b-2 border-wedding-purple text-wedding-purple'
                                : 'text-wedding-purple-light hover:text-wedding-purple'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Controls */}
            {renderControls()}

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <>
                    {renderCharts()}
                </>
            )}

            {activeTab === 'stats' && renderStats()}

            {activeTab === 'users' && renderUserManagement()}

            {activeTab === 'challenges' && renderChallengeManagement()}
        </div>
    );
};

export default AdminDashboard;