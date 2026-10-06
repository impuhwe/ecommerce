"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../src/models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
(async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce_db";
    try {
        await mongoose_1.default.connect(mongoUri);
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.error("Missing admin environment variables");
            process.exit(1);
        }
        const existingAdmin = await User_1.default.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log("Admin already exists, skipping creation");
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(ADMIN_PASSWORD, 10);
        const adminUser = new User_1.default({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin",
        });
        await adminUser.save();
        console.log("Admin user created successfully");
    }
    catch (error) {
        console.error("Error creating admin user:", error);
        process.exit(1);
    }
    finally {
        mongoose_1.default.connection.close();
    }
})();
//# sourceMappingURL=seedAdmin.js.map