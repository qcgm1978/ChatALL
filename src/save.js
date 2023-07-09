const fs = require("fs");
const path = require("path");


export async function save_localStorage(getLocalStorage) {
    const objectToSave=await getLocalStorage('chatall-messages')
    // const objectToSave = JSON.stringify(local);

    const fileName = "object.json";
    const filePath = path.join(process.cwd(), fileName);

    fs.writeFile(filePath, objectToSave, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Successfully saved object to file ${fileName}`);
        }
    });
}
