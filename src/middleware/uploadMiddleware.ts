import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

// Type definitions
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

type UploadLocation = 0 | 1 | 2 | 3 | 4 | 5;
type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

// Use process.cwd() for the base directory
const uploadBaseDir: string = path.join(process.cwd(), 'uploads');

const folders: string[] = ['products', 'retailers', 'attendance', 'visitLogs', 'forumDocuments', 'whatsappMedia'];

const ensureUploadDirExists = (dir: string): void => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const uploadFile = (
    req: MulterRequest, 
    res: Response, 
    uploadLocation: UploadLocation, 
    key: string
): Promise<void> => {
    
    if (!folders[uploadLocation]) {
        return Promise.reject(new Error(`Invalid upload location: ${uploadLocation}`));
    }

    const uploadDir: string = path.join(uploadBaseDir, folders[uploadLocation]);

    const storage = multer.diskStorage({
        destination: (req, file, cb: DestinationCallback) => {
            ensureUploadDirExists(uploadDir);
            cb(null, uploadDir);
        },
        filename: (req, file, cb: FileNameCallback) => {
            const timestamp: string = new Date().toISOString().replace(/:/g, '-');
            const fileName: string = `${timestamp}_${file.originalname}`;
            cb(null, fileName);
        },
    });

    const upload = multer({ 
        storage,
        limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    }).single(key);

    return new Promise<void>((resolve, reject) => {
        upload(req, res, (err: any) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    reject(new Error('File too large. Maximum size is 10MB.'));
                } else {
                    reject(err);
                }
            } else {
                if (!req.file) {
                    reject(new Error('No file uploaded'));
                } else {
                    resolve();
                }
            }
        });
    });
};

export default uploadFile;