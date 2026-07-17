import express from "express"
import dotenv from "dotenv";
import routerMedia from "./routes/anilist.routes.js";
import routerAuth from "./routes/auth.routes.js";

dotenv.config()

const app = express()
app.use(express.json())

app.use(routerMedia)
app.use(routerAuth)

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Server running on port ${port}`))