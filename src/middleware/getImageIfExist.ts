import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get domain from environment
const domain = process.env.domain;

// __dirname is available in CommonJS
const uploadsDir = path.join(__dirname, '..', 'uploads');

/**
 * Get image URL if exists, otherwise return imageNotFound URL
 * @param folder - Folder name (e.g., 'attendance', 'profile')
 * @param image - Image filename or null/undefined
 * @returns Full image URL or imageNotFound URL
 */
const getImage = (folder: string, image: string | null | undefined): string => {
    // Check if domain is configured
    if (!domain) {
       
        return '/imageURL/imageNotFound';
    }

    // Handle missing parameters
    if (!folder || !image) {
        return `${domain}imageURL/imageNotFound`;
    }

    const defaultImageUrl = `${domain}imageURL/imageNotFound`;
    const imageUrl = `${domain}imageURL/${folder}/${image}`;
    const imagePath = path.join(uploadsDir, folder, image);

    try {

        if (fs.existsSync(imagePath)) {
            return imageUrl;
        }
        
      
        
        return defaultImageUrl;
    } catch (error) {
        console.error(`Error checking image: ${imagePath}`, error);
        return defaultImageUrl;
    }
};

export default getImage;