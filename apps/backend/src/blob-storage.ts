import { BlobServiceClient, ContainerClient } from "@azure/storage-blob"
import fs from "fs/promises"
import path from "path"
import { createReadStream } from "fs"
import { tmpdir } from "os"

const containerName = "gdsd"
const metadataKeys = {
    MIMETYPE: "mimetype"
}

// Local storage folder
const STORAGE_DIR = path.join(process.cwd(), "local-storage", containerName)

export class BlobStorage {
    private static client: BlobServiceClient | null = null
    private static containerClient: ContainerClient | null = null
    private static useLocalStorage = false

    static async init() {
        try {
            const connectionString = process.env["BLOB_STORAGE"]
            if (!connectionString) {
                console.warn("BLOB_STORAGE environment variable not set, using local storage")
                await BlobStorage.initLocalStorage()
                return
            }

            // create clients
            BlobStorage.client = BlobServiceClient.fromConnectionString(connectionString)
            BlobStorage.containerClient = BlobStorage.client.getContainerClient(containerName)

            // create container if it does not exist
            await BlobStorage.containerClient.createIfNotExists()
        }
        catch (error) {
            console.warn("Failed to initialize Azure blob storage, using local storage instead:", error.message)
            await BlobStorage.initLocalStorage()
        }
    }

    private static async initLocalStorage() {
        BlobStorage.useLocalStorage = true
        try {
            await fs.mkdir(STORAGE_DIR, { recursive: true })
            const metadataDir = path.join(STORAGE_DIR, "_metadata")
            await fs.mkdir(metadataDir, { recursive: true })
            console.log(`Local storage initialized at ${STORAGE_DIR}`)
        }
        catch (error) {
            console.error("Failed to initialize local storage:", error)
            throw error
        }
    }

    static async upload(id: string, filePath: string, mimeType: string) {
        if (BlobStorage.useLocalStorage) {
            // Copy file to local storage
            const destPath = path.join(STORAGE_DIR, id)
            const fileContent = await fs.readFile(filePath)
            await fs.writeFile(destPath, fileContent)

            // Save metadata
            const metadataPath = path.join(STORAGE_DIR, "_metadata", id + ".json")
            await fs.writeFile(metadataPath, JSON.stringify({
                [metadataKeys.MIMETYPE]: mimeType
            }))

            return {
                etag: new Date().getTime().toString(),
                lastModified: new Date()
            }
        }
        else {
            const client = BlobStorage.containerClient!.getBlockBlobClient(id)
            return await client.uploadFile(filePath, {
                metadata: {
                    [metadataKeys.MIMETYPE]: mimeType
                }
            })
        }
    }

    static async get(id: string) {
        if (BlobStorage.useLocalStorage) {
            const filePath = path.join(STORAGE_DIR, id)
            const metadataPath = path.join(STORAGE_DIR, "_metadata", id + ".json")

            try {
                const buffer = await fs.readFile(filePath)
                const metadataRaw = await fs.readFile(metadataPath, "utf-8")
                const metadata = JSON.parse(metadataRaw)
                const mimeType = metadata[metadataKeys.MIMETYPE]

                return {
                    buffer,
                    mimeType
                }
            }
            catch (error) {
                throw new Error(`File with id ${id} not found: ${error.message}`)
            }
        }
        else {
            const client = BlobStorage.containerClient!.getBlockBlobClient(id)
            const properties = await client.getProperties()
            const buffer = await client.downloadToBuffer()
            const mimeType = properties.metadata![metadataKeys.MIMETYPE]!
            return {
                buffer,
                mimeType
            }
        }
    }
}
