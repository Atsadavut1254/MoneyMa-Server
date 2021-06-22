const excel = require('exceljs');

exports.gennerateExcel = async (data) => {
    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet('sheet 1');

    // set header column
    worksheet.columns = [
        { header: 'songId', key: 'songId' },
        { header: 'guestId', key: 'guestId' },
        { header: 'amount', key: 'amount' },
        { header: 'greeting', key: 'greeting' }
    ];

    // add arrays rows
    for (d of data) {
        worksheet.addRow(d);
    }

    // wirte data to csv
    return new Promise((resolve, reject) => {
        workbook.csv
            .writeBuffer()
            .then((buffer) => {
                resolve(buffer);
            })
            .catch((err) => {
                reject(err);
            });
    });
};
