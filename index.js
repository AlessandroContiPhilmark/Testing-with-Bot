require('./asyncForEach').asyncCallback = true;
const fs = require('fs');

var progress = {
    slideIndex, createImages,
    folderIndex, overrideImages,
    headless
} = JSON.parse(fs.readFileSync('./progress.json'));
console.log('Progress: ', progress);

const puppeteer = require('puppeteer');
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
    ignoreHTTPSErrors: true,
    product: 'chrome',
    headless,
    args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
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

const USERNAME = 'USER440861189';
const PASSWORD = '4417085';
const domain = 'https://cmbhs.opnebinail.it/aula/';

var page_1
function getTime(timeStr){
    return timeStr.replace(/\s/g, '').split('/').map(duration => duration.split(':')
        .reverse()
        .map( (x, i) => x * Math.pow(60, i))
        .reduce((x, y) => x + y)
    )
}
async function postNavigationReset(){
    await page_1.evaluate(() => {
        $('.box-confirm').off('click')
    })
}


(async () => {
    var browser = await puppeteer.launch(puppeteerConfig).catch( error => {
        console.error('Could not launch browser');
        throw error;
    });
    page_1 = (await browser.pages())[0];

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
    while(!endCycle_1){
        await postNavigationReset()
        slides = await page_1.$$('li.has-sub.open > ul > li > a')
        await slides[slideIndex].click()
        await page_1.waitForNavigation(navigationOptions)
        
        var iframe = await page_1.$('iframe.embed-responsive-item');
        var frame = await iframe.contentFrame();

        var playButton = await frame.$('button.component_base.std.play')
        var playing = async () => await playButton.evaluate(elem => elem.getAttribute('aria-label') != 'play')

        var isPlaying = await playing()
        if(!isPlaying){
            await playButton.evaluate(elem => elem.click())
        }
        var counter = 0
        var endCycle_2 = false
        while(!endCycle_2){
            var videoEnded = false
            while(!videoEnded){
                var labelTime = await frame.$eval('.label.time', elem => elem.textContent)

            }
            labelTime = getTime(labelTime)[1] - getTime(labelTime)[0]
            console.log('Time: ' + labelTime + ' Waiting: ' + (9/10) * labelTime)
            await timer( (9/10) * labelTime)
            await playButton.click()
            // await page_1.pdf({ path: pdfNamePath + slideIndex + '.pdf' })
            var path = pdfNamePath + slideIndex + '_' + counter + '.png'
            if (!fs.existsSync(path))
                await page_1.screenshot({ path })
            counter++
            var succButton = await frame.$('button.component_base.next')
            var disabled = await succButton.evaluate(elem => elem.getAttribute('disabled') != null)
            if(!disabled) {
                await succButton.evaluate(elem => elem.click())
            }
            else endCycle_2 = true
        }
        slideIndex++
        progress.slideIndex++
        console.log('Progress: ', progress);
        fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 4));
        if(slideIndex > 10) endCycle_1 = true
    }




    return

 
    var slide = await page_1.$$('#ygtvc9 > .ygtvitem > .ygtvchildren > .ygtvitem .ygtvcontent')
    slide = slide[slideIndex]
    await slide.click()
    var images = await page_1.evaluate(() => $('.ps-current ul li img').map(function(){
        return $(this).attr('src')
    }).toArray())

    var mainFolder = "./pdfs"
    if (!fs.existsSync(mainFolder))
        fs.mkdirSync(mainFolder);
    var folderPath = mainFolder + "/" + slideName
    if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath)
    if(createImages){
        var page_2 = await browser.newPage()
        await page_2.setViewport(viewport)
        await images.asyncForEach(async (imgUrl, index) => {
            var path = folderPath + "/" + slideName + "_" + (++index) + ".png"
            if(overrideImages || !fs.existsSync(path)){
                var url = domain + 'fad/' + imgUrl
                await page_2.goto(url, navigationOptions)
                console.log('Navigated to: ' + url)
                await page_2.screenshot({ path })
                console.log('Created: ' + path)
            } else console.log('Already existing: ' + path)
        })
        await page_2.close()
    }
    await timer(3 * 1000)
    var endCycle = false
    while(!endCycle){
        try {
            await page_1.waitForSelector('.minutes')
            await page_1.waitForSelector('.seconds')
            await page_1.waitForSelector('.pgwSlideshow .ps-caption b')
            
            var minutesText = await page_1.$eval('.minutes', elem => elem.textContent)
            var secondsText = await page_1.$eval('.seconds', elem => elem.textContent)
            var slideNumber = await page_1.$eval('.pgwSlideshow .ps-caption b', elem => elem.textContent)
            slideNumber = slideNumber.substr( slideNumber.lastIndexOf('°') + 1 )

            var randomTimer = Math.random() * 2 + 1
            var minutes = Math.floor(randomTimer)
            var seconds = Math.round(randomTimer % 1 * 60)
            console.log(
                "Advancing: " + slideName + " " + slideNumber +
                " | Time Remaining: " + minutesText + ":" + secondsText +
                " | Random time wait: " + minutes + ":" + seconds
            )
            await page_1.$eval('.ps-next', elem => elem.click())
            await timer(randomTimer * 60  * 1000)
        } catch (error) {
            console.error(error)
        }
    }
    console.log('Urls finished, closing browser');
    await page_1.close();
    await browser.close();
})()