import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js"
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config({
    path: './.env'
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, etc.)
            if (!origin) return callback(null, true);

            const allowedOrigins = [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'https://youtube-frontend-omega.vercel.app',
                process.env.FRONTEND_URL // For production
            ];

            // In development, allow localhost and 127.0.0.1 on any port
            if (process.env.NODE_ENV !== 'production') {
                if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
                    return callback(null, true);
                }
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {

    // Join video room for comments
    socket.on('join-video', (videoId) => {
        socket.join(`video-${videoId}`);
    });

    // Leave video room
    socket.on('leave-video', (videoId) => {
        socket.leave(`video-${videoId}`);
    });

    // Handle new comment
    socket.on('new-comment', (data) => {
        // Broadcast to all users in the video room except sender
        socket.to(`video-${data.videoId}`).emit('comment-added', data.comment);
    });

    // Handle comment reply
    socket.on('new-reply', (data) => {
        socket.to(`video-${data.videoId}`).emit('reply-added', data);
    });

    // Handle comment like/unlike
    socket.on('comment-liked', (data) => {
        socket.to(`video-${data.videoId}`).emit('comment-like-updated', data);
    });

    // Handle comment edit
    socket.on('comment-edited', (data) => {
        socket.to(`video-${data.videoId}`).emit('comment-updated', data);
    });

    // Handle comment delete
    socket.on('comment-deleted', (data) => {
        socket.to(`video-${data.videoId}`).emit('comment-removed', data);
    });

    socket.on('disconnect', () => {
    });
});

// Make io available to routes
app.set('io', io);

connectDB()
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!!", err)
    })
