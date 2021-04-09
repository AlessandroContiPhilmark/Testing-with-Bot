require('./asyncForEach').asyncCallback = true;
const fs = require('fs');

var progress = {
    slideIndex, createImages,
    folderIndex, overrideImages,
    headless
} = JSON.parse(fs.readFileSync('./progress.json'));
console.log('Progress: ', progress);

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const timer = ms => new Promise(res => setTimeout(res, ms));
const {
	listenPromise,
	firePromise,
	enableTagPromise
} = require('./eventPromise')
const navigationOptions = {
    timeout: 5 * 60 * 1000,
    waitUntil: ['load', 'domcontentloaded', 'networkidle0']
};
const viewport = { width: 1366, height: 613, deviceScaleFactor: 1 };
const puppeteerConfig = {
    slowMo: 300,
    ignoreHTTPSErrors: true,
    product: 'chrome',
    headless,
    // ignoreDefaultArgs: ['--mute-audio'],
    args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--autoplay-policy=no-user-gesture-required',
        '--mute-audio',
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
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36';
const USERNAME = 'USER440861189';
const PASSWORD = '4417085';
const domain = 'https://cmbhs.opnebinail.it/aula/';

function getTime(timeStr){
    return timeStr.replace(/\s/g, '').split('/').map(duration => duration.split(':')
        .reverse()
        .map( (x, i) => x * Math.pow(60, i))
        .reduce((x, y) => x + y)
    )
}



async function start(){
    var page_1
    var browser 
    var terminate = false
    async function stop(){
        console.log('Stopping')
        try { await page_1.close(); } catch (error) {
            console.log('Error while closing page')
        }
        try { await browser.close(); } catch (error) {
            console.log('Error while closing browser')
        }
    }
    async function postNavigationReset(){
        await page_1.evaluate(() => {
            $('.box-confirm').off('click')
        })
    }
    try {
        ( async () => {
            while(!terminate) {
                try {
                    await timer(3 * 1000)
                    console.log('Checking for error modal...')
                    terminate = await page_1.evaluate(() => $('#modal-errorBlock.in').get(0) != undefined)
                } catch (error) {}
            }
            console.log('Detected error modal, shutting down page')
        })()
    
        browser = await puppeteer.launch(puppeteerConfig).catch( error => {
            console.error('Could not launch browser');
            throw error;
        });
        page_1 = (await browser.pages())[0];
        await page_1.setUserAgent(userAgent)
        await page_1.setExtraHTTPHeaders({
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
        });
        module.exports = { browser, page_1 };
        page_1.on('pageerror', (err) => {
            console.error(err);
        });
    
        await page_1.setViewport(viewport),
        await page_1.goto(domain, navigationOptions),
        await page_1.select('select.form-control', 'INT'),
        await page_1.type('.form-horizontal .form-group:nth-of-type(2) input', USERNAME),
        await page_1.type('.form-horizontal .form-group:nth-of-type(3) input', PASSWORD),
        page_1.click('.form-horizontal .form-group:nth-of-type(4) button'),
        await page_1.waitForNavigation(navigationOptions),
        page_1.click('.pull-right a:nth-of-type(2)'),
        await page_1.waitForNavigation(navigationOptions)
    
        var pdfNamePath = './pdfs/LAVORO/pdf_'
    
        var endCycle_1 = false
        while(!endCycle_1 && !terminate){
            await postNavigationReset()
            folders = await page_1.$$('.has-sub')
            await folders[folderIndex].click()
            slides = await page_1.$$('li.has-sub.open > ul > li > a')
            await slides[slideIndex].click()
            await page_1.waitForNavigation(navigationOptions)
            
            var iframe = await page_1.$('iframe.embed-responsive-item');
            var frame = await iframe.contentFrame();
    
            var playButton = await frame.$('button.component_base.std.play')
            var playing = async () => await playButton.evaluate(elem => elem.getAttribute('aria-label') != 'play')
    
            await page_1.click('#colScorm .embed-responsive button.btn.btn-default')
            await page_1.hover('iframe')
    
            var isPlaying = await playing()
            if(!isPlaying) {
                await playButton.evaluate(elem => elem.click())
            }
            var counter = 0
            var endCycle_2 = false
            while(!endCycle_2 && !terminate){
                var path = pdfNamePath + slideIndex + '_' + counter + '.png'
                if (!fs.existsSync(path)){
                    var videoEnded = false
                    while(!videoEnded && !terminate){
                        await timer(1000)
                        var labelTime = await frame.$eval('.label.time', elem => elem.textContent)
                        labelTime = getTime(labelTime)
                        if(labelTime[1] - labelTime[0] <= 2) {
                            console.log('Advancing time: ' + labelTime[0] + ' | ' + labelTime[1])
                            videoEnded = true
                        }
                    }
                    await playButton.click()
                    // await page_1.pdf({ path: pdfNamePath + slideIndex + '.pdf' })
                    await page_1.hover('iframe')
                    await page_1.screenshot({ path })
                } else {
                    await playButton.click()
                }
                await timer(1000)
                counter++
                var succButton = await frame.$('button.component_base.next')
                var disabled = await succButton.evaluate(elem => elem.getAttribute('disabled') != null)
                if(!disabled) {
                    await succButton.evaluate(elem => elem.click())
                }
                else endCycle_2 = true
            }
            await page_1.click('#colScorm .embed-responsive button.btn.btn-default')
            slideIndex++
            progress.slideIndex++
            console.log('Progress: ', progress);
            fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 4));
            if(slideIndex > 10) endCycle_1 = true
        }
        console.log('Slides finished, closing browser');
        await page_1.close();
        await browser.close(); 
    } catch (error) {
        terminate = true
        console.log('Error occurred: ' + error)
        await stop()
        console.log('Restarting in 10 seconds')
        await timer(10 * 1000)
        start()
    }
}
start()


// #modal-errorBlock
// se presente: $('#modal-errorBlock').get(0) = domElement
// altrimenti: $('#modal-errorBlock').get(0) = undefined