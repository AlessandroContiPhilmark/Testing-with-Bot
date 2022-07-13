require('./asyncForEach').asyncCallback = true;
const fs = require('fs');
const { get } = require('http');


//Una mappa usata per tenere traccia di quale risposta sia corretta per 
//questa sezione del quiz, viene memorizzato il numero x di "Domanda x/y"
//e ci viene salvato il testo della domanda corretta
//otteniamo da "quizQuestionRecord[x]" una mappa che contiene
//"risposteSbagliate = [String]" lista delle risposte sbagliate
//"rispostaCorretta = String" la risposta corretta da cliccare
let quizQuestionRecord = {}

var progress = {
    slideIndex,
    folderIndex,
    corso, lastWroteSlideText
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

function removeFromArr(str, arr){
    let result = []
    for(let x of arr){
        if(str != x)
            result.push(x)
    }
    return result
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

async function isInTestQuiz(page_1){
    let innerFrame = await getInnerFrame(page_1)
    let result = await innerFrame.$('.quiz-player-skin')
    result = result != null
    return result
}

async function isTestQuizDone(page_1){
    let innerFrame = await getInnerFrame(page_1)
    let result = await innerFrame.$('.slide-object-view-icon-placeholder_type_passed')
    result = result != null
    return result
}
async function isTestQuizFailed(page_1){
    let innerFrame = await getInnerFrame(page_1)
    let result = await innerFrame.$('.slide-object-view-icon-placeholder_type_failed')
    result = result != null
    return result
}
async function clickedCorrectAnswer(page_1){
    let innerFrame = await getInnerFrame(page_1)
    let result = await innerFrame.$('.quiz-feedback-panel__header_correct')
    result = result != null
    return result
}

async function clickContinueSlide(page_1){
    var innerFrame = await getInnerFrame(page_1)
    var button = await innerFrame.$('.message-box-buttons-panel__window-button')
    if(button == null) return

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

async function fiddleWithSlide(page_1, folderPath, slideName){
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
            await writeSlideText(page_1, number, slideName)
            await screenshot(page_1, number, folderPath)
        }
        await clickPause(page_1)
        await timer(0.3 * 1000)
        await clickPlay(page_1)


        // console.log(number, time, position + " / " + targetPosition)

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


function countQuestionMatches(risposta, testo){
    testo = testo.toString()
    let notCharOrOperation = /[^A-Za-zÀÁÈÉÌÍÒÓÙÚàáèéìíòóùú0-9+\-\\\/*()]+/
    let specialCharReg = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/
    let isSingleChar = /^[A-Za-zÀÁÈÉÌÍÒÓÙÚàáèéìíòóùú]{1}$/
    //let risposta = "d     sad&££(89324.32342asd.dasdas"
    let regNoChar = "([^A-Za-zÀÁÈÉÌÍÒÓÙÚàáèéìíòóùú0-9]{1})"
    let spaces = /^\s*$/
    
    let splitReg = new RegExp(regNoChar,'g')
    
    let array = risposta.split(splitReg)
    let builtReg = ''
    let index = 0
    for(let x of array){
        index ++
        if(!notCharOrOperation.test(x) && !spaces.test(x))
        // if(!notCharOrOperation.test(x) && !spaces.test(x) && !isSingleChar.test(x))
        // if(!/[^A-Za-zÀÁÈÉÌÍÒÓÙÚàáèéìíòóùú0-9]+/g.test(x) && !/^\s*$/.test(x))
        //if(!/^\s*$/.test(x))
            builtReg += `(${specialCharReg.test(x) ? '\\':''}${x})+${index < array.length ? '.*':''}`
    }
    
    console.log(builtReg)
    //new RegExp(builtReg).test("d     sad& ££(8 9324.32342asd.dasdas")
    let result = testo.match(new RegExp(builtReg,'g'))
    return result != null ? result.length : 0 
}

async function questionProgress(page_1){
    let innerFrame = await getInnerFrame(page_1)
    return await innerFrame.$eval('.quiz-top-panel__question-score-info', elem => {
        let questionNumber = parseInt(elem.textContent.split(' ')[1])
        let questionTotal = parseInt(elem.textContent.split(' ')[3])
        return {questionNumber, questionTotal}
    })
}



async function writeSlideText(page_1, number, slideName){
    let folder = `./Slides txt content`

    if (!fs.existsSync(folder))
        fs.mkdirSync(folder)
    let slidesTxtFile = `${folder}/${slideName}.txt`
    let slidesTxt = ''
    
    if (fs.existsSync(slidesTxtFile))
        slidesTxt = fs.readFileSync(slidesTxtFile)
    slidesTxt += '\n'+number[0]+'/'+number[1]

    let innerFrame = await getInnerFrame(page_1)
    let slideTxt = await innerFrame.$$eval('#playerView .kern.slide span', elements => {
        let testo = '\n'
        elements.forEach(x => {testo += `${x.textContent} `})
        testo = testo.replaceAll(/\n+/g, ' ')
        testo = testo.replaceAll(/\s+/g, ' ')
        testo = testo.replaceAll(/\.\s*/g, '.\n')
        return testo
    })
    slidesTxt += slideTxt
    fs.writeFileSync(slidesTxtFile, slidesTxt)



    lastWroteSlideText = slidesTxtFile
    progress.lastWroteSlideText = lastWroteSlideText
    fs.writeFileSync('./progress.json', JSON.stringify(progress, null, 4))
}

async function screenshot(page_1, number, folderPath){
    let path = `${folderPath}/slide ${number[0]} of ${number[1]}.png`
    // let path = folderPath + "/slide_" + number[0] + ".png"
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

let doCycleSlides
function advanceSlideProgress(slides){
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
            
            doCycleSlides = true
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
                if(!(await isInTestQuiz(page_1))) {
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
                    await fiddleWithSlide(page_1, folderPath, slideName)
                    advanceSlideProgress(slides)
                }
                // if(isInTestPage) {
                else {
                    await timer(3 * 1000)
                    
                    
                    async function clickContinueQuiz(page_1){
                        var innerFrame = await getInnerFrame(page_1)
                        var button = await innerFrame.$('.window-button.window-button_cancel')
                        if(button == null) return

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
                    await clickContinueQuiz(page_1)
                    
                    //Test
                    // let testFrame = await getInnerFrameHandle(page_1)
                    // let correctAnswerText = await testFrame.evaluate(elem => {
                    //     console.log(elem)
                    //     console.log(elem.contentDocument)
                    //     console.log(elem.querySelector)
                    //     console.log(elem.contentDocument.querySelector)
                    //     console.log(elem.querySelector('input[aria-checked="true"]'))
                    //     console.log(elem.contentDocument.querySelector('input[aria-checked="true"]'))
                    //     var xTest = elem
                    //     // return elem.querySelector('input[aria-checked="true"]').parentElement.parentElement.querySelector('.choice-content').textContent
                    // })

                    async function clickAnswerText(text){
                        let innerFrame = await getInnerFrame(page_1)

                        let map = {}
                        let questions = await innerFrame.$$('.choice-view')
                        for(let x of questions){
                            let txt = await x.evaluate(x=> x.textContent)
                            map[txt] = await x.$('* > div')
                        }
                        if(map[text] != null)
                            await clickIframeChild(map[text])
                        else console.log(`No question found to click: ${text}`)

                    }

                    async function getAllAnswers(){
                        let innerFrameHandle = await getInnerFrameHandle(page_1)
                        let questions = await innerFrameHandle.evaluate(elem => {
                            let result = []
                            for(let x of elem.contentDocument.querySelectorAll('.choice-view')){
                                result.push(x.textContent)
                            }
                            return result
                        })
                        return questions
                    }
                    // let questionsText = await getAllAnswers()
                    // await clickAnswerText(questionsText[1])
                    // await clickAnswerText('sada')


                    // let correctAnswers = []
                    // let innerFrame = await getInnerFrame(page_1)
                    // let questions = await innerFrame.$$('.choice-view')

                    // async function clickAnswer(question){
                    //     question = await question.$('.choice-view > div')
                    //     await clickIframeChild(question)
                    // }


                    async function clickIframeChild(child){
                        var mainFrame = await getMainFrameHandle(page_1)
                        var innerFrame = await getInnerFrameHandle(page_1)

                        var questionX =
                            await mainFrame.evaluate(elem => elem.getBoundingClientRect().x) +
                            await innerFrame.evaluate(elem => elem.getBoundingClientRect().x) +
                            await child.evaluate(elem => elem.getBoundingClientRect().x) +
                            await child.evaluate(elem => elem.getBoundingClientRect().width / 2)
                        var questionY =
                            await mainFrame.evaluate(elem => elem.getBoundingClientRect().y) +
                            await innerFrame.evaluate(elem => elem.getBoundingClientRect().y) +
                            await child.evaluate(elem => elem.getBoundingClientRect().y) +
                            await child.evaluate(elem => elem.getBoundingClientRect().height / 2)
                        await page_1.mouse.click(questionX, questionY, {button: 'left'}) 
                    }
                    async function clickInviaQuiz(){
                        let innerFrame = await getInnerFrame(page_1)
                        let inviaButton = await innerFrame.$('.quiz-control-panel__text-label')
                        await clickIframeChild(inviaButton)
                    }
                    async function clickRivediQuiz(){
                        let innerFrame = await getInnerFrame(page_1)
                        let rivediButton = await innerFrame.$('.player-shape-view_button')
                        await clickIframeChild(rivediButton)
                    }
                    async function clickCloseRevision(){
                        let closeRevisionButton
                        let innerFrame = await getInnerFrame(page_1)
                        let buttons = await innerFrame.$$('.quiz-control-panel__button')
                        for(let button of buttons){
                            let text = await button.evaluate(elem => elem.textContent)
                            if(text == "CHIUDERE LA REVISIONE")
                                closeRevisionButton = button
                        }
                        if(closeRevisionButton)
                            await clickIframeChild(closeRevisionButton)
                    }
                    async function clickProssimoRevision(){
                        let closeRevisionButton
                        let innerFrame = await getInnerFrame(page_1)
                        let buttons = await innerFrame.$$('.quiz-control-panel__button')
                        for(let button of buttons){
                            let text = await button.evaluate(elem => elem.textContent)
                            if(text == "PROSSIMO")
                                closeRevisionButton = button
                        }
                        if(closeRevisionButton)
                            await clickIframeChild(closeRevisionButton)
                    }


                    // if(correctAnswers.length == 0){
                    //     await clickAnswer(questions[0])
                    // }





                    //Una mappa usata per tenere traccia di quale risposta sia corretta per 
                    //questa sezione del quiz, viene memorizzato il numero x di "Domanda x/y"
                    //e ci viene salvato il testo della domanda corretta
                    //otteniamo da "quizQuestionRecord[x]" una mappa che contiene
                    //"risposteSbagliate = [String]" lista delle risposte sbagliate
                    //"rispostaCorretta = String" la risposta corretta da cliccare
                    //TO-DO Potrei differenziare questo dizionario per nome del quiz
                    // let quizQuestionRecord = {}

                    let inTest = await isInTestQuiz(page_1)
                    let quizDone = await isTestQuizDone(page_1)
                    let quizFailed = await isTestQuizFailed(page_1)
                    //esperimento
                    while(inTest && !quizDone && !quizFailed){
                        //Ottengo il numero x del quiz
                        let innerFrame = await getInnerFrame(page_1)

                        let questionNumber = await innerFrame.$eval('.quiz-top-panel__question-score-info', elem => elem.textContent.split(' ')[1]);
                        //ottengo il record, che equivale al testo della risposta corretta
                        let record = quizQuestionRecord[questionNumber]

                        if(record) {
                            //se il record è presente prendo i dati
                            let {risposteSbagliate, rispostaCorretta} = record 
                            if(rispostaCorretta){
                                //se è presente la risposta corretta la clicchiamo e andiamo avanti
                                await clickAnswerText(rispostaCorretta)
                                await clickInviaQuiz()
                            } else {
                                //se non è presente controlliamo le risposte sbagliate e le escludiamo
                                let questionsText = await getAllAnswers()
                                if(risposteSbagliate){
                                    for(let x of risposteSbagliate){
                                        questionsText = removeFromArr(x, questionsText)
                                    }
                                }
                                //rimosse le risposte che sappiamo essere sbagliate dobbiamo
                                //decidere quale risposta cliccare in base a quante volte
                                //compare nel testo del quiz precedente
                                let text = fs.readFileSync(lastWroteSlideText)
                                let previousCount = -1
                                let risposta
                                for(let x of questionsText){
                                    let count = countQuestionMatches(x, text)
                                    if(count > previousCount){
                                        previousCount = count 
                                        risposta = x
                                    }
                                }
                                quizQuestionRecord[questionNumber].risposta = risposta
                                await clickAnswerText(risposta)
                                await clickInviaQuiz()
                            }
                        }else{
                            //se il record è null vuol dire che non è stata trovata
                            let questionsText = await getAllAnswers()
                            let text = fs.readFileSync(lastWroteSlideText)
                            let previousCount = -1
                            let risposta
                            for(let x of questionsText){
                                let count = countQuestionMatches(x, text)
                                if(count > previousCount){
                                    previousCount = count 
                                    risposta = x
                                }
                            }
                            quizQuestionRecord[questionNumber] = {risposta, risposteSbagliate: []}
                            await clickAnswerText(risposta)
                            await clickInviaQuiz()
                        }
                        // let answersText = await getAllAnswers()
                        // for(let answer of answersText){
                        //     let record = answersRecord[answer]
                        //     //se il record è nullo allora 
                        //     if()
                        // }
                        await timer(2 * 1000)

                        inTest = await isInTestQuiz(page_1)
                        quizDone = await isTestQuizDone(page_1)
                        quizFailed = await isTestQuizFailed(page_1)
                    }
                    console.log(quizQuestionRecord)
                    if(inTest && quizFailed){
                        console.log('Test Fallito')
                        await clickRivediQuiz()
                        let questionNumber = 0
                        let questionTotal = 1
                        let finished = false
                        while(!finished){
                            ({questionNumber,questionTotal} = await questionProgress(page_1))
                            if(questionNumber >= questionTotal)
                                finished = true
                            let innerFrame = await getInnerFrame(page_1)
                            let popupCorretto = await innerFrame.$('.quiz-feedback-panel__header_correct')
                            let record = quizQuestionRecord[questionNumber]
                            if(popupCorretto != null){
                                //la risposta data era corretta!
                                if(!record.rispostaCorretta){
                                    record.rispostaCorretta = record.risposta
                                    delete record.risposta
                                    delete record.risposteSbagliate
                                }
                            } else {
                                if(!record.risposteSbagliate){
                                    record.risposteSbagliate = []
                                }
                                record.risposteSbagliate.push(record.risposta)
                                delete record.risposta
                            }
                            await clickProssimoRevision()
                            await timer(1 * 1000)
                        }
                    }
                    if(inTest && quizDone){
                        quizQuestionRecord = {}
                        console.log('Test concluso')
                        advanceSlideProgress(slides)
                    }
                    await clickCloseSlide(page_1)


                    // //Ciclo per fare una prima visione del corso
                    // let questionIndex = 0
                    // await timer(2 * 1000)
                    // while(inTest && !quizDone && !quizFailed){
                    //     questions = await innerFrame.$$('.choice-view')
                    //     //implementare una regex per cercare il testo delle domande? troppo difficile per ora
                    //     await clickAnswer(questions[questionIndex])
                    //     await clickInviaQuiz()
                    //     await timer(2 * 1000)
                    //     inTest = await isInTestQuiz(page_1)
                    //     quizDone = await isTestQuizDone(page_1)
                    //     quizFailed = await isTestQuizFailed(page_1)
                    // }

                    // //Ciclo per vedere le risposte corrette
                    // if(quizFailed){
                    //     await clickRivediQuiz()
                    //     await timer(3 * 1000)
                    //     let randomCorrect = await clickedCorrectAnswer(page_1)
                    //     if(randomCorrect){
                    //         let innerFrame = await getInnerFrameHandle(page_1)
                    //         let correctAnswerText = await innerFrame.evaluate(elem => {
                    //             console.log(elem)
                    //             let xTest = elem
                    //             // return elem.querySelector('input[aria-checked="true"]').parentElement.parentElement.querySelector('.choice-content').textContent
                    //         })
                    //         correctAnswers.push(correctAnswerText)
                    //     }
                    //     // await timer(4 * 1000)
                    // }




                    //VECCHIO SISTEMA!!
                    // //Ciclo per selezionare le risposte corrette
                    // while(inTest && !quizDone && !quizFailed){
                    //     inTest = await isInTestQuiz(page_1)
                    //     quizDone = await isTestQuizDone(page_1)
                    //     quizFailed = await isTestQuizFailed(page_1)
                    //     await timer(5 * 1000)
                    //     console.log("In attesa di completamento test...")
                    // }
                    // if(quizDone){
                    //     console.log('Test concluso')
                    //     advanceSlideProgress(slides)
                    // }
                    // if(quizFailed){
                    //     console.log('Test Fallito')
                    // }
                    // await clickCloseSlide(page_1)
                    



                    // var testConcluso = false
                    // var testoRisposte = String(fs.readFileSync('./risposte.txt'))
                    // testoRisposte = testoRisposte.replace(/\n/g,'').replace(/\t/g,'').replace(/\r/g,'').replace(/ /g,'')
                    // while(!testConcluso){
                    //     await timer(1 * 1000)
                    //     // var inputs = document.querySelectorAll('label.list-group-item.list-group-item-action input')
                    //     // var texts = []
                    //     // document.querySelectorAll('label.list-group-item.list-group-item-action').forEach(x => 
                    //     //     texts.push(
                    //     //         x.textContent.replaceAll('\n','').replaceAll('\t','').replaceAll(' ','')
                    //     //     )
                    //     // )
                    //     // document.querySelectorAll('label.list-group-item.list-group-item-action').forEach(x =>
                    //     //     console.log(
                    //     //         x.textContent.replaceAll('\n','').replaceAll('\t','').replaceAll(' ','')
                    //     //     )
                    //     // )
                    //     // texts


                    //     // document.querySelector('.numDomanda').textContent
                    //     // .replace('Domanda','')
                    //     // .replaceAll(' ','')
                    //     // .replaceAll(':','')
                    //     // .split('di')
                    //     // .map(x => parseInt(x))


                    //     var progressoDomande = await MainFrame.$eval('.numDomanda', elem => elem.textContent
                    //         .replace('Domanda','').replaceAll(' ','').replaceAll(':','')
                    //         .split('di').map(x => parseInt(x))
                    //     )
                    //     console.log('Progresso test: ' + progressoDomande[0] + '/' + progressoDomande[1])

                    //     var domanda = await MainFrame.$eval('.list-group-item-primary', x => x.textContent.replaceAll('\n', '').replaceAll('\t', '').replaceAll(' ', ''))

                    //     var risposte = await MainFrame.$$('label.list-group-item.list-group-item-action')

                    //     await risposte.asyncForEach(async function(risposta){
                    //         var testoRisposta = await risposta.evaluate(x => x.textContent.replaceAll('\n','').replaceAll('\t','').replaceAll(' ',''))
                    //         if(testoRisposte.includes(domanda + testoRisposta)){
                    //             var input = await risposta.$('label.list-group-item.list-group-item-action input')
                    //             await input.click()
                    //         }
                    //     })
                    //     var avanti = await divDomanda.$('button')
                    //     await avanti.click()


                    //     if(progressoDomande[0] >= progressoDomande[1]){
                    //         await timer(3 * 1000)
                    //         var closeButton = await page_1.$('.action-chiudiPlayer')
                    //         await closeButton.click()
                    //         testConcluso = true
                    //     }

                    //     // var correctAnswerIndex = await page_1.$$eval('#divContainerAnswersTest tbody .yui-dt2-col-isCorretta',
                    //     //     elems => elems.findIndex(elem => elem.innerText == 1)
                    //     // )
                    //     // var checkBoxes = await page_1.$$('#divContainerAnswersTest tbody input')
                    //     // await checkBoxes[correctAnswerIndex].click()
                    //     // await page_1.click('#idDivContainerButtonAnswersTest-button')
                    //     // await timer(1 * 1000)
                    //     // testConcluso = await page_1.$eval('#testPlayer', elem => elem.style.display == 'none')
                    // }
                    // console.log('Test concluso')
                }
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