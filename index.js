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

const navigationOptions = {
    timeout: 5 * 60 * 1000,
    waitUntil: ['load', 'domcontentloaded', 'networkidle0']
};
const viewport = { width: 1366, height: 613, deviceScaleFactor: 1 };
const puppeteerConfig = {
    slowMo: 100,
    ignoreHTTPSErrors: true,
    product: 'chrome',
    headless,
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

const domain = 'https://fingeco4.piattaformafad.com/';

var dialogPromise
async function login(page_1){
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
}
async function play(){
    var browser
    try {
        browser = await puppeteer.launch(puppeteerConfig).catch( error => {
            console.error('Could not launch browser');
            throw error;
        });
        var page_1 = (await browser.pages())[0];
    
        module.exports = { browser, page_1 };
        page_1.on('pageerror', (err) => {
            console.error(err);
        });
    
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
        await login(page_1)
    
    
    
        //closes all open folders!
        await page_1.evaluate(() => $('#ygtvc3 > .ygtvitem').find('.ygtvtm').click())
        //Open current folder
        await page_1.evaluate(folderIndex => $('#ygtvc3 > .ygtvitem').find('.ygtvtp, .ygtvlp')
            .get(folderIndex).click()
        , folderIndex)
        await timer(2 * 1000)
    
    
        var slide = await page_1.$$('#ygtvc9 > .ygtvitem > .ygtvchildren > .ygtvitem .ygtvcontent')
        slide = slide[slideIndex]
        var slideName = await slide.$$eval('td', elem => elem[1].textContent)
        await slide.click()
        
        await page_1.waitForSelector('#testPlayer')
        var isInTestPage = await page_1.$eval('#testPlayer', elem => elem.style.display != 'none')
        if(!isInTestPage) {
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
            }
        } else {
            var testConcluso = false
            while(!testConcluso){
                var correctAnswerIndex = await page_1.$$eval('#divContainerAnswersTest tbody .yui-dt2-col-isCorretta',
                    elems => elems.findIndex(elem => elem.innerText == 1)
                )
                var checkBoxes = await page_1.$$('#divContainerAnswersTest tbody input')
                await checkBoxes[correctAnswerIndex].click()
                await page_1.click('#idDivContainerButtonAnswersTest')
                testConcluso = await page_1.$eval('#testPlayer', elem => elem.style.display == 'none')
            }
            console.log('Test concluso')
        }
    } catch (error) {
        console.log('Error occurred: ' + error)
        await timer(1 * 1000)
        try { await browser.close(); } catch (error) {
            console.log('Error while closing browser ' + error)
        }
        console.log('Restarting in 5 seconds')
        await timer(5 * 1000)
        play()
    }
}
play()