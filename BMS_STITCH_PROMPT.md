# BMS Frontend Design Prompt — For Stitch / v0.dev / AI Design Tools

Copy everything below the line and paste it into Stitch:

---

Design a modern, premium Building Management System (BMS) admin dashboard frontend. This is a real production SaaS product for property managers in Ethiopia. Use React + TypeScript. The design should feel like a $200/month enterprise SaaS — polished, responsive, dark mode supported, with smooth micro-animations. Use a sidebar navigation layout with collapsible sidebar.

**CRITICAL DESIGN PHILOSOPHY:** This system must feel like a visual property explorer, NOT a boring database admin panel. When looking at buildings and units, the user should feel like they're browsing a premium real-estate platform. Use rich cards with images, color-coded status indicators, and floor-based grouping. Every piece of data should be glanceable — the client wants to open a building and instantly SEE all their units organized beautifully by floor, with green/red availability status at a glance, and be able to manage everything right from the cards without navigating away.

## Tech Stack
- React 18 + TypeScript
- React Router v6 for routing
- Tailwind CSS or high-quality CSS
- Recharts or Chart.js for data visualization
- Lucide React or React Icons for iconography
- Google Font: Inter or Outfit

## Color System
- Primary: Indigo-600 (#4f46e5) 
- Success: Emerald-500
- Warning: Amber-500
- Danger: Rose-500
- Background: Slate-50 (light) / Slate-900 (dark)
- Cards: White (light) / Slate-800 (dark)
- Support both light and dark themes

## Authentication
- **Login page** with email + password. Clean centered card design with gradient background.
- Token stored in localStorage. JWT-based auth.
- Role-based access: `super_admin`, `company_admin`, `nominee_admin`, `tenant`, `owner`
- The sidebar and page actions should conditionally render based on user role

## Global Layout
- **Collapsible sidebar** (256px expanded / 80px collapsed) with nav groups:
  - OVERVIEW: Dashboard
  - PROPERTY: Sites, Buildings, Units, Amenities, Owners
  - PEOPLE: Tenants, Users, Roles & Permissions, Visitors
  - OPERATIONS: Leases, Maintenance, Finance, Utilities, Documents
  - SYSTEM: QR Codes, Automations, Reports, Notifications, Settings, Audit Log, Login History, Profile
- **Top bar** with: breadcrumb, search, notifications bell with badge, dark mode toggle, user avatar dropdown
- All pages should have a consistent `PageLayout` wrapper with title, subtitle, and optional action buttons

## Pages & Their Backend APIs

### 1. Dashboard (`/`)
**API:** `GET /reports/dashboard`
**Shows:** 
- Top KPI cards: Occupancy Rate (%), Total Revenue (ETB), Active Leases, Pending Maintenance, Visitor Count Today
- Occupancy donut chart (occupied vs vacant units)
- Revenue trend line chart (last 12 months)
- Contractor performance bar chart
- Recent activity feed (latest 10 events across all modules)
- Quick action buttons: Create Lease, New Maintenance Request, Check-in Visitor

### 2. Sites (`/sites`)
**APIs:** `GET /sites`, `POST /sites`, `PATCH /sites/:id`, `DELETE /sites/:id`
**Fields:** name, code, address, city, region, latitude, longitude
**UI:** Table list with search + create modal. Each site row shows building count.

### 3. Buildings (`/buildings`)
**APIs:** `GET /buildings`, `POST /buildings`, `PATCH /buildings/:id`, `DELETE /buildings/:id`, `POST /buildings/:id/assign-admin`, `GET /buildings/:id/admins`, `DELETE /buildings/:id/admins/:userId`
**Fields:** name, code, address, site_id (dropdown of sites), total_floors, year_built, image_url
**UI — Two-level experience:**
- **Buildings list view:** Display buildings as large visual cards in a grid (2-3 per row). Each card shows: building image (full-width top), building name, address, site name, total units count, a mini occupancy bar (green portion = occupied %, gray = vacant), and quick stats (e.g. "12 units · 3 floors · 8 occupied"). Hover effect with subtle scale + shadow.
- **Building detail view (CRITICAL — the main experience):** When a user CLICKS a building card, it expands into a **full building explorer page**. This page has:
  - A **building header banner** at the top with the building image as a blurred background, building name, address, admin info overlaid
  - Below the header: a **floor-by-floor section layout**. Each floor is a labeled section (e.g. "Floor 1", "Floor 2", "Ground Floor") with a horizontal divider.
  - Inside each floor section: **unit cards in a responsive grid** (3-4 cards per row on desktop, 2 on tablet, 1 on mobile)
  - The user should be able to **create, edit, and manage units directly from this building view** — NOT from a separate Units page. Add Unit button per floor section.
- Admin assignment section at the bottom or in a settings tab
- Image upload on create/edit

### 4. Units (`/units`) — Displayed INSIDE Building Detail
**APIs:** `GET /units`, `POST /units`, `PATCH /units/:id`, `DELETE /units/:id`, `POST /units/bulk-upload` (CSV), `GET /units/:id/amenities`, `POST /units/:id/amenities/:amenityId`, `DELETE /units/:id/amenities/:amenityId`
**Fields:** building_id, unit_number, floor, type (STUDIO, 1BR, 2BR, 3BR, PENTHOUSE, COMMERCIAL, OTHER — when OTHER is selected, show a text input for custom type), size_sqm, bedrooms, bathrooms, rent_price, status (vacant/occupied/maintenance), image_url

**UI — Unit Cards (THIS IS THE MOST IMPORTANT DESIGN IN THE ENTIRE APP):**
Each unit is rendered as a **rich visual card** with the following layout:
- **Top:** Unit image (if available) or a styled placeholder with unit type icon. Full-width, ~140px height, rounded top corners.
- **Middle body:**
  - Unit number displayed as bold heading (e.g. "Unit A-101")
  - Unit type as a subtle label below (e.g. "2 Bedroom")
  - A row of mini-stat pills: 📐 45 sqm · 🛏️ 2 bed · 🚿 1 bath
  - Rent price displayed prominently: "ETB 15,000/mo"
- **Bottom footer:** A **full-width status bar** spanning the entire bottom of the card:
  - If **vacant/available**: the bar is **bright green** (emerald-500) with white text "AVAILABLE"
  - If **occupied**: the bar is **red** (rose-500) with white text "OCCUPIED"
  - If **under maintenance**: the bar is **amber/yellow** (amber-500) with white text "MAINTENANCE"
  - The status bar has rounded bottom corners matching the card
- **Card hover:** Subtle lift animation + show a floating action menu (three dots) with options: Edit, View Details, Manage Amenities, Delete
- **Card click:** Opens a slide-over panel (right side drawer) with full unit details, edit form, amenity management, and lease info — the user should NOT navigate away from the building view

**Floor Grouping:**
- Units are grouped under collapsible floor sections
- Each section header shows: "Floor 3" with a count badge (e.g. "4 units") and a mini summary ("2 available, 2 occupied")
- Sections are expanded by default, but can be collapsed
- A "+ Add Unit" button appears at the end of each floor section
- If a building has many floors, add a sticky floor navigation sidebar or floor jump dropdown

**Top toolbar for the building explorer:**
- Filter bar: filter by status (All, Available, Occupied, Maintenance), unit type, floor
- Sort by: unit number, rent price, size
- View toggle: Card view (default) / compact list view
- Bulk actions: Bulk CSV upload, Export
- Search by unit number

### 5. Amenities (`/amenities`)
**APIs:** `GET /amenities`, `POST /amenities`, `PATCH /amenities/:id`, `DELETE /amenities/:id`, building-level and unit-level linking
**Fields:** name, description, icon
**UI:** Grid of amenity cards. Link/unlink to buildings and units.

### 6. Owners (`/owners`)
**APIs:** `GET /owners`, `POST /owners`, `PATCH /owners/:id`, `DELETE /owners/:id`
**Fields:** name, email, phone, address, id_number, tax_id
**UI:** Table with search. Create/edit modal.

### 7. Tenants (`/tenants`)
**APIs:** `GET /tenants`, `POST /tenants/register`, `PATCH /tenants/:id`, `POST /applications`, `GET /applications/pending`, `PATCH /applications/:id/approve`, `PATCH /applications/:id/reject`, `POST /documents` (file upload), `GET /documents`, `PATCH /documents/:id/verify`, `POST /announcements`, `GET /announcements`, `POST /messages`, `GET /messages/:tenantId`
**Tenant Types:** PERSONAL and ORGANIZATIONAL
- **Personal:** first_name, last_name, email, phone, password, id_image (inline upload), detailed_address, profile_image
- **Organizational:** organization name, tin_number, vat_reg_number, license_image (inline upload), profile_image, address
**UI Features:**
- Toggle between Personal and Organizational on the registration form — fields change dynamically
- Tenant list table with status badges
- Application workflow: Pending → Approved/Rejected
- Document upload and verification section
- Announcements management (create with scope: all/building/site)
- Messaging thread view between admin and tenant
- Tenant detail page with tabs: Profile, Lease, Documents, Messages, Payment History

### 8. Users (`/users`)
**APIs:** `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id` (soft delete → deactivates), `PATCH /users/:id/activate`, `POST /users/assign-role`
**Fields:** name, email, password, role_id, status (ACTIVE/INACTIVE)
**UI:** 
- **Two tabs: Active Users | Deactivated Users** with count badges
- Active tab shows: Edit, Deactivate, Assign Role buttons
- Deactivated tab shows: Reactivate button
- No hard delete — delete button deactivates with confirmation
- Role assignment inline form

### 9. Roles & Permissions (`/roles`, `/permissions`)
**APIs:** `GET /roles`, `POST /roles`, `PATCH /roles/:id`, `DELETE /roles/:id`, `GET /permissions`, `POST /roles/:roleId/permissions/:permissionId`, `DELETE /roles/:roleId/permissions/:permissionId`
**UI:** Role list with expandable permission checkboxes. Matrix view of role vs permissions.

### 10. Visitors (`/visitors`)
**APIs:** `GET /visitors`, `POST /visitors`, `PATCH /visitors/:id`, `DELETE /visitors/:id`, `PATCH /visitors/:id/checkout`
**Fields:** visitor_name, phone, id_card_no, purpose, site_id, unit_id, host_user_id, vehicle_number, notes, status (in/exited), check_in_time, check_out_time
**UI:**
- Check-in form with **cascading dropdowns: Site → Building → Unit** (Building and Unit are optional)
- Visitor log table with status badges (On Site / Away)
- Checkout and Delete action buttons
- Filter by site

### 11. Leases (`/leases`)
**APIs:** `GET /leases`, `POST /leases`, `PATCH /leases/:id/activate`, `PATCH /leases/:id/terminate`, `POST /leases/:id/renew`, `DELETE /leases/:id`, `POST /leases/:id/upload` (PDF), `GET /leases/:id/download` (PDF)
**Fields:** tenant_id, unit_id, start_date, end_date, monthly_rent, deposit_amount, status (draft/active/terminated/expired), previous_lease_id (for renewals), termination_date, termination_reason, document_url
**UI:**
- Timeline-style lease cards grouped by status
- Create lease form with tenant + unit dropdowns
- Lease lifecycle buttons: Activate (draft→active), Terminate, Renew
- Upload signed PDF document
- Download generated lease PDF
- Lease detail page showing: tenant info, unit info, remaining days countdown, payment history, document preview

### 12. Maintenance (`/maintenance`)
**APIs:** `GET /maintenance/requests`, `POST /maintenance/requests`, `PATCH /maintenance/requests/:id`, `GET /maintenance/contractors`, `POST /maintenance/contractors`, `PATCH /maintenance/contractors/:id`, `GET /maintenance/work-orders`, `POST /maintenance/work-orders`, `PATCH /maintenance/work-orders/:id` (with proof file upload), `POST /maintenance/feedback`, `GET /maintenance/reports`
**Statuses:** pending, in_progress, completed, cancelled
**UI:**
- Kanban board view (columns: Pending, In Progress, Completed) — cards draggable between columns
- Request form: unit_id, description, priority (low/medium/high/emergency), category
- Work order conversion: assign contractor, estimated cost, deadline
- Contractor management: CRUD table with specialization and rating
- Feedback submission form with star rating
- Maintenance KPI dashboard: avg resolution time, top contractors, cost breakdown

### 13. Finance (`/finance`)
**APIs:** `GET /finance/invoices`, `GET /finance/invoices/all`, `POST /finance/invoices`, `DELETE /finance/invoices/:id` (void), `POST /finance/payments`, `PATCH /finance/payments/:id/verify`, `POST /finance/bank-accounts`, `GET /finance/bank-accounts`, `POST /finance/deposit-advice`, `POST /finance/invoices/generate` (bulk), `PATCH /finance/tax-rules`, `GET /finance/reports/revenue`, `GET /finance/reports/tax`
**Invoice Fields:** tenant_id, building_id, due_date, items (description, quantity, unit_price, tax), total, status (DRAFT/SENT/PAID/OVERDUE/CANCELLED)
**Payment Fields:** invoice_id, amount, method, reference_no, bank_account_id, payment_date, slip_photo, status (pending/verified/rejected)
**UI:**
- Invoice list with status filter tabs (All, Draft, Sent, Paid, Overdue)
- Create invoice form with dynamic line items (add/remove rows)
- Payment recording with photo upload (bank slip)
- Payment verification workflow for admin
- Bank accounts management
- Deposit advice creation
- Tax rules configuration (VAT rate, withholding rate)
- Revenue and Tax reports with charts
- Bulk invoice generation trigger

### 14. Utilities (`/utility`)
**APIs:** `GET /utility/meters`, `POST /utility/meters`, `GET /utility/readings`, `POST /utility/readings` (with optional photo)
**Meter Fields:** unit_id (dropdown), type (electric/water), serial_no, initial_reading, unit_price
**Reading Fields:** meter_id, reading_value, reading_date, photo (optional)
**UI:**
- Split view: Create Meter (left) + Meter List (right)
- Create Reading form with optional photo upload
- Reading history with meter filter
- Display unit_price in meter cards

### 15. Documents (`/documents`)
**APIs:** `GET /documents`, `POST /documents` (file upload), `PATCH /documents/:id`, `PATCH /documents/:id/verify`
**UI:** Document list with type badges, upload form, verification workflow.

### 16. QR Codes (`/qr`)
**APIs:** `POST /qr/generate/:unitId`, `POST /qr/generate-building/:buildingId`, `GET /qr/:token/png`, `GET /qr/analytics`, `PATCH /qr/:id/deactivate`, `GET /qr/export/pdf`
**UI:**
- Generate QR for individual units or entire buildings
- QR code preview (PNG render)
- Analytics table: token, unit/building, scan count
- Deactivate toggle
- Export PDF sheets of QR codes
- Public page at `/public/building/:token` — dark-themed card view of all building units grouped by floor (this page has NO sidebar/auth, it's public-facing for QR scanning)

### 17. Automations (`/automations`)
**UI:** Rule builder for automated actions (e.g., auto-send rent reminder 5 days before due date, auto-generate invoices monthly).

### 18. Reports (`/reports`)
**APIs:** `GET /reports/dashboard`, `GET /reports/financial`, `GET /reports/occupancy`
**UI:**
- Dashboard KPIs: occupancy rate, total units, occupied leases, revenue
- Financial report: 12-month revenue bar chart with ETB amounts
- Occupancy report: active lease list with unit/tenant details, floor, size, rent
- Export to CSV/PDF buttons

### 19. Notifications (`/notifications`)
**APIs:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/mark-all-read`
**UI:** Notification bell in header with unread count badge. Dropdown list of notifications. Full notification page with mark-as-read.

### 20. Settings (`/settings`)
**APIs:** `GET /settings`, `PATCH /settings`
**Fields:** organization_name, logo_url, currency (ETB), timezone, late_fee_percentage (configurable by super_admin), vat_rate, default_lease_duration_months
**UI:** Settings form with sections: Organization, Financial, Defaults.

### 21. Audit Log (`/audit`)
**APIs:** `GET /audit/logs`
**UI:** Searchable table of admin actions: user, action, target, timestamp, IP address, details.

### 22. Login History (`/login-history`)
**UI:** Table of login events: user, timestamp, IP, device/browser, status (success/failed).

### 23. Profile (`/profile`)
**UI:** User's own profile view: name, email, change password, avatar upload.

## Design Requirements
1. All forms should have proper validation with inline error messages
2. All tables should have: search, column sorting, pagination, and empty states with illustrations
3. Use skeleton loaders during data fetch, not spinners
4. Toast notification system for success/error feedback (bottom-right)
5. Confirmation modals for destructive actions (delete, deactivate, void)
6. Date inputs should use a date picker component
7. File upload fields should show preview thumbnails
8. Responsive: works on desktop (1440px), laptop (1024px), and tablet (768px)
9. All monetary values displayed as "ETB X,XXX.XX" format
10. Status badges should use color-coded pill components
11. Use breadcrumbs for navigation context
12. Empty states should have relevant illustrations and CTAs
13. Page transitions should have subtle fade animations
