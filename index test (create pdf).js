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

const urls = [
    'https://fingeco.opencons.net/ilias.php?ref_id=165&obj_id=598&cmd=layout&cmdClass=illmpresentationgui&cmdNode=f3&baseClass=ilLMPresentationGUI'
];

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
    await page_1.goto(domain, navigationOptions)
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

    // var slideName = await page_1.$eval('#ygtvcontentel17', elem => elem.click())
    var slideName = "AREE FUNZIONALI D'IMPRESA"

    // await page_1.$eval('#ygtvcontentel17', elem => elem.click())
    await (await page_1.$('#ygtvcontentel17')).click()

    await page_1.waitForSelector('.ps-current ul li img')


    var images = await page_1.evaluate(() => $('.ps-current ul li img').map(function(){
        return $(this).attr('src')
    }).toArray())

    await images.asyncForEach(async (imgUrl, index) => {
        var url = domain + 'fad/' + imgUrl
        await page_1.goto(url, navigationOptions)
        console.log('Navigated to: ' + url)
        await timer(3 * 1000)
        var path = "./pdfs/" + slideName + "_" + index + ".png"
        await page_1.screenshot({
            path
        })
        console.log('Created: ' + path)
    })
 
    var endCycle = false
    while(!endCycle){
        await page_1.waitForSelector('.minutes')
        await page_1.waitForSelector('.seconds')
        await timer(20 * 1000)

        var minutes = await page_1.$eval('.minutes', elem => elem.textContent)
        var seconds = await page_1.$eval('.seconds', elem => elem.textContent)
        console.log(minutes, seconds)
        if(minutes === "00" && seconds === "00"){
            await page_1.waitForSelector('.pgwSlideshow .ps-caption b')
            var slideNumber = await page_1.$eval('.pgwSlideshow .ps-caption b', elem => elem.textContent)
            slideNumber = slideNumber.substr(
                slideNumber.lastIndexOf('°') + 1,
                slideNumber.lastIndexOf('/') - slideNumber.lastIndexOf('°')-2) + "_" + slideNumber.substr(slideNumber.lastIndexOf('/') + 1
            )
            var path = "./pdfs/" + slideName + "_" + slideNumber + ".pdf"
            console.log("Saving pdf: " + path)
            await page_1.pdf({ path })
        }
        await page_1.$eval('.ps-next', elem => elem.click())
    }

  

     
    console.log('Urls finished, closing browser');
    await page_1.close();
    await browser.close();
})()