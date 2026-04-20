import { v2 as cloudinary } from "cloudinary"

const cloudinaryFolder = "gdsd"

export class BlobStorage {
    private static getCloudinaryPublicId(id: string) {
        return `${cloudinaryFolder}/${id}`
    }

    private static isCloudinaryNotFoundError(error: unknown) {
        if (!error || typeof error !== "object") {
            return false
        }

        const cloudinaryError = error as { http_code?: number, message?: string }
        return cloudinaryError.http_code === 404 || cloudinaryError.message?.toLowerCase().includes("not found") === true
    }

    private static async getFromCloudinary(id: string) {
        const publicId = BlobStorage.getCloudinaryPublicId(id)
        const resourceTypes: Array<"image" | "video" | "raw"> = ["image", "video", "raw"]

        for (const resourceType of resourceTypes) {
            try {
                const resource = await cloudinary.api.resource(publicId, { resource_type: resourceType })
                const response = await fetch(resource.secure_url)

                if (!response.ok) {
                    throw new Error(`Failed to download Cloudinary file (${response.status})`)
                }

                const arrayBuffer = await response.arrayBuffer()
                return {
                    buffer: Buffer.from(arrayBuffer),
                    mimeType: response.headers.get("content-type") ?? "application/octet-stream"
                }
            }
            catch (error) {
                if (BlobStorage.isCloudinaryNotFoundError(error)) {
                    continue
                }

                throw error
            }
        }

        throw new Error(`File with id ${id} not found`)
    }

    static async init() {
        const cloudinaryUrl = process.env["CLOUDINARY_URL"]
        if (!cloudinaryUrl) {
            throw new Error("CLOUDINARY_URL environment variable is required")
        }

        // `cloudinary` keeps a module-level config cache. Because this module is imported
        // before `.env` is parsed during app startup, we need to force a refresh from
        // `process.env` here before applying extra options.
        cloudinary.config(true)
        cloudinary.config({ secure: true })
        const config = cloudinary.config()

        if (!config.cloud_name || !config.api_key || !config.api_secret) {
            throw new Error("Cloudinary configuration is invalid. Check CLOUDINARY_URL")
        }

        console.log("Cloudinary storage initialized")
    }

    static async upload(id: string, filePath: string) {
        const response = await cloudinary.uploader.upload(filePath, {
            public_id: BlobStorage.getCloudinaryPublicId(id),
            resource_type: "auto",
            overwrite: true,
            invalidate: true
        })

        return {
            etag: response.etag ?? new Date().getTime().toString(),
            lastModified: response.created_at ? new Date(response.created_at) : new Date()
        }
    }

    static async get(id: string) {
        return await BlobStorage.getFromCloudinary(id)
    }
}
