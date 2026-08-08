# AyuraNature Technical Documentation

Welcome to the AyuraNature project documentation. This file serves as a comprehensive guide for developers joining the project to understand the architecture, folder structure, API interactions, and SEO optimizations currently in place.

## 1. Project Architecture

The project is split into two main directories in the repository:
1. **Frontend**: A vanilla HTML/JS/CSS frontend styled with TailwindCSS classes. It heavily relies on client-side JavaScript to dynamically fetch data from the backend.
2. **blogserver-backhend**: A Node.js and Express backend that serves as a REST API and interfaces with a MongoDB database (using Mongoose).

### 1.1 Frontend Structure
- **`index.html` & `home.html`**: The main landing pages. They fetch all posts dynamically via JS, filter them by category/topic, and inject them into a grid. They include pagination ("Load More" button) and AdSense injection every 3 posts.
- **`admin.html`**: The CMS dashboard. Allows admins to create, edit, and delete blogs. It also features a "Global SEO Settings" section to dynamically update meta tags on the `index.html` and `home.html` files.
- **`blog-detail.html`**: The dynamic blog reader. It expects a `title` query parameter in the URL (e.g., `?title=slug`), which it uses to fetch the specific blog post from the backend API.
- **`category.html`**: Filters and displays posts by a specific category passed in the URL `?cat=CategoryName`.
- **Static Assets**: Stored in the `publc` folder (e.g., logos and banners).

### 1.2 Backend Structure
Located in `blogserver-backhend/`:
- **`server.js`**: The main entry point. Sets up the Express app, connects to MongoDB, configures CORS, and mounts the routes.
- **`models/`**: Mongoose schemas.
  - `Post.models.js`: Defines the schema for blog posts (title, slug, content, meta tags, etc.).
  - `Product.models.js`: (If applicable) schema for store products.
- **`controllers/`**: Business logic for routes.
  - `Post.controllers.js`: CRUD logic for blogs.
  - `sitemap.controller.js`: Generates a dynamic `sitemap.xml` directly from the MongoDB database, outputting URLs in the `?title=slug` format.
- **`routes/`**: API endpoint definitions.
  - `Post.routes.js`: Maps `/api/posts` to the Post controller.
  - `Settings.routes.js`: Contains an endpoint to dynamically parse and overwrite the `<title>`, `<meta name="description">`, and `<meta name="keywords">` strings inside the raw `index.html` and `home.html` files on the server disk.

## 2. API Endpoints

The frontend communicates with the backend hosted at `https://api.ayuranature.com/api`. 

### Posts (`/api/posts`)
- `GET /api/posts` - Fetches all blog posts. Used by `index.html`, `category.html`, and `admin.html`.
- `GET /api/posts/slug/:slug` - Fetches a single post by its URL-friendly slug. Used by `blog-detail.html`.
- `POST /api/posts` - Creates a new post (Admin only).
- `PUT /api/posts/:id` - Updates an existing post (Admin only).
- `DELETE /api/posts/:id` - Deletes a post (Admin only).

### SEO Settings (`/api/settings`)
- `POST /api/settings/update-home-seo` - Expects `{ title, description, keywords }`. It directly modifies the actual HTML files (`Frontend/index.html` and `Frontend/home.html`) on the server disk to update their meta tags for search engine crawlers.

### Sitemap
- `GET /sitemap.xml` - Dynamically generates an XML sitemap of all active posts for Google Search Console.

## 3. SEO Implementation & Strict H1 Rule

To ensure maximum SEO score, a strict **1 H1 Tag** rule is enforced across the entire website:
- **`index.html` & `home.html`**: The "Categories" heading (`<h1 class="...">Categories</h1>`) serves as the solitary H1 tag. All other headings are strictly H2 through H6.
- **`blog-detail.html`**: The blog title `#detailTitle` is the only H1 tag. 
  - *Crucial note*: Because blogs are written in a Rich Text Editor (which generates raw HTML), the backend's raw HTML might contain `<h1>` tags written by the author. To prevent these from leaking into the page and ruining the SEO score, a JavaScript regex in `blog-detail.html` intercepts the raw content and automatically downgrades all `<h1>` tags to `<h2>` tags right before injecting it into the DOM.
- **Other Pages**: `about.html`, `contact.html`, `privacy-policy.html`, etc. strictly have only their main title as an H1 tag.

## 4. Key Workflows

### How Blogs Load on the Homepage
1. User visits `index.html`.
2. JS fetches `GET /api/posts`.
3. JS filters the posts (by category/search if applicable) and maps the first 6 posts (controlled by `visiblePostsCount`) into HTML strings.
4. An AdSense block is injected every 3rd post.
5. Clicking "Load More" increments `visiblePostsCount` by 6 and re-renders the grid without a page reload.

### How Global Meta Tags are Updated
1. Admin enters new meta tags in the Global SEO section of `admin.html`.
2. JS sends a POST request to `/api/settings/update-home-seo`.
3. The backend script reads `index.html` and `home.html` from the filesystem via `fs.readFile`.
4. It uses regex to find `<title>.*</title>` and `<meta name="description" ...>` and replaces them with the new values.
5. It writes the files back to the disk via `fs.writeFile`.
6. This ensures that web crawlers see the new tags instantly without relying on client-side JS rendering.

## 5. Deployment Information
- **Frontend**: Served statically (e.g. via Nginx, Apache, or a static host like Netlify/Vercel).
- **Backend API**: Runs via Node.js on `server.js` and should be managed via a process manager like PM2, listening on the appropriate port, and proxy-passed behind Nginx (likely at `api.ayuranature.com`).
