# Product Requirements Document (PRD)
## CAU Villa Lugano - Universidad Siglo 21

### 1. Product Overview
Website for Universidad Siglo 21 - CAU Villa Lugano, a distance learning university center in Villa Lugano, Buenos Aires, Argentina. The site showcases academic programs and facilitates student enrollments.

### 2. Target Users
- Prospective students in Buenos Aires Zona Sur/Oeste looking for university programs
- Current students seeking support classes and FAQ information
- General visitors looking for contact and institutional information

### 3. Core Features

#### 3.1 Home Page (/)
- **Hero Section**: Animated hero banner with call-to-action
- **Careers Catalog**: Browse 30+ academic programs filtered by category (grado, pregrado, diplomatura, certificado). Includes fuzzy text search and modal detail views with carousel navigation.
- **Enrollment Form**: Multi-field form (nombre, apellido, email, telefono, localidad, carrera, tipo, equivalencias) that submits enrollment interest to Supabase database.
- **Footer**: Institutional footer with links

#### 3.2 FAQ Page (/faq)
- Accordion-style Q&A fetched from Supabase
- Users can submit new questions via form

#### 3.3 Support Classes (/clases-apoyo)
- List of tutoring subjects with weekly calendar
- Individual subject detail pages at /clases-apoyo/[materia]

#### 3.4 News (/novedades/[page])
- Placeholder page, pending database connection

#### 3.5 About Us (/sobre-nosotros)
- Static content describing the institution, features, and mission

#### 3.6 Contact (/contacto)
- Contact information: address, WhatsApp, Facebook, Instagram
- Direct links to social media and messaging

#### 3.7 Navigation
- Responsive navbar with all section links
- Hamburger menu on mobile
- Social media icons (WhatsApp, Facebook, Instagram)
- Scroll-to-top functionality

### 4. Technical Requirements
- Framework: Next.js 16 with App Router, React 19
- Styling: Tailwind CSS v4
- Database: Supabase (PostgreSQL)
- Analytics: Vercel Analytics, Google Analytics
- Fonts: Inter (body), Unbounded (headings)
- Language: Spanish (es-AR)
- No authentication required for any page

### 5. Non-Functional Requirements
- Responsive design (mobile + desktop)
- SEO optimized with metadata on all pages
- Data revalidation every hour for home page
- Force-dynamic rendering for support classes (real-time data)
