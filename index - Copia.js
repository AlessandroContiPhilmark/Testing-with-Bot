require('./asyncForEach').asyncCallback = true;
const fs = require('fs');

var progress = { index } = JSON.parse(fs.readFileSync('./progress.json'));
progress.index = index || 0;
({index} = progress);
console.log('Progress: ', progress);
fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 4));

const puppeteer = require('puppeteer');
const timer = ms => new Promise(res => setTimeout(res, ms));

const navigationOptions = {
    timeout: 5 * 60 * 1000,
    waitUntil: ['load', 'domcontentloaded', 'networkidle0']
};
const viewport = { width: 1200, height: 600, deviceScaleFactor: 1 };
const puppeteerConfig = {
    product: 'chrome',
    // headless: false,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // '--disable-background-timer-throttling',
        // '--disable-backgrounding-occluded-windows',
        // '--disable-renderer-backgrounding',
        // '--allow-http-background-page',
        // '--disable-background-media-suspend',
        // '--disable-app-list-dismiss-on-blur',
    ],
    // executablePath: './node_modules/chromium/lib/chromium/chrome-win/chrome.exe'
    executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
};

const USERNAME = 'alessandro.conti';
const PASSWORD = 'Kronos_96';

const url = 'https://fingeco.opencons.net/';
// const url_1 = 'https://fingeco.opencons.net/ilias.php?ref_id=165&obj_id=598&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI';
// const url_2 = 'https://fingeco.opencons.net/ilias.php?ref_id=141&obj_id=338&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI';

const urls = [
    'https://fingeco.opencons.net/ilias.php?ref_id=165&obj_id=598&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI',
    'https://fingeco.opencons.net/ilias.php?ref_id=166&obj_id=616&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI',
    'https://fingeco.opencons.net/ilias.php?ref_id=167&obj_id=652&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI',
    'https://fingeco.opencons.net/ilias.php?ref_id=198&obj_id=1081&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI',
    'https://fingeco.opencons.net/ilias.php?ref_id=201&obj_id=1147&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI',
    'https://fingeco.opencons.net/ilias.php?ref_id=171&obj_id=1463&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI',
    'https://fingeco.opencons.net/ilias.php?ref_id=202&obj_id=1384&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI',
    'https://fingeco.opencons.net/ilias.php?ref_id=215&obj_id=1521&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI'
];



(async () => {
    // var timedstuff = async (val) => {
    //     await timer(1000);
    //     return val;
    // }

    // var x = await timedstuff(6).then( val => timedstuff(val) )
    // console.log(x);
    // return;

    var browser = await puppeteer.launch(puppeteerConfig).catch( error => {
        console.error('Could not launch browser');
        throw error;
    });
    var page_1 = (await browser.pages())[0];

    module.exports = { browser, page_1 };

    await page_1.setViewport(viewport),
    await page_1.goto(url, navigationOptions),
    await page_1.type('#username', USERNAME),
    await page_1.type('#password', PASSWORD),
    page_1.click('input.btn'),
    await page_1.waitForNavigation(navigationOptions),

    await urls.slice( index ).asyncForEach( async (url, index) => {
        url = progress.url || url;
        await page_1.goto( url , navigationOptions).catch( error => {
            console.error('Could not navigate to ', url);
            throw error;
        });

        var moduleTitle = await page_1.$('#il_mhead_t_focus');
        if(!moduleTitle) throw 'No module title found';
        moduleTitle = await moduleTitle.getProperty('textContent');
        moduleTitle = await moduleTitle.jsonValue()
        console.log('Entered: ', moduleTitle);

        while(true){
            progress.url = page_1.url();
            console.log('Progress: ', progress);
            fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 4));

            var pageTitle = await page_1.$('h1.ilc_page_title_PageTitle');
            if(!pageTitle) throw 'No page title found';
            pageTitle = await pageTitle.getProperty('textContent');
            pageTitle = await pageTitle.jsonValue()
            console.log('Navigated to: ', pageTitle);

            var extras = await page_1.$$('div.il_VAccordionToggleDef');

            extras.asyncForEach( async extra => await extra.click() ).catch( error => {
                console.error('Could not open hidden video');
                throw error;
            })
            await timer( 1 * 5 * 1000);
            var videoDurations = await page_1.$$('div.mejs-duration-container span');
            var buttons = await page_1.$$('div.mejs-playpause-button button');

            if(buttons.length == 0) {
                console.log('No videos found, idling in page for 10 minutes');
                await timer( 10 * 60 * 1000);
            }

            await buttons.asyncForEach( async (button, index) => {
                console.log('Playing with video');

                await button.click();
                var duration;
                do {
                    duration = await videoDurations[index].getProperty('textContent').then(
                        duration => duration.jsonValue()
                    );
                    await timer( 1 * 1 * 1000);
                } while(duration === '00:00');

                console.log('Video duration: ', duration);

                duration = duration.split(':')
                    .reverse()
                    .map( (x, i) => x * Math.pow(60, i))
                    .reduce((x, y) => x + y) * 1000
                ;
                console.log('Video duration milliseconds: ', duration);
                
                var keepFiddling = true;
                var fiddleInterval = Math.min(duration / 2, 1 * 60 * 1000);

                setTimeout( () => keepFiddling = false, duration);
                while(keepFiddling){
                    console.log('button: ', 'pause');
                    await button.click();
                    await timer( 1 * 1 * 300);
                    console.log('button: ', 'play');
                    await button.click();
                    await timer( fiddleInterval );
                }
            }).catch( error => {
                console.error('Could not play with buttons');
                throw error;
            })
            console.log('Finished Playing');

            var link = await page_1.$('a.ilc_page_rnavlink_RightNavigationLink');
            if(!link) {
                console.log('No "Continue" link found, exiting module: ', moduleTitle);
                break;
            };
            link.click();
            await page_1.waitForNavigation(navigationOptions);
        }
        progress.index++;
        progress.url = null;
        console.log('Progress: ', progress);
        fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 4));
    }).catch( async error => {
        console.error('An error occurred, closing browser ');
        await page_1.close();
        await browser.close();
        throw error;
    });
    console.log('Urls finished, closing browser');
    await page_1.close();
    await browser.close();
})()