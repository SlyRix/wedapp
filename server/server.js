import express from 'express';
import cors from 'cors';
import multer from 'multer';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import fs from 'fs/promises';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import {promisify} from 'util';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3001;

// Create absolute path for uploads directory
const UPLOADS_DIR = join(__dirname, 'uploads');
const THUMBNAILS_DIR = join(__dirname, 'thumbnails');

// Single CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://192.168.1.112:5173',
    'http://192.168.1.22:5173',
    'http://192.168.1.112:4173',
    'http://slyrix.com',
    'http://slyrix.com:5173',
    'http://slyrix.com:4173',
    'https://slyrix.com',
    'https://www.slyrix.com',
    'https://engagement-photos.slyrix.com',

];
app.use('/api/uploads', express.static(UPLOADS_DIR));
app.use('/api/thumbnails', express.static(THUMBNAILS_DIR));

// Make sure the directories exist on startup
const ensureDirectories = async () => {
    try {
        await Promise.all([
            fs.access(UPLOADS_DIR).catch(() => fs.mkdir(UPLOADS_DIR, { recursive: true })),
            fs.access(THUMBNAILS_DIR).catch(() => fs.mkdir(THUMBNAILS_DIR, { recursive: true }))
        ]);
        console.log('Created directories:', {
            uploads: UPLOADS_DIR,
            thumbnails: THUMBNAILS_DIR
        });
    } catch (error) {
        console.error('Error creating directories:', error);
        throw error;
    }
};
const corsOptions = {
    origin: function (origin, callback) {
        // Check if origin starts with http:// or https:// and remove it
        const normalizedOrigin = origin?.replace(/^https?:\/\//, '');
        const normalizedAllowedOrigins = allowedOrigins.map(o => o.replace(/^https?:\/\//, ''));

        if (!origin || normalizedAllowedOrigins.some(allowed => normalizedOrigin?.includes(allowed))) {
            callback(null, true);
        } else {
            console.log('Rejected Origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors());


// Body parser middleware
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));

// Directory creation function
const ensureUploadsDir = async () => {
    try {
        await fs.access(UPLOADS_DIR);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(UPLOADS_DIR, {recursive: true});
            console.log('Created uploads directory:', UPLOADS_DIR);
        }
    }
};

// Thumbnail generation functions
const generateImageThumbnail = async (inputPath, outputPath) => {
    try {
        await sharp(inputPath)
            .resize(300, 300, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({quality: 80})
            .toFile(outputPath);

        return true;
    } catch (error) {
        console.error('Error generating image thumbnail:', error);
        return false;
    }
};

const generateVideoThumbnail = async (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        // Make sure the output path ends with .jpg
        const jpgOutputPath = outputPath.replace(/\.[^/.]+$/, '.jpg');

        ffmpeg(inputPath)
            .screenshots({
                timestamps: ['1'],    // Take thumbnail at 1 second
                filename: path.basename(jpgOutputPath),
                folder: path.dirname(jpgOutputPath),
                size: '300x300',
                format: 'jpg'        // Explicitly set the output format to jpg
            })
            .outputOptions([
                '-frames:v', '1',     // Only take one frame
                '-q:v', '2'          // High quality (2 is very good, 31 is worst)
            ])
            .on('end', () => {
                console.log('Video thumbnail generated successfully:', jpgOutputPath);
                resolve(true);
            })
            .on('error', (err) => {
                console.error('Error generating video thumbnail:', err);
                resolve(false);
            });
    });
};

// Update the handleFileUpload function to use .jpg extension for video thumbnails
const handleFileUpload = async (file) => {
    // For videos, use .jpg extension for thumbnail
    const thumbnailExt = file.mimetype.startsWith('video/') ? '.jpg' : path.extname(file.filename);
    const thumbnailFilename = `thumb_${path.basename(file.filename, path.extname(file.filename))}${thumbnailExt}`;
    const thumbnailPath = join(THUMBNAILS_DIR, thumbnailFilename);
    const originalPath = join(UPLOADS_DIR, file.filename);

    let thumbnailGenerated = false;

    try {
        console.log('Processing file:', {
            filename: file.filename,
            mimetype: file.mimetype,
            thumbnailPath: thumbnailPath
        });

        if (file.mimetype.startsWith('image/')) {
            thumbnailGenerated = await generateImageThumbnail(
                originalPath,
                thumbnailPath
            );
            console.log('Image thumbnail generated:', thumbnailGenerated);
        } else if (file.mimetype.startsWith('video/')) {
            thumbnailGenerated = await generateVideoThumbnail(
                originalPath,
                thumbnailPath
            );
            console.log('Video thumbnail generated:', thumbnailGenerated);
        }

        return {
            ...file,
            thumbnailPath: thumbnailGenerated ? thumbnailFilename : null,
            mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image'
        };
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return {
            ...file,
            thumbnailPath: null,
            mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image'
        };
    }
};

// Multer configuration
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await ensureUploadsDir();
            cb(null, UPLOADS_DIR);
        } catch (error) {
            console.error('Error ensuring uploads directory:', error);
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        try {
            const timestamp = Date.now();
            const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filename = `${timestamp}_${sanitizedFilename}`;
            console.log('Generated filename:', filename);
            cb(null, filename);
        } catch (error) {
            console.error('Error generating filename:', error);
            cb(error);
        }
    }
});
// Create multer instance

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for videos
        files: 30
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            // Images
            'image/jpeg',
            'image/png',
            'image/heic',
            'image/heif',
            // Videos
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo'
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Unsupported file type'));
        }

        // For videos, enforce stricter size limit
        if (file.mimetype.startsWith('video/') && file.size > 50 * 1024 * 1024) {
            return cb(new Error('Video file size exceeds 50MB limit'));
        }

        // For images, enforce 10MB limit
        if (file.mimetype.startsWith('image/') && file.size > 10 * 1024 * 1024) {
            return cb(new Error('Image file size exceeds 10MB limit'));
        }

        cb(null, true);
    }
});

// Database initialization
let db;
const initializeDb = async () => {
    try {
        db = await open({
            filename: 'wedding_photos.db',
            driver: sqlite3.Database
        });
        await db.exec(`
            CREATE TABLE IF NOT EXISTS comments
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                photo_id
                INTEGER
                NOT
                NULL,
                user_name
                TEXT
                NOT
                NULL,
                comment_text
                TEXT
                NOT
                NULL,
                created_at
                TIMESTAMP
                DEFAULT
                CURRENT_TIMESTAMP,
                FOREIGN
                KEY
            (
                photo_id
            ) REFERENCES photos
            (
                id
            )
                );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS likes
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                photo_id
                INTEGER
                NOT
                NULL,
                user_name
                TEXT
                NOT
                NULL,
                created_at
                TIMESTAMP
                DEFAULT
                CURRENT_TIMESTAMP,
                FOREIGN
                KEY
            (
                photo_id
            ) REFERENCES photos
            (
                id
            ),
                UNIQUE
            (
                photo_id,
                user_name
            )
                );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS photos
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                filename
                TEXT
                NOT
                NULL,
                originalName
                TEXT
                NOT
                NULL,
                uploadedBy
                TEXT
                NOT
                NULL,
                uploadDate
                TEXT
                NOT
                NULL,
                description
                TEXT,
                challengeId
                INTEGER,
                challengeTitle
                TEXT,
                deviceInfo
                TEXT,
                uploadType
                TEXT
            );
        `);

        const tableInfo = await db.all(`PRAGMA table_info(photos)`);
        const columns = tableInfo.map(col => col.name);

        if (!columns.includes('thumbnailPath')) {
            await db.exec('ALTER TABLE photos ADD COLUMN thumbnailPath TEXT;');
            console.log('Added thumbnailPath column');
        }

        if (!columns.includes('mediaType')) {
            await db.exec('ALTER TABLE photos ADD COLUMN mediaType TEXT;');
            console.log('Added mediaType column');
        }

        // Create likes table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS likes
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                photo_id
                INTEGER
                NOT
                NULL,
                user_name
                TEXT
                NOT
                NULL,
                created_at
                TIMESTAMP
                DEFAULT
                CURRENT_TIMESTAMP,
                FOREIGN
                KEY
            (
                photo_id
            ) REFERENCES photos
            (
                id
            ),
                UNIQUE
            (
                photo_id,
                user_name
            )
                );
        `);

        // Create comments table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS comments
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                photo_id
                INTEGER
                NOT
                NULL,
                user_name
                TEXT
                NOT
                NULL,
                comment_text
                TEXT
                NOT
                NULL,
                created_at
                TIMESTAMP
                DEFAULT
                CURRENT_TIMESTAMP,
                FOREIGN
                KEY
            (
                photo_id
            ) REFERENCES photos
            (
                id
            )
                );
        `);

// Create voting table for challenges
        await db.exec(`
            CREATE TABLE IF NOT EXISTS votes
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                photo_id
                INTEGER
                NOT
                NULL,
                challenge_id
                INTEGER
                NOT
                NULL,
                user_name
                TEXT
                NOT
                NULL,
                created_at
                TIMESTAMP
                DEFAULT
                CURRENT_TIMESTAMP,
                FOREIGN
                KEY
            (
                photo_id
            ) REFERENCES photos
            (
                id
            ),
                UNIQUE
            (
                challenge_id,
                user_name
            )
                );
        `);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
};

const getDetailedDeviceInfo = (userAgent) => {
    let deviceType = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent) ? 'Mobile' : 'Desktop';
    let browserInfo = '';
    let deviceModel = '';

    // Get browser
    if (/Chrome/i.test(userAgent)) browserInfo = 'Chrome';
    else if (/Firefox/i.test(userAgent)) browserInfo = 'Firefox';
    else if (/Safari/i.test(userAgent)) browserInfo = 'Safari';
    else if (/Edge/i.test(userAgent)) browserInfo = 'Edge';
    else browserInfo = 'Other';

    // Get specific device
    if (/iPhone/i.test(userAgent)) deviceModel = 'iPhone';
    else if (/iPad/i.test(userAgent)) deviceModel = 'iPad';
    else if (/Android/i.test(userAgent)) {
        deviceModel = 'Android Device';
        // Try to extract specific Android device
        const match = userAgent.match(/\(([^)]+)\)/);
        if (match && match[1].includes('Android')) {
            deviceModel = match[1].split(';')[2]?.trim() || 'Android Device';
        }
    } else if (/Windows/i.test(userAgent)) deviceModel = 'Windows PC';
    else if (/Macintosh/i.test(userAgent)) deviceModel = 'Mac';
    else if (/Linux/i.test(userAgent)) deviceModel = 'Linux PC';
    else deviceModel = 'Unknown Device';

    return `${browserInfo} on ${deviceModel} (${deviceType})`;
};

// Routes
app.post('/api/upload', upload.array('files', 30), async (req, res) => {
    try {
        const uploadedFiles = req.files;
        if (!uploadedFiles || uploadedFiles.length === 0) {
            throw new Error('No files were uploaded');
        }

        const metadata = JSON.parse(req.body.metadata || '{}');
        const {
            uploadedBy = 'Unknown',
            uploadType = 'General',
            challengeId = null,
            challengeTitle = '',
            deviceInfo = 'Unknown device'
        } = metadata;

        const results = [];
        for (const file of uploadedFiles) {
            const processedFile = await handleFileUpload(file);

            const fileMetadata = {
                uploadedBy,
                uploadDate: new Date().toISOString(),
                deviceInfo,
                uploadType,
                challengeId,
                challengeTitle,
                mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
                thumbnailPath: processedFile.thumbnailPath
            };

            const result = await db.run(`
                INSERT INTO photos (filename,
                                    originalName,
                                    uploadedBy,
                                    uploadDate,
                                    description,
                                    challengeId,
                                    challengeTitle,
                                    deviceInfo,
                                    uploadType,
                                    mediaType,
                                    thumbnailPath)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                file.filename,
                file.originalname,
                uploadedBy,
                fileMetadata.uploadDate,
                JSON.stringify(fileMetadata),
                challengeId,
                challengeTitle,
                deviceInfo,
                uploadType,
                fileMetadata.mediaType,
                processedFile.thumbnailPath
            ]);

            results.push({
                id: result.lastID,
                filename: file.filename,
                ...fileMetadata
            });
        }

        res.json(results);
    } catch (error) {
        console.error('Upload processing error:', error);
        res.status(500).json({
            error: 'Error processing upload',
            details: error.message
        });
    }
});
app.post('/api/challenge-upload', upload.single('photo'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            throw new Error('No file uploaded');
        }

        // Process the file for thumbnail
        const processedFile = await handleFileUpload(file);

        const {
            uploadedBy,
            challengeId,
            challengeTitle,
            deviceInfo = 'Unknown device'
        } = req.body;

        // Validate required fields
        if (!uploadedBy || !challengeId || !challengeTitle) {
            throw new Error('Missing required fields');
        }

        const metadata = {
            uploadedBy,
            uploadDate: new Date().toISOString(),
            deviceInfo,
            uploadType: 'Challenge',
            challengeId,
            challengeTitle,
            mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
            thumbnailPath: processedFile.thumbnailPath
        };

        const result = await db.run(`
            INSERT INTO photos (
                filename,
                originalName,
                uploadedBy,
                uploadDate,
                description,
                challengeId,
                challengeTitle,
                deviceInfo,
                uploadType,
                mediaType,
                thumbnailPath
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            file.filename,
            file.originalname,
            uploadedBy,
            metadata.uploadDate,
            JSON.stringify(metadata),
            challengeId,
            challengeTitle,
            deviceInfo,
            'Challenge',
            metadata.mediaType,
            processedFile.thumbnailPath
        ]);

        console.log('Challenge upload completed successfully');

        res.json({
            id: result.lastID,
            filename: file.filename,
            ...metadata
        });
    } catch (error) {
        console.error('Challenge upload error:', error);
        res.status(500).json({
            error: 'Error uploading challenge photo',
            details: error.message
        });
    }
});


app.get('/api/photos', async (req, res) => {
    try {
        const { uploadedBy } = req.query;
        let query = `
            SELECT photos.*,
                   CASE 
                       WHEN uploadType = 'Challenge' 
                       THEN challengeTitle 
                       ELSE NULL 
                   END as challengeInfo,
                   deviceInfo as uploadDevice,
                   thumbnailPath,
                   mediaType
            FROM photos`;
        let params = [];

        if (uploadedBy) {
            query += ' WHERE uploadedBy = ?';
            params.push(uploadedBy);
        }

        query += ' ORDER BY uploadDate DESC';
        const photos = await db.all(query, params);

        const formattedPhotos = photos.map(photo => {
            let metadata = {};
            try {
                metadata = typeof photo.description === 'string'
                    ? JSON.parse(photo.description)
                    : photo.description || {};
            } catch (e) {
                console.error('Error parsing metadata:', e);
            }

            return {
                ...photo,
                name: photo.filename,
                challengeInfo: photo.challengeInfo,
                deviceInfo: photo.uploadDevice,
                thumbnailPath: photo.thumbnailPath || null,
                mediaType: photo.mediaType || 'image'
            };
        });

        res.json(formattedPhotos);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({ error: 'Error fetching photos' });
    }
});

app.get('/api/challenge-photos/:challengeId', async (req, res) => {
    try {
        const {challengeId} = req.params;
        const photos = await db.all(`
            SELECT p.*,
                   COUNT(v.id) as vote_count
            FROM photos p
                     LEFT JOIN votes v ON p.id = v.photo_id
            WHERE p.challengeId = ?
            GROUP BY p.id
            ORDER BY uploadDate DESC
        `, [challengeId]);

        res.json(photos);
    } catch (error) {
        console.error('Error fetching challenge photos:', error);
        res.status(500).json({error: 'Error fetching challenge photos'});
    }
});

app.get('/api/photos/:photoId/likes', async (req, res) => {
    try {
        const {photoId} = req.params;

        // Get likes count
        const likesCount = await db.get(
            'SELECT COUNT(*) as count FROM likes WHERE photo_id = ?',
            [photoId]
        );

        // Check if current user has liked the photo
        const {userName} = req.query;
        const existingLike = await db.get(
            'SELECT * FROM likes WHERE photo_id = ? AND user_name = ?',
            [photoId, userName]
        );

        res.json({
            likes: likesCount.count,
            hasLiked: !!existingLike
        });
    } catch (error) {
        console.error('Error getting photo likes:', error);
        res.status(500).json({error: 'Error getting photo likes'});
    }
});

app.get('/api/photos/:photoId/comments', async (req, res) => {
    try {
        const {photoId} = req.params;
        const comments = await db.all(`
            SELECT *
            FROM comments
            WHERE photo_id = ?
            ORDER BY created_at DESC
        `, [photoId]);

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({error: 'Error fetching comments'});
    }
});

// Add a comment to a photo
app.post('/api/photos/:photoId/comments', async (req, res) => {
    try {
        const {photoId} = req.params;
        const {userName, commentText} = req.body;

        const result = await db.run(`
            INSERT INTO comments (photo_id, user_name, comment_text)
            VALUES (?, ?, ?)
        `, [photoId, userName, commentText]);

        const newComment = await db.get(
            'SELECT * FROM comments WHERE id = ?',
            [result.lastID]
        );

        res.json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({error: 'Error adding comment'});
    }
});

// Update likes endpoint to match client
app.post('/api/photos/:photoId/likes', async (req, res) => {
    try {
        const {photoId} = req.params;
        const {userName} = req.body;

        // Check if user already liked the photo
        const existingLike = await db.get(
            'SELECT * FROM likes WHERE photo_id = ? AND user_name = ?',
            [photoId, userName]
        );

        if (existingLike) {
            // Remove like
            await db.run(
                'DELETE FROM likes WHERE photo_id = ? AND user_name = ?',
                [photoId, userName]
            );
            res.json({liked: false});
        } else {
            // Add like
            await db.run(
                'INSERT INTO likes (photo_id, user_name) VALUES (?, ?)',
                [photoId, userName]
            );
            res.json({liked: true});
        }
    } catch (error) {
        console.error('Error handling like:', error);
        res.status(500).json({error: 'Error handling like'});
    }
});
// Add a comment to a photo
app.post('/api/photos/:photoId/comment', async (req, res) => {
    try {
        const {photoId} = req.params;
        const {userName, commentText} = req.body;

        const result = await db.run(
            'INSERT INTO comments (photo_id, user_name, comment_text) VALUES (?, ?, ?)',
            [photoId, userName, commentText]
        );

        const newComment = await db.get(
            'SELECT * FROM comments WHERE id = ?',
            [result.lastID]
        );

        res.json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({error: 'Error adding comment'});
    }
});

// Vote endpoint with one-vote-per-challenge logic
app.post('/api/challenges/:challengeId/photos/:photoId/vote', async (req, res) => {
    try {
        const {challengeId, photoId} = req.params;
        const {userName} = req.body;

        // Start a transaction
        await db.run('BEGIN TRANSACTION');

        // Check if user has already voted in this challenge
        const existingVote = await db.get(
            'SELECT * FROM votes WHERE challenge_id = ? AND user_name = ?',
            [challengeId, userName]
        );

        let voted;

        if (existingVote) {
            if (existingVote.photo_id === parseInt(photoId)) {
                // Remove vote if clicking same photo
                await db.run(
                    'DELETE FROM votes WHERE challenge_id = ? AND user_name = ?',
                    [challengeId, userName]
                );
                voted = false;
            } else {
                // Update vote to new photo
                await db.run(
                    'UPDATE votes SET photo_id = ? WHERE challenge_id = ? AND user_name = ?',
                    [photoId, challengeId, userName]
                );
                voted = true;
            }
        } else {
            // Add new vote
            await db.run(
                'INSERT INTO votes (photo_id, challenge_id, user_name) VALUES (?, ?, ?)',
                [photoId, challengeId, userName]
            );
            voted = true;
        }

        // Get updated vote counts for all photos in this challenge
        const voteCounts = await db.all(`
            SELECT photo_id,
                   COUNT(*) as count
            FROM votes
            WHERE challenge_id = ?
            GROUP BY photo_id
        `, [challengeId]);

        // Create a vote counts map
        const voteCountMap = voteCounts.reduce((acc, curr) => {
            acc[curr.photo_id] = curr.count;
            return acc;
        }, {});

        await db.run('COMMIT');

        res.json({
            voted,
            voteCounts: voteCountMap,
            userVotedPhotoId: voted ? parseInt(photoId) : null
        });

    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Error handling vote:', error);
        res.status(500).json({error: 'Error handling vote'});
    }
});


// Get photo stats (likes, comments, votes)
app.get('/api/photos/:photoId/stats', async (req, res) => {
    try {
        const {photoId} = req.params;

        // Get likes count
        const likesCount = await db.get(
            'SELECT COUNT(*) as count FROM like WHERE photo_id = ?',
            [photoId]
        );

        // Get comments
        const comments = await db.all(
            'SELECT * FROM comments WHERE photo_id = ? ORDER BY created_at DESC',
            [photoId]
        );

        // Get votes if it's a challenge photo
        const votes = await db.get(
            'SELECT COUNT(*) as count FROM votes WHERE photo_id = ?',
            [photoId]
        );

        res.json({
            likes: likesCount.count,
            comments,
            votes: votes.count
        });
    } catch (error) {
        console.error('Error getting photo stats:', error);
        res.status(500).json({error: 'Error getting photo stats'});
    }
});

app.get('/api/challenges/:challengeId/vote-status', async (req, res) => {
    try {
        const {challengeId} = req.params;
        const {userName} = req.query;

        // First, check if user has voted in this challenge
        const userVote = await db.get(`
            SELECT photo_id
            FROM votes
            WHERE challenge_id = ?
              AND user_name = ?
        `, [challengeId, userName]);

        // Get vote counts for all photos in this challenge
        const voteCounts = await db.all(`
            SELECT photo_id,
                   COUNT(*) as count
            FROM votes
            WHERE challenge_id = ?
            GROUP BY photo_id
        `, [challengeId]);

        // Create a vote counts map
        const voteCountMap = voteCounts.reduce((acc, curr) => {
            acc[curr.photo_id] = curr.count;
            return acc;
        }, {});

        res.json({
            hasVoted: userVote !== undefined,
            userVotedPhotoId: userVote ? userVote.photo_id : null,
            voteCounts: voteCountMap
        });
    } catch (error) {
        console.error('Error checking vote status:', error);
        res.status(500).json({error: 'Error checking vote status'});
    }
});
// Vote status endpoint
app.get('/api/challenges/:challengeId/photos/:photoId/vote-status', async (req, res) => {
    try {
        const {challengeId, photoId} = req.params;
        const {userName} = req.query;

        // Get current photo's vote count
        const voteCount = await db.get(
            'SELECT COUNT(*) as count FROM votes WHERE photo_id = ?',
            [photoId]
        );

        // Check if user has voted for any photo in this challenge
        const userVote = await db.get(
            'SELECT * FROM votes WHERE challenge_id = ? AND user_name = ?',
            [challengeId, userName]
        );

        res.json({
            hasVoted: userVote?.photo_id === parseInt(photoId),
            voteCount: voteCount.count,
            userVotedPhotoId: userVote?.photo_id
        });
    } catch (error) {
        console.error('Error checking vote status:', error);
        res.status(500).json({error: 'Error checking vote status'});
    }
});

// Vote endpoint
/*app.post('/api/challenges/:challengeId/photos/:photoId/vote', async (req, res) => {
    try {
        const { challengeId, photoId } = req.params;
        const { userName } = req.body;

        // Start a transaction
        await db.run('BEGIN TRANSACTION');

        // Check if user has already voted in this challenge
        const existingVote = await db.get(
            'SELECT * FROM votes WHERE challenge_id = ? AND user_name = ?',
            [challengeId, userName]
        );

        let voted = false;

        if (existingVote) {
            if (existingVote.photo_id === parseInt(photoId)) {
                // Remove vote if clicking same photo
                await db.run(
                    'DELETE FROM votes WHERE challenge_id = ? AND user_name = ?',
                    [challengeId, userName]
                );
                voted = false;
            } else {
                // Update vote to new photo
                await db.run(
                    'UPDATE votes SET photo_id = ? WHERE challenge_id = ? AND user_name = ?',
                    [photoId, challengeId, userName]
                );
                voted = true;
            }
        } else {
            // Add new vote
            await db.run(
                'INSERT INTO votes (photo_id, challenge_id, user_name) VALUES (?, ?, ?)',
                [photoId, challengeId, userName]
            );
            voted = true;
        }

        // Get updated vote count
        const voteCount = await db.get(
            'SELECT COUNT(*) as count FROM votes WHERE photo_id = ?',
            [photoId]
        );

        await db.run('COMMIT');

        res.json({
            voted,
            voteCount: voteCount.count
        });
    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Error handling vote:', error);
        res.status(500).json({ error: 'Error handling vote' });
    }
});*/
// Get challenge leaderboard
app.get('/api/challenges/:challengeId/leaderboard', async (req, res) => {
    try {
        const {challengeId} = req.params;

        // Get photos with vote counts and upload timestamp for tiebreaking
        const photos = await db.all(`
            SELECT p.id        as photo_id,
                   p.filename,
                   p.uploadedBy,
                   p.uploadDate,
                   COUNT(v.id) as vote_count
            FROM photos p
                     LEFT JOIN votes v ON p.id = v.photo_id
            WHERE p.challengeId = ?
            GROUP BY p.id
            ORDER BY vote_count DESC, p.uploadDate ASC LIMIT 3
        `, [challengeId]);

        // Calculate rankings with ties
        let currentRank = 1;
        let currentVoteCount = -1;
        let sameRankCount = 0;

        const rankedPhotos = photos.map((photo, index) => {
            if (photo.vote_count !== currentVoteCount) {
                currentRank = index + 1 - sameRankCount;
                currentVoteCount = photo.vote_count;
                sameRankCount = 0;
            } else {
                sameRankCount++;
            }

            return {
                ...photo,
                rank: currentRank
            };
        });

        res.json(rankedPhotos);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({error: 'Error getting leaderboard'});
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});
app.delete('/api/photos/:photoId', async (req, res) => {
    try {
        const {photoId} = req.params;
        const {userName} = req.query;

        // First get the photo to check ownership
        const photo = await db.get(
            'SELECT * FROM photos WHERE id = ?',
            [photoId]
        );

        // Check if photo exists
        if (!photo) {
            return res.status(404).json({error: 'Photo not found'});
        }

        // Check if user owns the photo (or is admin)
        if (photo.uploadedBy !== userName) {
            return res.status(403).json({error: 'Unauthorized to delete this photo'});
        }

        // Get the filename to delete the actual file
        const filename = photo.filename;

        // Delete from database
        await db.run('DELETE FROM photos WHERE id = ?', [photoId]);

        // Delete the actual file
        const filePath = join(UPLOADS_DIR, filename);
        await fs.unlink(filePath).catch(err => {
            console.error('Error deleting file:', err);
            // Continue even if file deletion fails
        });

        // Also delete associated likes and comments
        await db.run('DELETE FROM likes WHERE photo_id = ?', [photoId]);
        await db.run('DELETE FROM comments WHERE photo_id = ?', [photoId]);
        await db.run('DELETE FROM votes WHERE photo_id = ?', [photoId]);

        res.json({message: 'Photo deleted successfully'});
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({error: 'Error deleting photo'});
    }
});

// Modified server initialization
const initializeServer = async () => {
    try {
        await ensureUploadsDir();
        await initializeDb();

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log('Uploads directory:', UPLOADS_DIR);
            console.log('Thumbnails directory:', THUMBNAILS_DIR);
        });
    } catch (error) {
        console.error('Server initialization error:', error);
        process.exit(1);
    }
};

// Start the server
initializeServer().catch(console.error);