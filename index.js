require('./asyncForEach').asyncCallback = true;
const fs = require('fs');
const { get } = require('http');


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
    // slowMo: 100,
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




async function getMainFrame(page_1){
    await page_1.waitForSelector('#scormPlayer')
    var iframe1 = await page_1.$('#scormPlayer')
    iframe1 = await iframe1.contentFrame()
    var iframe2 = (await iframe1.$$('frame'))[2]
    iframe2 = await iframe2.contentFrame()
    return iframe2
}
async function clickContinueSlide(page_1){
    await page_1.mouse.click(700, 340, {button: 'left'})  
}
async function clickPlay(page_1){
    var iframe = await getMainFrame(page_1)
    var status = await iframe.$eval('.universal-control-panel__button_play-pause', button => button.getAttribute('aria-label'))
    if(status == 'play')
        await page_1.mouse.click(340, 550, {button: 'left'}) 
}
async function clickPause(page_1){
    var iframe = await getMainFrame(page_1)
    var status = await iframe.$eval('.universal-control-panel__button_play-pause', button => button.getAttribute('aria-label'))
    if(status == 'pause')
        await page_1.mouse.click(340, 550, {button: 'left'})  
}
async function clickNextSlide(page_1){
    await page_1.mouse.click(1070, 540, {button: 'left'})
}
async function clickOk(page_1){
    // This popup will appear when you use clickNextSlide while you haven't finished
    await page_1.mouse.click(720, 340, {button: 'left'})
}
async function clickCloseSlide(page_1){
    await page_1.mouse.click(135, 70, {button: 'left'})
}
async function getProgress(page_1){
    var iframe = await getMainFrame(page_1)
    var slideProgress = await iframe.$$('.progressbar__label')

    var numberSlide = slideProgress[0]
    var numberTextObject = await numberSlide.getProperty('textContent')
    var numberText = numberTextObject._remoteObject.value;
    var number = numberText.replace(/\s/g, '').split('/').map(x => parseInt(x))

    var timeSlide = slideProgress[1]
    var timeTextObject = await timeSlide.getProperty('textContent')
    var timeText = timeTextObject._remoteObject.value;
    var time = timeText.replace(/\s/g, '').split('/').map(x => x.split(':').map(x => parseInt(x)))
    return {number, time}
}


async function fiddleWithSlide(page_1){
    var doFiddle = true
    while(doFiddle) {
        await timer(13 * 1000)
        await clickPause(page_1)
        await timer(0.3 * 1000)
        await clickPlay(page_1)

        var {number, time} = await getProgress(page_1)
        var isLastSlide = number[0] == number[1]
        var isTimeOver = time[0][0] == time[1][0] && time[0][1] == time[1][1]

        console.log(number, time)

        if(isLastSlide && isTimeOver){
            doFiddle = false
            await timer(1 * 1000)
            await clickCloseSlide(page_1)
            try {
                await timer(7 * 1000)
                await page_1.click('#yui-gen33-button')
            } catch (error) {
                console.log('no button to click after finishing slide')
            }
        }
    }
}


async function openFolder(page_1, index){
    //closes all open folders!
    await page_1.evaluate(() => $('#ygtvc3 > .ygtvitem').find('.ygtvtm').click())
    //Gets How many folders there are
    var numberOfFolders = await page_1.evaluate(() => $('#ygtvc3 > .ygtvitem').find('.ygtvtp, .ygtvlp').length)
    //Open current folder
    var folder = await page_1.evaluateHandle(index => $('#ygtvc3 > .ygtvitem').find('.ygtvtp, .ygtvlp').get(index), index)
    await folder.click()
    return numberOfFolders
}


async function getSlides(page_1, folderIndex){
    var wholeFolders = await page_1.$$('#ygtvc3 > .ygtvitem')
    var currentWholeFolder = wholeFolders[folderIndex]

    var slides = await currentWholeFolder.$$('#ygtvc3 > .ygtvitem > .ygtvchildren > .ygtvitem .ygtvcontent')


    // slides.forEach(async slide => {
    //     var txt = await slide.evaluate((el) => {
    //         var txt = el.textContent
    //         var inerTxt = el.innerText
    //         el.style.backgroundColor = 'red'
    //         el.style.fontSize = 150 + 'px'
    //         return txt + ' | ' + inerTxt 
    //     })
    //     var t = 0
    // })

    // var slides = await page_1.evaluateHandle(
    //     currentWholeFolder => $(currentWholeFolder).find('.ygtvchildren > .ygtvitem .ygtvcontent'),
    //     currentWholeFolder
    // )
    return slides
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
    
    
        await page_1.evaluate(() => {
            document.onmousemove = function(e) {
                document.title = "X is " + e.pageX + " and Y is " + e.pageY
            }
        })
    
        var doneAllFolders = false
        while(!doneAllFolders){
            var numberOfFolders = await openFolder(page_1, folderIndex)
            await timer(2 * 1000)
            
            var doCycleSlides = true
            while(doCycleSlides) {

                var slides = await getSlides(page_1, folderIndex)


                // var slides = await page_1.$$('#ygtvc3 > .ygtvitem > .ygtvchildren > .ygtvitem .ygtvcontent')
                slide = slides[slideIndex]
                var slideName = await slide.$$eval('td', elem => elem[1].textContent)
                await slide.click()
                
                await page_1.waitForSelector('#testPlayer')
                await timer(2 * 1000)
                var isInTestPage = await page_1.$eval('#testPlayer', elem => elem.style.display != 'none')
                var isInSlideFrame = await page_1.$eval('#scormPlayer', elem => elem.style.display != 'none')
                // var isBlockedOnTest = await page_1.evaluate(() => $('#divImageEsitoRisultatoTest').get(0) != undefined)
                if(isInSlideFrame) {
                    // await timer(2 * 1000)
        
                    // await page_1.waitForSelector('.ps-current ul li img')
                    // var images = await page_1.evaluate(() => $('.ps-current ul li img').map(function(){
                    //     return $(this).attr('src')
                    // }).toArray())
                
                    var mainFolder = "./pdfs"
                    if (!fs.existsSync(mainFolder))
                        fs.mkdirSync(mainFolder);
                    var folderPath = mainFolder + "/" + slideName
                    if (!fs.existsSync(folderPath))
                        fs.mkdirSync(folderPath)
                    if(createImages){
                        // page_1.pdf()
                        // var page_2 = await browser.newPage()
                        // await page_2.setViewport(viewport)
                        // await images.asyncForEach(async (imgUrl, index) => {
                        //     var path = folderPath + "/" + slideName + "_" + (++index) + ".png"
                        //     if(overrideImages || !fs.existsSync(path)){
                        //         var url = domain + 'fad/' + imgUrl
                        //         await page_2.goto(url, navigationOptions)
                        //         console.log('Navigated to: ' + url)
                        //         await page_2.screenshot({ path })
                        //         console.log('Created: ' + path)
                        //     } else console.log('Already existing: ' + path)
                        // })
                        // await page_2.close()
                    }
                    // await timer(3 * 1000)
                    /*
                    Codice da usare per visualizzare coordinate
        
                    document.onmousemove = function(e){
                        var x = e.pageX;
                        var y = e.pageY;
                        document.title = "X is "+x+" and Y is " + y;
                    }
        
                    var iframe1 = document.querySelectorAll('#scormPlayer')[0].contentWindow.document
                    var iframe2 = iframe1.querySelectorAll('frame')[2].contentWindow.document
                    iframe2.onmousemove = function(e){
                        var x = e.pageX;
                        var y = e.pageY;
                        document.title = "X is "+x+" and Y is " + y;
                    }
                    */
                    await timer(3 * 1000)
                    await clickContinueSlide(page_1)
                    await fiddleWithSlide(page_1)
                }
                if(isInTestPage) {
                    var testConcluso = false
                    while(!testConcluso){
                        await timer(1 * 1000)
                        var correctAnswerIndex = await page_1.$$eval('#divContainerAnswersTest tbody .yui-dt2-col-isCorretta',
                            elems => elems.findIndex(elem => elem.innerText == 1)
                        )
                        var checkBoxes = await page_1.$$('#divContainerAnswersTest tbody input')
                        await checkBoxes[correctAnswerIndex].click()
                        await page_1.click('#idDivContainerButtonAnswersTest-button')
                        await timer(1 * 1000)
                        testConcluso = await page_1.$eval('#testPlayer', elem => elem.style.display == 'none')
                    }
                    console.log('Test concluso')
                }
                slideIndex++
                progress.slideIndex++
                if(slideIndex >= slides.length){
                    slideIndex = 0
                    progress.slideIndex = 0
                    doCycleSlides = false
                    folderIndex++
                    progress.folderIndex++
                }
                fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 4))
            }
            if(folderIndex >= numberOfFolders){
                doneAllFolders = true
                progress.slideIndex = 0
                progress.folderIndex = 0
                progress.corsoConcluded = true
                fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 4))
                console.log('Il corso è stato terminato')
            }
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