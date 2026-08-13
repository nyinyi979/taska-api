"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handleFormData;
function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    while (keys.length > 1) {
        const key = keys.shift();
        const nextKey = keys[0];
        const isArrayIndex = !isNaN(Number(nextKey));
        if (!(key in current)) {
            current[key] = isArrayIndex ? [] : {};
        }
        current = current[key];
    }
    const finalKey = keys[0];
    if (Array.isArray(current) && !isNaN(Number(finalKey))) {
        current[Number(finalKey)] = value;
    }
    else {
        current[finalKey] = value;
    }
}
async function handleFormData(parts) {
    const body = {};
    let imageBuffer = null;
    for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "file") {
            imageBuffer = await part.toBuffer();
            body.image = {
                filename: part.filename,
                mimetype: part.mimetype,
                buffer: imageBuffer,
            };
        }
        else if (part.type === "field") {
            setNestedValue(body, part.fieldname, part.value);
        }
    }
    return { body, imageBuffer };
}
