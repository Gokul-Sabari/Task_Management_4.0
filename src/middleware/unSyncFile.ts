import fs from 'fs/promises';

const fileRemoverMiddleware = async (filePath: string): Promise<void> => {
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`File deleted: ${filePath}`);
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
            console.log(`File not found: ${filePath}`);
            return;
        }
        throw err;
    }
};

export default fileRemoverMiddleware;