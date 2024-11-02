import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Calendar, User, Grid, List } from 'lucide-react';

const EnhancedAdminGallery = ({ photos }) => {
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        date: 'all',
        uploader: 'all',
        type: 'all',
        isOpen: false
    });
    const API_URL = 'http://slyrix.com:3001/api';


    const [sortBy, setSortBy] = useState('newest');

    // Get unique values for filters
    const filterOptions = useMemo(() => {
        return {
            dates: [...new Set(photos.map(photo =>
                new Date(photo.uploadDate || photo.createdAt).toLocaleDateString()))],
            uploaders: [...new Set(photos.map(photo => photo.uploadedBy))],
            types: [...new Set(photos.map(photo =>
                photo.uploadType || (photo.challengeId ? 'Challenge' : 'General')))]
        };
    }, [photos]);

    // Filter and sort photos
    const filteredPhotos = useMemo(() => {
        return photos
            .filter(photo => {
                const matchesSearch = photo.uploadedBy.toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const matchesDate = filters.date === 'all' ||
                    new Date(photo.uploadDate || photo.createdAt).toLocaleDateString() === filters.date;
                const matchesUploader = filters.uploader === 'all' ||
                    photo.uploadedBy === filters.uploader;
                const matchesType = filters.type === 'all' ||
                    (photo.uploadType || (photo.challengeId ? 'Challenge' : 'General')) === filters.type;

                return matchesSearch && matchesDate && matchesUploader && matchesType;
            })
            .sort((a, b) => {
                if (sortBy === 'newest') {
                    return new Date(b.uploadDate || b.createdAt) - new Date(a.uploadDate || a.createdAt);
                } else if (sortBy === 'oldest') {
                    return new Date(a.uploadDate || a.createdAt) - new Date(b.uploadDate || b.createdAt);
                }
                return 0;
            });
    }, [photos, searchTerm, filters, sortBy]);

    return (
        <div className="space-y-6">
            {/* Search and Filters Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-wedding-purple-light w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by guest name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-full border border-wedding-purple-light/30 focus:ring-2 focus:ring-wedding-purple focus:border-transparent"
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setFilters(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-wedding-purple text-white hover:bg-wedding-purple-dark transition-colors"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                </button>

                {/* View Toggle */}
                <div className="flex gap-2 p-1 bg-wedding-accent-light rounded-full">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-full transition-colors ${
                            viewMode === 'grid'
                                ? 'bg-wedding-purple text-white'
                                : 'text-wedding-purple hover:bg-wedding-purple-light/20'
                        }`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-full transition-colors ${
                            viewMode === 'list'
                                ? 'bg-wedding-purple text-white'
                                : 'text-wedding-purple hover:bg-wedding-purple-light/20'
                        }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {filters.isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    {/* Date Filter */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-wedding-purple-dark">
                            <Calendar className="w-4 h-4" />
                            <span>Date</span>
                        </label>
                        <select
                            value={filters.date}
                            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full rounded-lg border-wedding-purple-light/30 focus:ring-wedding-purple"
                        >
                            <option value="all">All Dates</option>
                            {filterOptions.dates.map(date => (
                                <option key={date} value={date}>{date}</option>
                            ))}
                        </select>
                    </div>

                    {/* Uploader Filter */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-wedding-purple-dark">
                            <User className="w-4 h-4" />
                            <span>Guest</span>
                        </label>
                        <select
                            value={filters.uploader}
                            onChange={(e) => setFilters(prev => ({ ...prev, uploader: e.target.value }))}
                            className="w-full rounded-lg border-wedding-purple-light/30 focus:ring-wedding-purple"
                        >
                            <option value="all">All Guests</option>
                            {filterOptions.uploaders.map(uploader => (
                                <option key={uploader} value={uploader}>{uploader}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Options */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-wedding-purple-dark">
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Sort By</span>
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full rounded-lg border-wedding-purple-light/30 focus:ring-wedding-purple"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Photos Grid/List View */}
            <div className={viewMode === 'grid'
                ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                : "space-y-4"
            }>
                {filteredPhotos.map((photo) => (
                    <div
                        key={photo.id}
                        className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                            viewMode === 'list' ? 'flex items-center gap-4' : ''
                        }`}
                    >
                        <img
                            src={`${photo.url || `${API_URL}/uploads/${photo.filename}`}`}
                            alt={`Uploaded by ${photo.uploadedBy}`}
                            className={viewMode === 'grid'
                                ? "w-full aspect-square object-cover"
                                : "w-24 h-24 object-cover"
                            }
                            onClick={() => photo.onSelect && photo.onSelect(photo)}
                        />
                        <div className="p-3">
                            <p className="font-medium text-wedding-purple-dark">
                                {photo.uploadedBy}
                            </p>
                            <p className="text-xs text-wedding-purple-light">
                                {new Date(photo.uploadDate || photo.createdAt).toLocaleString()}
                            </p>
                            {viewMode === 'list' && (
                                <p className="text-sm text-wedding-purple mt-1">
                                    {photo.uploadType || (photo.challengeId ? `Challenge #${photo.challengeId}` : 'General Upload')}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredPhotos.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-wedding-purple-light">No photos match your filters</p>
                </div>
            )}
        </div>
    );
};

export default EnhancedAdminGallery;