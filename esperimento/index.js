const puppeteer = require("puppeteer")
const navigationOptions = {
    timeout: 5 * 60 * 1000,
    waitUntil: ['load', 'domcontentloaded', 'networkidle0']
}
const puppeteerConfig = {
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
}
const {
	listenPromise,
	firePromise,
	enableTagPromise
} = require('../eventPromise')

const url = "C:\\Test BOT Corso Anpal\\esperimento\\test.html";

(async () => {
    var browser = await puppeteer.launch(puppeteerConfig).catch( error => {
        console.error('Could not launch browser')
        throw error
    })
    var page = (await browser.pages())[0]
    await page.goto(url, navigationOptions)

    enableTagPromise('waitPageFunc')
    var message = 'not done'
    await page.exposeFunction('test', msg => {
        console.log('test message in page: ' + msg)
        message = msg
        firePromise('waitPageFunc')
    })
    await listenPromise('waitPageFunc')
    console.log(message)
    await page.close()
    await browser.close()
})()