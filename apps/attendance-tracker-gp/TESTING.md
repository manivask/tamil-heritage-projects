# Testing & Deployment Instructions (Attendance Tracker GP)

This guide explains how to test the Attendance Tracker GP on Windows and how to use it on your mobile device.

## Core Features to Test

1. **Role-Based Login**:
   - The app implements a simplified role-based security gate. Select a location and your primary role (Teacher or Admin) to log in.
   - **Teacher Login**: Use the password `teacher`.
   - **Admin Login**: Use the password `admin`.

2. **Attendance Management**:
   - Marking Students/Teachers as Present (P) or Absent (A).
   - Filtering lists by status (All, Present, Absent, Unmarked).
   - Searching by name or ID.

3. **Data Import/Export**:
   - Import organization data using an Excel spreadsheet.
   - Export current attendance and audit logs to Excel.

4. **Audit Logs**:
   - All changes are tracked in the Audit Log section (accessible by Admin).

## Local Development (Browser)

1. Open `index.html` in any modern web browser (Chrome, Edge, Safari).
2. Use the **Simulation Panel** (bottom right) to test different dates and times.
3. Drag and drop your organization's Excel file onto the dashboard to load data.

## Mobile Deployment (Android)

1. **Prerequisites**: Android Studio installed.
2. **Setup**:
   - Run `npx cap sync android` to copy web assets to the Android project.
   - Open the `android` folder in Android Studio.
3. **Build**:
   - Connect your Android device via USB or use an Emulator.
   - Click the **Run** button in Android Studio.
4. **Publishing**:
   - Follow the `PlayStore_Publishing_Guide.html` for release steps.
