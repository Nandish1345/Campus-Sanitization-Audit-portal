# 🏫 Campus Sanitization Audit & Complaint Portal

Welcome to the **Campus Sanitization Audit & Complaint Portal** (also known as *Campus Clean & Care*). This is a comprehensive, modern, web-based platform designed to monitor and improve campus hygiene, cleanliness, and facilities maintenance. By connecting campus citizens (students and lecturers), maintenance staff, and administration, it enables seamless issue reporting, automated notification alerts, status tracking, and data-driven analytics.

---

## 🚀 Key Features

### 👤 Role-Based Portals & Access Control
- **Students & Lecturers**: Can easily file sanitization complaints, attach photo evidence (either by uploading files or using a live device camera), and track status updates.
- **Maintenance Staff**: Access assigned tasks, update work statuses (e.g., mark as "In Progress" or "Resolved"), log completion details, and upload "resolved" photo evidence.
- **Administrators**:
  - Full visibility over all raised complaints.
  - Ability to assign tasks to specific staff members and update statuses.
  - Interactive **Analytics & Reports Dashboard** featuring graphs/charts on complaint categories, locations, status distributions, and monthly trends.
  - View user feedback submitted via the public portal.

### 🔔 In-App Notifications & Realtime Messaging
- Instant notifications generated on key events (e.g., when a complaint is assigned, updated, or resolved).
- Uses Supabase Realtime so users see alert changes dynamically.

### 📸 Double-Evidence Verification
- **Reporting Evidence**: Requester must upload/capture a photo showing the issue.
- **Resolution Evidence**: Assigned staff must upload/capture a photo proving the work has been completed before marking a complaint as "Resolved".

### 📊 Interactive Admin Analytics
- Visualized charts using **Recharts**:
  - Complaint categories breakdown (e.g., Cleaning, Electrical, Plumbing).
  - Status pie charts (Pending, In Progress, Resolved, Rejected).
  - High-frequency location graphs (Hostel, Canteen, Classroom, etc.).
  - Monthly trends to track progress over time.

---

## 🛠️ Tech Stack

- **Frontend**: React (v18), Vite, TypeScript, Tailwind CSS, shadcn-ui, Lucide React icons.
- **State Management & Querying**: TanStack React Query (v5).
- **Backend / Database**: Supabase (PostgreSQL, Authentication, Realtime DB Publications, Storage Buckets).
- **Charts / Analytics**: Recharts.

---

## ⚙️ Local Development Setup

### Prerequisites
Make sure you have [Node.js (v18 or higher)](https://nodejs.org/) and npm/bun installed.

### Step 1: Clone the Repository
```bash
git clone https://github.com/Nandish1345/Campus-Sanitization-Audit-portal.git
cd Campus-Sanitization-Audit-portal/campus-clean-care-main
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory (or update the existing one) with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` to view the portal.

---

## 🗄️ Database Setup (Supabase)

To fully configure the backend services, execute the SQL migration scripts located in the project root inside your Supabase project's **SQL Editor**:

1. **`upgrade_complaint_lifecycle.sql`**: Sets up the base user `profiles` table, auto-sync triggers for new user signups, and configures Row Level Security (RLS) on the `complaints` table.
2. **`add_notifications.sql`**: Creates the `notifications` table, sets up RLS rules, and enables Realtime messaging.
3. **`create_feedback_table.sql`**: Generates the feedback table used for public portal suggestions.
4. **`add_user_columns.sql` / `add_resolution_photo.sql`**: Adds columns supporting role configuration, evidence tracking, and resolution details.
5. **`create_staff_rpc.sql`**: Database remote procedure call functions supporting administrative features.
6. **`restrict_signup_roles.sql`**: Sets up constraints preventing unauthorized signup roles.
7. **`supabase_admin_policies.sql` / `rls_fixes.sql`**: Secures database tables and configures policies for Supabase Storage buckets.

### Storage Bucket Requirements
Ensure you create a **public** storage bucket in your Supabase Storage section named:
- **`complaint-photos`**

Configure its policies to allow authenticated users to upload/read files as defined in `rls_fixes.sql` and `supabase_admin_policies.sql`.

---

## 🤝 Contributing
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/awesome-feature`).
3. Commit your changes (`git commit -m 'Add awesome feature'`).
4. Push to the branch (`git push origin feature/awesome-feature`).
5. Open a Pull Request.

---

Made with ❤️ for a cleaner campus environment.
