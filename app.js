import express from "express";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import cors from "cors";
import { CheckAuth } from "./middlewares/authMiddleware.js";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import { generalLimiter } from "./middlewares/rateLimitMiddleware.js";
import { errorHandler } from "./middlewares/errorHandlerMiddleware.js";

await connectDB();

const app = express();
const port = process.env.PORT || 4000;

const mySecretKey = process.env.MYSECRET;

app.use(
  cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ["http://localhost:3000"],
    credentials: true,
  })
);

app.get("/health", (req, res) => {
  res.send("itsrunning")
})

app.use(cookieParser(mySecretKey));

app.use(express.json());

app.use(generalLimiter);

app.use("/", userRoutes);

app.use("/", adminRoutes);

app.use("/", activityRoutes);

app.use("/", dashboardRoutes);

// Global error handler - must be last
app.use(errorHandler);

app.listen(port, () => {
  console.log("Server is running on port 4000");
});
