require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/dependent");
const medicationRoutes = require("./routes/medication");

// Initialize Firebase Admin SDK
const { initializeFirebaseAdmin } = require("./config/firebase-admin");
initializeFirebaseAdmin();

// Initialize notification scheduler
const { loadPendingSchedules } = require("./services/notificationSchedulerService");

const app = express();
app.use(cors({
  origin: [
    'http://localhost:8081',
    'https://medrem.pages.dev'
  ],
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/medications", medicationRoutes);


const PORT = process.env.PORT || 5001;
//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Load all pending notification schedules
  try {
    await loadPendingSchedules();
    console.log('[Scheduler] Pending schedules loaded successfully');
  } catch (error) {
    console.error('[Scheduler] Error loading pending schedules:', error);
  }
});

