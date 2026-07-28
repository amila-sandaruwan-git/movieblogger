<div align="center">

# 🎬 MovieBlogger

### A Modern, Full-Featured Movie Review Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TMDB](https://img.shields.io/badge/TMDB-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

</div>

## 📖 About The Project

**MovieBlogger** is a complete, production-ready movie review platform that combines the power of **Next.js** with **Supabase** and **TMDB API**. It offers a seamless experience for discovering films, writing reviews, and engaging with a community of movie lovers.

### 🎯 Key Highlights

- 🎥 **Automated Movie Data** – Fetch posters, trailers, cast, and ratings from TMDB
- 💬 **Social Interactions** – Like, comment, follow, and bookmark
- 🔔 **Real-time Notifications** – Stay updated with instant alerts
- 🎨 **Beautiful UI** – Glass-morphism design with dark/light themes
- 📱 **Fully Responsive** – Works perfectly on all devices
- 🔒 **Secure Authentication** – Email/Password + Google OAuth

---

## ✨ Features

### 🎥 Content Management

| Feature | Description |
|---------|-------------|
| **TMDB Integration** | Auto-fetch posters, backdrops, trailers, cast, director, genres, ratings, runtime |
| **Rich Text Editor** | Write detailed reviews with TinyMCE (bold, images, formatting) |
| **Full Review Popup** | Immersive reading experience with scroll progress & fullscreen |
| **Draft System** | Auto-save drafts and schedule publications |
| **Image Upload** | Custom posters and banners for each review |

### 👤 User Experience

| Feature | Description |
|---------|-------------|
| **Authentication** | Email/Password + Google OAuth with email verification |
| **User Profiles** | Customizable avatar, banner, bio, and social links |
| **Dashboard** | Track your posts, views, followers, and engagement analytics |
| **Reading List** | Bookmark and organize your favorite reviews |
| **Dark/Light Mode** | Full theme support with smooth transitions |

### 💬 Social Features

| Feature | Description |
|---------|-------------|
| **Like/Dislike** | Real-time reactions with animated feedback |
| **Threaded Comments** | YouTube-style nested conversations with replies |
| **Follow System** | Build your community and see follower counts |
| **Bookmark** | Save reviews to your personal reading list |
| **Share** | Share reviews on Facebook, Twitter, WhatsApp, Telegram, LinkedIn |

### 🔔 Notifications

| Feature | Description |
|---------|-------------|
| **Real-time Alerts** | Instant notifications for comments, replies, follows, and likes |
| **Sound Alerts** | Audio feedback with different sounds for each notification type |
| **Reply from Notification** | Reply to comments directly from the notification panel |
| **Bulk Actions** | Mark all as read, clear read notifications |
| **Toast Notifications** | Non-intrusive popup alerts for new notifications |

### 📊 Discovery & Analytics

| Feature | Description |
|---------|-------------|
| **Advanced Search** | Search by title, director, cast, genre, or content |
| **Smart Filters** | Filter by genre, year, language, and review language |
| **View Tracking** | Detailed view analytics with breakdowns (authenticated vs anonymous) |
| **Trending Reviews** | Algorithm-based popular content with engagement scores |
| **Related Content** | Smart recommendations based on genres, cast, and director |

### 🛡️ Moderation

| Feature | Description |
|---------|-------------|
| **Report System** | 7 report categories with detailed forms |
| **Anonymous Reporting** | User identities remain confidential |
| **Account Deletion** | 7-day grace period with cancellation option |
| **Admin Controls** | Manage reported content and user accounts |

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 15 | React framework with App Router |
| **Language** | TypeScript | Type-safe JavaScript |
| **Database** | Supabase | PostgreSQL database with real-time |
| **Auth** | Supabase Auth | Email + Google OAuth authentication |
| **Storage** | Supabase Storage | Avatars, banners, movie posters |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **API** | TMDB API | Movie data (posters, trailers, metadata) |
| **Editor** | TinyMCE | Rich text editor for reviews |
| **Icons** | Lucide Icons | Beautiful open-source icons |

</div>

---

## 🗄️ Database Schema

<details>
<summary><strong>📊 Click to expand database schema</strong></summary>

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **profiles** | User profiles | id, name, email, avatar_url, banner_url, bio, social links |
| **posts** | Movie reviews | id, movie_title, content, excerpt, director, cast, genre_tags, tmdb_rating, status |
| **comments** | Threaded comments | id, post_id, user_id, content, parent_id, is_pinned |
| **follows** | Follow relationships | id, follower_id, following_id |
| **bookmarks** | Saved posts | id, user_id, post_id, created_at |

### Engagement Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **post_reactions** | Likes/dislikes | id, post_id, user_id, reaction_type |
| **post_views** | View tracking | id, post_id, user_id, ip_address, session_id |
| **notifications** | Real-time alerts | id, user_id, type, title, message, is_read |

### Moderation Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **reports** | Content reports | id, post_id, user_id, reason, status, description |
| **contact_messages** | User inquiries | id, name, email, subject, message, status |

</details>

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- TMDB API key

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/movieblogger.git
cd movieblogger

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.local.example .env.local

# 4. Configure environment variables
# - Supabase URL and keys
# - TMDB API key
# - Admin credentials

# 5. Start the development server
npm run dev
