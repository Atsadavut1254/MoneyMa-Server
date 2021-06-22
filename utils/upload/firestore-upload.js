const { format } = require('util');

const { admin } = require('../../config/firebase-config');

const bucket = admin.storage().bucket();
const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/`;

exports.uploadFiletoStorage = (fileName, buffer, folderName, id) => {
    return new Promise(async (resolve, reject) => {
        let newFilename = `${Date.now()}_${fileName}`;
        let blob = bucket.file(`${folderName}/${id}/${newFilename}`);

        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: `text/csv`
            }
        });

        blobStream.on('error', (err) => {
            reject(`Unable to upload image, something went wrong`);
        });
        blobStream.on('finish', () => {
            const pubilcUrl = format(
                `${baseUrl}${folderName}%2F${id}%2F${newFilename}?alt=media`
            );
            resolve(pubilcUrl);
        });
        blobStream.end(buffer);
    });
};
