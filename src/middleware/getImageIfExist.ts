import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

const domain: string = process.env.domain || '';

const getImage = (folder: string, image: string): string => {
    if (!folder || !image) {
        return `${domain}imageURL/imageNotFound`;
    }

    const defaultImageUrl: string = `${domain}imageURL/imageNotFound`;
    const imageUrl: string = `${domain}imageURL/${folder}/${image}`;
    const imagePath: string = path.join(__dirname, '..', 'uploads', folder, image);

    return fs.existsSync(imagePath) ? imageUrl : defaultImageUrl;
};

export default getImage;