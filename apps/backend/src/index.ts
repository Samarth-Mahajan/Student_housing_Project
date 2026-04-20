import { BlobStorage } from "./blob-storage"
import cors from "cors"
import express from "express"
import { Server } from "socket.io"
import { createServer } from "node:http"
import { tryParseEnv } from "@gdsd/common/util"
import { mediaRouter } from "./routers/media.router"
import { propertyRouter } from "./routers/property.router"
import { amenityRouter } from "./routers/amenity.router"
import { useChat } from "./chat"
import { RequestContext } from "@mikro-orm/mysql"
import { DB, initDatabase } from "./db"
import { questionnaireRouter } from "./routers/questionnaire.router"
import { chatRouter } from "./routers/chat.router"
import { loginRouter } from "./routers/login.router"
import { profileRouter } from "./routers/profile.router"
import { favoritesRouter } from "./routers/favorite.router"
import { propertyReviewRouter } from "./routers/propertyreview.router"
import { insightsRouter } from "./routers/insights.router"
import { searchHistoryRouter } from "./routers/searchHistory.router" // Add search history router

tryParseEnv()
const port = process.env["PORT"] ?? process.env["BACKEND_PORT"] ?? "5000"
const defaultOrigins = ["http://localhost:3000"]

function parseOrigins(envValue: string | undefined, fallback: string[]) {
    if (!envValue) {
        return fallback
    }

    const origins = envValue
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean)

    return origins.length > 0 ? origins : fallback
}

const origins = parseOrigins(process.env["CORS_ORIGIN"], defaultOrigins)

;(async () => {
    // initialize s3 & db
    await BlobStorage.init()
    await initDatabase()

    const app = express()
    const server = createServer(app)
    const io = new Server(server, {
        cors: { origin: origins }
    })

    useChat(io)

    app.use(cors({ origin: origins }))
    app.use(express.json())
    app.use(express.static("public"))

    // Request context for MikroORM
    app.use((_req, _res, next) => {
        RequestContext.create(DB.em, next)
    })


    // Use routers
    app.use("/media", mediaRouter)
    app.use("/properties", propertyRouter)
    app.use("/amenity", amenityRouter)
    app.use("/questionnaire", questionnaireRouter)
    app.use("/chat", chatRouter)
    app.use("/auth", loginRouter)
    app.use("/profile", profileRouter)
    app.use("/review", propertyReviewRouter)
    app.use("/favorites", favoritesRouter)
    app.use("/insights", insightsRouter)
    app.use("/search-history", searchHistoryRouter) // Add search history router

    server.on("error", (error) => {
        if ("code" in error && error.code === "EADDRINUSE") {
            console.error(`Port ${port} is already in use. Stop the existing backend process or change BACKEND_PORT in .env.`)
            process.exit(1)
        }

        throw error
    })

    server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
    })
})()
