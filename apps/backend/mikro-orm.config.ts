import "reflect-metadata"
import { ReflectMetadataProvider } from "@mikro-orm/core"
import { defineConfig, type Options } from "@mikro-orm/mysql"
import { tryParseEnv } from "@gdsd/common/util"
import { LandlordQuestionnaire, MediaFile, Property, User, FavoriteProperty, Message, TenantQuestionnaire, SearchHistoryV2 } from "./src/entities"
import { Amenity } from "./src/entities/Amenity"
import { Migrator } from "@mikro-orm/migrations"

tryParseEnv()

export const options: Options = {
    metadataProvider: ReflectMetadataProvider,
    entities: [Amenity, FavoriteProperty, LandlordQuestionnaire, MediaFile, Message, Property, SearchHistoryV2, User, TenantQuestionnaire],
    clientUrl: process.env["DATABASE_URL"] ?? process.env["DB_CONNECTION"],
    seeder: {
        path: "./dist/db/seeders",
        pathTs: "./src/db/seeders"
    },
    allowGlobalContext: true,
    extensions: [Migrator],
    migrations: {
        path: "./dist/db/migrations",
        pathTs: "./src/db/migrations",
        snapshotName: ".snapshot"
    }
}

export default defineConfig(options)
