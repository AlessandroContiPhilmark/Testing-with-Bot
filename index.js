require('./asyncForEach').asyncCallback = true;
const fs = require('fs');

var progress = { slideIndex, createImages } = JSON.parse(fs.readFileSync('./progress.json'));
console.log('Progress: ', progress);

const puppeteer = require('puppeteer');
const timer = ms => new Promise(res => setTimeout(res, ms));

const navigationOptions = {
    timeout: 5 * 60 * 1000,
    waitUntil: ['load', 'domcontentloaded', 'networkidle0']
};
const viewport = { width: 1366, height: 613, deviceScaleFactor: 1 };
const puppeteerConfig = {
    ignoreHTTPSErrors: true,
    product: 'chrome',
    headless: false,
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

const USERNAME = 'Conti_Alessandro';
const PASSWORD = 'Conti';

const domain = 'https://ascen.piattaformafad.com/';

(async () => {
    var browser = await puppeteer.launch(puppeteerConfig).catch( error => {
        console.error('Could not launch browser');
        throw error;
    });
    var page_1 = (await browser.pages())[0];

    module.exports = { browser, page_1 };
    page_1.on('pageerror', (err) => {
        console.error(err);
    });

    var dialogPromise
    function dialog(dialog) {
        dialogPromise = new Promise(async res => {
            console.log("Dialog message: " + dialog.message())
            if(dialog.message() === "Account in uso. Disconnettere l'altro utente?"){
                await dialog.accept()
                await page_1.type('#sicuruser', USERNAME)
                await page_1.type('#sicurpass', PASSWORD)
                page_1.click('button.sicurweb-login-submit')
                await page_1.waitForNavigation(navigationOptions)
            }
            if(dialog.message().includes("Vuoi riprendere dall'ultima slide")){
                await dialog.accept()
            }
            res();
        })
    }
    page_1.on('dialog', dialog); 

    await page_1.setViewport(viewport),
    await page_1.goto(domain, navigationOptions),
    await page_1.type('#sicuruser', USERNAME),
    await page_1.type('#sicurpass', PASSWORD),
    page_1.click('button.sicurweb-login-submit'),
    await page_1.waitForNavigation(navigationOptions),
    await dialogPromise,
    await page_1.evaluate(() => showCorsiFad(true))
    await timer(3 * 1000)
    await page_1.evaluate(() => openCorsoTable("yui-rec0"))
    await timer(3 * 1000)
    await page_1.evaluate(() => showPlayerCorso())
    await timer(3 * 1000)

    var slide = await page_1.$$('#ygtvc9 > .ygtvitem > .ygtvchildren > .ygtvitem .ygtvcontent')
    slide = slide[slideIndex]
    var slideName = await slide.$$eval('td', elem => elem[1].textContent)
    await slide.click()
    await page_1.waitForSelector('.ps-current ul li img')
    var images = await page_1.evaluate(() => $('.ps-current ul li img').map(function(){
        return $(this).attr('src')
    }).toArray())

    var mainFolder = "./pdfs"
    if (!fs.existsSync(mainFolder))
        fs.mkdirSync(mainFolder);
    var folderPath = mainFolder + "/" + slideName
    if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath)
    if(createImages)
        await images.asyncForEach(async (imgUrl, index) => {
            var url = domain + 'fad/' + imgUrl
            await page_1.goto(url, navigationOptions)
            console.log('Navigated to: ' + url)
            var path = folderPath + "/" + slideName + "_" + index + ".png"
            await page_1.screenshot({ path })
            console.log('Created: ' + path)
        })
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