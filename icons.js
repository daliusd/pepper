#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const request = require('request-promise-native');
const prompt = require('prompt');
const xmldoc = require('xmldoc');

const PATH_TO_SEARCH = '../icons/';
const SERVER = 'http://localhost:5000';

prompt.start();

var schema = {
    properties: {
        name: {
            pattern: /^[a-zA-Z\s\-]+$/,
            message: 'Name must be only letters, spaces, or dashes',
            required: true,
            default: 'dalius',
        },
        password: {
            hidden: true,
        },
    },
};

prompt.get(schema, function(err, result) {
    uploadImages(result.name, result.password);
});

const uploadImages = async (username, password) => {
    const svgs = glob.sync(PATH_TO_SEARCH + '**/*.svg');
    let accessToken = null;

    try {
        const form = {
            username,
            password,
        };

        const resp = await request.post({ url: `${SERVER}/api/tokens`, form, json: true });
        accessToken = resp['accessToken'];
    } catch (err) {
        console.error('Upload failed:', err);
        return;
    }

    if (accessToken === undefined) {
        console.error('Token is undefined.');
        return;
    }

    for (const image of svgs) {
        let name = image.substring(PATH_TO_SEARCH.length).replace(/\//g, ' ');
        name = name.replace('.svg', '');
        name = name.replace(' svg ', ' ');
        name = name.replace(' originals ', ' ');

        console.log(`Processing ${name}.`);

        const svg_data = fs.readFileSync(image, 'utf8');
        let doc = new xmldoc.XmlDocument(svg_data);
        doc.children = doc.children.filter(el => el.name !== 'path' || 'fill' in el.attr);
        for (let child of doc.children) {
            if (child.name === 'path' && 'fill' in child.attr) {
                child.attr['fill'] = '#000';
            }
        }

        try {
            const formData = {
                global: 'true',
                name,
                image: {
                    value: doc.toString({ compressed: true }),
                    options: {
                        filename: 'name' + '.svg',
                    },
                },
            };

            const headers = {
                Authorization: `Bearer ${accessToken}`,
            };

            const resp = await request.post({ url: `${SERVER}/api/images`, headers, formData });
            console.log(resp);
        } catch (err) {
            console.error('Upload failed:', err.statusCode);
        }
    }
};
