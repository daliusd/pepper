#!/usr/bin/env node

const fs = require('fs');
const { registerFont, createCanvas } = require('canvas');

const webFonts = JSON.parse(fs.readFileSync('../saffron/src/components/webfonts.json'));

if (!fs.existsSync('thumbs')) {
    fs.mkdirSync('thumbs');
}

for (const fontName in webFonts) {
    console.log(fontName);
    const ttfs = webFonts[fontName];
    let variant = 'regular';
    if (!('regular' in ttfs)) {
        variant = Object.keys(ttfs)[0];
    }

    let filename = `fonts/${fontName}.${variant}.ttf`;
    let family = fontName;

    registerFont(filename, { family });

    const canvas = createCanvas(240, 32);
    const ctx = canvas.getContext('2d');

    ctx.font = `20px "${family}"`;
    ctx.fillText(family, 2, 20);

    const thumbFilename = `thumbs/${family}.png`;
    const out = fs.createWriteStream(thumbFilename);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
}
