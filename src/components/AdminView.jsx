import React, { useState, useMemo } from 'react';
import { Layout, Grid, BarChart } from 'lucide-react';
import EnhancedAdminGallery from './EnhancedAdminGallery';
import AdminDashboard from './AdminDashboard';

const AdminView = ({
                       photos,
                       challenges,
                       onExportData,
                       onRefreshData
                   }) => {
    const [activeTab, setActiveTab] = useState('gallery');
    const API_URL = 'http://slyrix.com:3001/api';
    const users = useMemo(() => {
        return [...new Set(photos.map(photo => photo.uploadedBy))];
    }, [photos]);

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-4 justify-center mb-6">
                <button
                    onClick={() => setActiveTab('gallery')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-colors ${
                        activeTab === 'gallery'
                            ? 'bg-wedding-purple text-white'
                            : 'bg-white text-wedding-purple hover:bg-wedding-purple hover:text-white'
                    }`}
                >
                    <Grid className="w-4 h-4" />
                    <span>Photo Gallery</span>
                </button>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-colors ${
                        activeTab === 'dashboard'
                            ? 'bg-wedding-purple text-white'
                            : 'bg-white text-wedding-purple hover:bg-wedding-purple hover:text-white'
                    }`}
                >
                    <BarChart className="w-4 h-4" />
                    <span>Dashboard</span>
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                {activeTab === 'gallery' ? (
                    <EnhancedAdminGallery
                        photos={photos}
                        onExportData={onExportData}
                        onRefreshData={onRefreshData}
                    />
                ) : (
                    <AdminDashboard
                        photos={photos}
                        users={users} // Pass the users array
                        challenges={challenges}
                        onExportData={onExportData}
                        onRefreshData={onRefreshData}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminView;