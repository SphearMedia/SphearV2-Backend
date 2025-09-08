import { extname } from 'path';
import { Request } from 'express';
import { diskStorage } from 'multer';

export const multerConfig = {
  limits: { fileSize: 80 * 1024 * 1024 }, // 5MB
//   fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
//     console.log(`mimetype received: ${file.mimetype}`);
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(new Error('Only JPEG and PNG image files are allowed!'), false);
//     }
//     cb(null, true);
//   },
  // fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
  //   if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
  //     return cb(new Error('Only image files are allowed!'), false);
  //   }
  //   cb(null, true);
  // },
};
