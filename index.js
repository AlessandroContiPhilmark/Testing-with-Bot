require('./asyncForEach').asyncCallback = true;
const fs = require('fs');
const { get } = require('http');


var progress = {
    slideIndex,
    folderIndex,
    corso
} = JSON.parse(fs.readFileSync('./progress.json'));
console.log('Progress: ', progress);

var {
    username, password, chromePath, domain,
    createImages, overrideImages, headless
} = JSON.parse(fs.readFileSync('./config.json'))

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
    executablePath: chromePath
};


// const domain = 'https://fingeco4.piattaformafad.com/';

var dialogPromise
async function login(page_1){
    await page_1.goto(domain, navigationOptions),
    await page_1.type('#sicuruser', username),
    await page_1.type('#sicurpass', password),
    page_1.click('button.sicurweb-login-submit'),
    await page_1.waitForNavigation(navigationOptions),
    await dialogPromise
    // await page_1.evaluate(() => showCorsiFad(true))
    await timer(3 * 1000)
    var courseButtons = await page_1.$$('button.action-openCorso')
    await courseButtons[corso].click()
    // await page_1.evaluate(() => openCorsoTable("yui-rec0"))
    await timer(3 * 1000)
    // await page_1.evaluate(() => showPlayerCorso())
    await page_1.click('#elearning-corso-lezioni-header > button')
    await timer(3 * 1000)
}


async function getMainFrameHandle(page_1){
    await page_1.waitForSelector('#elearning-player-dialog')
    var mainFrame = await page_1.$('#elearning-player-dialog iframe')
    return mainFrame
}
async function getMainFrame(page_1){
    var mainFrame = await getMainFrameHandle(page_1)
    mainFrame = await mainFrame.contentFrame()
    return mainFrame
}
async function getInnerFrameHandle(page_1){
    var mainFrame = await getMainFrame(page_1)
    var innerFrame = (await mainFrame.$$('frame'))[2]
    return innerFrame
}

async function getInnerFrame(page_1){
    var innerFrame = await getInnerFrameHandle(page_1)
    innerFrame = await innerFrame.contentFrame()
    return innerFrame
}
async function getPlayPauseButton(page_1){
    var innerFrame = await getInnerFrame(page_1)
    var button = await innerFrame.$('.universal-control-panel__button_play-pause')
    return button
}

async function clickContinueSlide(page_1){
    var innerFrame = await getInnerFrame(page_1)
    var button = await innerFrame.$('.message-box-buttons-panel__window-button')

    var mainFrame = await getMainFrameHandle(page_1)
    innerFrame = await getInnerFrameHandle(page_1)

    var buttonX =
        await mainFrame.evaluate(elem => elem.getBoundingClientRect().x) +
        await innerFrame.evaluate(elem => elem.getBoundingClientRect().x) +
        await button.evaluate(elem => elem.getBoundingClientRect().x) +
        await button.evaluate(elem => elem.getBoundingClientRect().width / 2)
    var buttonY =
        await mainFrame.evaluate(elem => elem.getBoundingClientRect().y) +
        await innerFrame.evaluate(elem => elem.getBoundingClientRect().y) +
        await button.evaluate(elem => elem.getBoundingClientRect().y) +
        await button.evaluate(elem => elem.getBoundingClientRect().height / 2)

    await page_1.mouse.click(buttonX, buttonY, {button: 'left'}) 
    // await page_1.mouse.click(700, 340, {button: 'left'})  

}
async function clickPlay(page_1){
    // var mainFrame = document.querySelector('#scormPlayer')
    // var innerFrame = mainFrame.contentDocument.querySelectorAll('frame')[2]
    // var button = innerFrame.contentDocument.querySelector('.universal-control-panel__button_play-pause')

    // var buttonX = mainFrame.getBoundingClientRect().x
    // + innerFrame.getBoundingClientRect().x
    // + button.getBoundingClientRect().x
    // + (button.getBoundingClientRect().width / 2)

    // var buttonY = mainFrame.getBoundingClientRect().y
    // + innerFrame.getBoundingClientRect().y
    // + button.getBoundingClientRect().y
    // + (button.getBoundingClientRect().height / 2)

    var mainFrame = await getMainFrameHandle(page_1)
    var innerFrame = await getInnerFrameHandle(page_1)
    var button = await getPlayPauseButton(page_1)

    var buttonX =
        await mainFrame.evaluate(elem => elem.getBoundingClientRect().x) +
        await innerFrame.evaluate(elem => elem.getBoundingClientRect().x) +
        await button.evaluate(elem => elem.getBoundingClientRect().x) +
        await button.evaluate(elem => elem.getBoundingClientRect().width / 2)
    var buttonY =
        await mainFrame.evaluate(elem => elem.getBoundingClientRect().y) +
        await innerFrame.evaluate(elem => elem.getBoundingClientRect().y) +
        await button.evaluate(elem => elem.getBoundingClientRect().y) +
        await button.evaluate(elem => elem.getBoundingClientRect().height / 2)

    // var iframe = await getInnerFrame(page_1)
    // var status = await iframe.$eval('.universal-control-panel__button_play-pause', button => button.getAttribute('aria-label'))
    var status = await button.evaluate(elem => elem.getAttribute('aria-label'))
    if(status == 'play')
        await page_1.mouse.click(buttonX, buttonY, {button: 'left'}) 
    // status = await iframe.$eval('.universal-control-panel__button_play-pause', button => button.getAttribute('aria-label'))
    // if(status == 'play')
    //     await page_1.mouse.click(550, 530, {button: 'left'}) 
}
async function clickPause(page_1){
    var mainFrame = await getMainFrameHandle(page_1)
    var innerFrame = await getInnerFrameHandle(page_1)
    var button = await getPlayPauseButton(page_1)
    var buttonX =
        await mainFrame.evaluate(elem => elem.getBoundingClientRect().x) +
        await innerFrame.evaluate(elem => elem.getBoundingClientRect().x) +
        await button.evaluate(elem => elem.getBoundingClientRect().x) +
        await button.evaluate(elem => elem.getBoundingClientRect().width / 2)
    var buttonY =
        await mainFrame.evaluate(elem => elem.getBoundingClientRect().y) +
        await innerFrame.evaluate(elem => elem.getBoundingClientRect().y) +
        await button.evaluate(elem => elem.getBoundingClientRect().y) +
        await button.evaluate(elem => elem.getBoundingClientRect().height / 2)
    var status = await button.evaluate(elem => elem.getAttribute('aria-label'))
    if(status == 'pause')
        await page_1.mouse.click(buttonX, buttonY, {button: 'left'})
}
async function clickNextSlide(page_1){
    await page_1.mouse.click(1070, 540, {button: 'left'})
}
async function clickOk(page_1){
    // This popup will appear when you use clickNextSlide while you haven't finished
    await page_1.mouse.click(720, 340, {button: 'left'})
}
async function clickCloseSlide(page_1){
    await page_1.mouse.click(1300, 6, {button: 'left'})
}
async function getProgress(page_1){
    var iframe = await getInnerFrame(page_1)
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


function getTotalSeconds(time){
    return (time[1][0] * 60) + time[1][1]
}
function getCurrentSeconds(time){
    return (time[0][0] * 60) + time[0][1]
}

async function fiddleWithSlide(page_1, folderPath){
    var doFiddle = true
    await timer(5 * 1000)
    var {number, time} = await getProgress(page_1)
    var fiddleIntervarl = getTotalSeconds(time) / 11

    while(doFiddle) {
        await timer(fiddleIntervarl * 1000)
        var {number, time} = await getProgress(page_1)
        fiddleIntervarl = getTotalSeconds(time) / 11
        var isLastSlide = number[0] == number[1]
        var isTimeOver = time[0][0] == time[1][0] && time[0][1] == time[1][1]
        var position = getCurrentSeconds(time) + (fiddleIntervarl / 5)
        var targetPosition = fiddleIntervarl * 10

        // if(isTimeOver)
        if(position >= targetPosition){
            await writeSlideText(page_1, number)
            await screenshot(page_1, number, folderPath)
        }
        await clickPause(page_1)
        await timer(0.3 * 1000)
        await clickPlay(page_1)


        console.log(number, time, position + " / " + targetPosition)

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
    await page_1.evaluate(() => $('#elearning-corso-lezioni > div > ul > li').filter(function(){return $(this).attr("aria-expanded") == 'true'}).click())
    await timer(0.5 * 1000)
    //Gets How many folders there are
    var numberOfFolders = await page_1.evaluate(() => $('#elearning-corso-lezioni > div > ul > li').length)
    //Open current folder
    var folder = await page_1.evaluateHandle(index => $('#elearning-corso-lezioni > div > ul > li').get(index), index)
    await folder.evaluate(e => e.scrollIntoView({ block: "center", inline: "center" }))
    await timer(2 * 1000)
    await folder.click()
    return numberOfFolders
}


async function getSlides(page_1, folderIndex){
    var wholeFolders = await page_1.$$('#elearning-corso-lezioni > div > ul > li')
    var currentWholeFolder = wholeFolders[folderIndex]

    var slides = await currentWholeFolder.$$('#elearning-corso-lezioni > div > ul > li > ul > li')


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


async function writeSlideText(page_1, number){
    var slidesTxtFile = './Slides txt content/slides.txt'
    var slidesTxt = fs.readFileSync(slidesTxtFile)

    var innerFrame = await getInnerFrame(page_1)


    slidesTxt += '\n'+number[0]+'/'+number[1]

    slidesTxt += await innerFrame.$$eval('#playerView .kern.slide span', elements => {
        var testo = '\n'
        elements.forEach(x => {testo += '\n' + x.textContent})
        return testo
    })
    fs.writeFileSync(slidesTxtFile, slidesTxt)
}

async function screenshot(page_1, number, folderPath){
    let path = folderPath + "/slide_" + number[0] + ".png"
    if(overrideImages || !fs.existsSync(path)){
        await page_1.screenshot({ path })
        console.log('Created: ' + path)
    } else console.log('Already existing: ' + path)
}




function getDateString() {
    let today = new Date()
    let day = today.getDate()
    let month = today.getMonth() + 1
    let year = today.getFullYear()
    let hour = today.getHours()
    let minutes = today.getMinutes()
    let result = `${year}-${month}-${day} ${hour}-${minutes}`
    return result
}

function writeLogFile(errorMessage) {
    let errorFolder = './errors'
    if(!fs.existsSync(errorFolder))
        fs.mkdirSync(errorFolder);
    let fileName = `${errorFolder}/Error ${getDateString()}.log`
    let fileContent = ''
    if (fs.existsSync(fileName))
        fileContent = fs.readFileSync(fileName)
    fileContent = `${fileContent}${errorMessage}`

    fs.writeFileSync(fileName, fileContent)
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
                    await page_1.type('#sicuruser', username)
                    await page_1.type('#sicurpass', password)
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
    
        // await page_1.addStyleTag({ content: "{scroll-behavior: auto !important;}" });
    
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
                var slideName = await slide.$$eval('.fancytree-title', elem => elem[0].textContent)
                await slide.evaluate(e => e.scrollIntoView({ block: "center", inline: "center" }))
                await timer(2 * 1000)
                await slide.click()
                
                // await page_1.waitForSelector('#testPlayer')
                await timer(2 * 1000)
                // var isInTestPage = await page_1.$eval('#testPlayer', elem => elem.style.display != 'none')
                var isInSlideFrame = await page_1.$eval('#elearning-player-dialog', elem => elem.style.display != 'none')
                // var isBlockedOnTest = await page_1.evaluate(() => $('#divImageEsitoRisultatoTest').get(0) != undefined)
               
                var MainFrame = await getMainFrame(page_1)
                var divDomanda = await MainFrame.$('#domanda')
                //TODO continua da qui
                if(divDomanda == undefined) {
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
                    await fiddleWithSlide(page_1, folderPath)
                }
                // if(isInTestPage) {
                else {
                    var testConcluso = false
                    var testoRisposte = String(fs.readFileSync('./risposte.txt'))
                    testoRisposte = testoRisposte.replace(/\n/g,'').replace(/\t/g,'').replace(/\r/g,'').replace(/ /g,'')
                    while(!testConcluso){
                        await timer(1 * 1000)
                        var progressoDomande = await MainFrame.$eval('.numDomanda', elem => elem.textContent
                            .replace('Domanda','').replaceAll(' ','').replaceAll(':','')
                            .split('di').map(x => parseInt(x))
                        )
                        console.log('Progresso test: ' + progressoDomande[0] + '/' + progressoDomande[1])

                        var risposte = await MainFrame.$$('label.list-group-item.list-group-item-action')

                        await risposte.asyncForEach(async function(risposta){
                            var testoRisposta = await risposta.evaluate(x => x.textContent.replaceAll('\n','').replaceAll('\t','').replaceAll(' ',''))
                            if(testoRisposte.includes(testoRisposta)){
                                var input = await risposta.$('label.list-group-item.list-group-item-action input')
                                await input.click()
                            }
                        })
                        var avanti = await divDomanda.$('button')
                        await avanti.click()


                        if(progressoDomande[0] >= progressoDomande[1]){
                            await MainFrame.click('.action-chiudiPlayer')
                            testConcluso = true
                        }

                        // var correctAnswerIndex = await page_1.$$eval('#divContainerAnswersTest tbody .yui-dt2-col-isCorretta',
                        //     elems => elems.findIndex(elem => elem.innerText == 1)
                        // )
                        // var checkBoxes = await page_1.$$('#divContainerAnswersTest tbody input')
                        // await checkBoxes[correctAnswerIndex].click()
                        // await page_1.click('#idDivContainerButtonAnswersTest-button')
                        // await timer(1 * 1000)
                        // testConcluso = await page_1.$eval('#testPlayer', elem => elem.style.display == 'none')
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
        let errorMessage = `\nError ${getDateString()}\nError occurred: ${error}\nError stack: ${error.stack}\n`
        console.log(errorMessage)
        writeLogFile(errorMessage)
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