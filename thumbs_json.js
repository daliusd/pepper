#!/usr/bin/env node

const fs = require('fs');
const webFonts = JSON.parse(fs.readFileSync('../saffron/src/components/webfonts.json'));

let webFontsThumbs = {};

for (const fontName in webFonts) {
    console.log(fontName);
    const thumbFilename = `thumbs/${fontName}.png`;

    let pngData = fs.readFileSync(thumbFilename);
    let buff = Buffer.from(pngData);
    let base64data = buff.toString('base64');

    webFontsThumbs[fontName] = base64data;
}

fs.writeFileSync('../saffron/src/components/webfonts_thumbs.json', JSON.stringify(webFontsThumbs, null, 2));
