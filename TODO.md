# TODO: Modernize Attendance Software for Tecno Skill Coaching

Status: [ ] Not started | [ ] In Progress | [x] Planned

## Approved Plan Steps (Breakdown)

### Phase 1: Setup & Dependencies
- [x] Update root package.json + frontend/package.json (add libs)
- [x] Update tailwind.config.js (Tecno Skill theme: primary #6C61FF, palette: purple-blue gradients #6C61FF/#A29BFE/#C4B5FD/#EDE9FE)
- [x] Install deps: Backend `npm i`; Frontend `cd frontend && npm i`
- [ ] Test local run

### Phase 2: Backend Enhancements
- [x] models/Batch.js: Add `teacherId` field (ref User)
- [x] models/Attendance.js: Add support bulk/qr (teacherId, late status, notes)
- [x] controllers/batchController.js + routes: Assign batches to teachers (filter by role)
- [x] middleware/authMiddleware.js: Added authorizeTeacherBatch
- [x] New controllers/notificationController.js + routes + socket.io server (basic email; socket in future)
- [x] controllers/attendanceController.js: Bulk mark, QR endpoint (updated for teacher/status)

### Phase 3: Frontend UI Modernization (Responsive, #6C61FF theme)
- [x] src/index.css / App.css: Dark mode, custom scrollbar, animations, variables (--primary: #6C61FF)
- [ ] layouts/MainLayout.jsx: Collapsible sidebar (icons), topbar (search, profile), mobile hamburger, responsive
- [x] components/ complete: DataTable, Modal, SearchBar, Skeleton (Framer/TanStack, theme).
- [ ] pages/Dashboard.jsx: Analytics cards, charts (attendance trends), responsive grid
- [ ] pages/Batches.jsx: Assign teachers dropdown (by role), data table
- [ ] pages/Students.jsx: Batch filter, teacher view limit
- [ ] pages/Attendance.jsx: Calendar (react-calendar), bulk checkbox, QR scanner, teacher-batch filter
- [ ] pages/Reports.jsx: Multi-charts, export PDF/CSV buttons

### Phase 4: Integration & Responsiveness
- [ ] services/: Update apis for new endpoints, add SocketContext for realtime
- [ ] All pages: Framer-motion transitions, responsive (Tailwind sm/md/lg), skeletons on load
- [ ] PrivateRoute.jsx: Role/batch checks
- [ ] Test mobile/desktop

### Phase 5: Deploy & Test
- [ ] Update README.md (Tecno Skill, new features, env vars)
- [ ] Commit/push/PR
- [ ] Redeploy Vercel/Render, test live

Progress tracked here. Next: Install deps (npm i).
