#!/usr/bin/env node

const fs = require('fs');
const cp = require('child_process');

let download = async function(uri, filename) {
    let command = `curl -o '${filename}' '${uri}'`;
    cp.execSync(command);
};

const webFonts = JSON.parse(fs.readFileSync('../saffron/src/components/webfonts.json'));

if (!fs.existsSync('fonts')) {
    fs.mkdirSync('fonts');
}

for (const fontName in webFonts) {
    console.log(fontName);
    const ttfs = webFonts[fontName];
    for (const variant in ttfs) {
        console.log(variant, ttfs[variant]);
        let filename = `fonts/${fontName}.${variant}.ttf`;
        if (!fs.existsSync(filename)) {
            download(ttfs[variant], filename);
        }
    }
}
