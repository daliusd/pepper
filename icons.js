#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const request = require('request-promise-native');
const prompt = require('prompt');
const xmldoc = require('xmldoc');

const PATH_TO_SEARCH = '../icons/';
const SERVER = 'http://localhost:5000';

const folderToAuthor = {
    lorc: 'Lorc, http://lorcblog.blogspot.com',
    delapouite: 'Delapouite, http://delapouite.com',
    'john-colburn': 'John Colburn, http://ninmunanmu.com',
    felbrigg: 'Felbrigg, http://blackdogofdoom.blogspot.co.uk',
    'john-redman': 'John Redman, http://www.uniquedicetowers.com',
    'carl-olsen': 'Carl Olsen, https://twitter.com/unstoppableCarl',
    sbed: 'Sbed, http://opengameart.org/content/95-game-icons',
    willdabeast: 'Willdabeast, http://wjbstories.blogspot.com',
    'viscious-speed': 'Viscious Speed, http://viscious-speed.deviantart.com - CC0',
    'lord-berandas': 'Lord Berandas, http://berandas.deviantart.com',
    irongamer: 'Irongamer, http://ecesisllc.wix.com/home',
    'heavenly-dog': 'HeavenlyDog, http://www.gnomosygoblins.blogspot.com',
    lucasms: 'Lucas',
    faithtoken: 'Faithtoken, http://fungustoken.deviantart.com',
    skoll: 'Skoll',
    andymeneely: 'Andy Meneely, http://www.se.rit.edu/~andy/',
    cathelineau: 'Cathelineau',
    'kier-heyl': 'Kier Heyl',
    aussiesim: 'Aussiesim',
    sparker: 'Sparker, http://citizenparker.com',
    zeromancer: 'Zeromancer - CC0',
    rihlsul: 'Rihlsul',
    quoting: 'Quoting',
    guard13007: 'Guard13007, https://guard13007.com',
    darkzaitzev: 'DarkZaitzev, http://darkzaitzev.deviantart.com',
    spencerdub: 'SpencerDub',
    generalace135: 'GeneralAce135',
    zajkonur: 'Zajkonur',
};

prompt.override = require('yargs').argv;
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
        server: {
            message: 'Server to upload icons to',
            required: true,
            default: SERVER,
        },
    },
};

prompt.get(schema, function(err, result) {
    uploadImages(result.name, result.password, result.server);
});

const uploadImages = async (username, password, server) => {
    const svgs = glob.sync(PATH_TO_SEARCH + '**/*.svg');
    let accessToken = null;

    try {
        const form = {
            username,
            password,
        };

        const resp = await request.post({ url: `${server}/api/tokens`, form, json: true });
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

        let author = name.split(' ')[0];
        let attribution = undefined;
        if (author in folderToAuthor) {
            attribution = folderToAuthor[author];
            console.log(`Attribution ${attribution}`);
        }

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
                metadata: JSON.stringify({ source: 'game-icons', attribution }),
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

            const resp = await request.post({ url: `${server}/api/images`, headers, formData });
            console.log(resp);
        } catch (err) {
            console.error('Upload failed:', err.statusCode);
        }
    }
};
