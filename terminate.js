const { browser, page_1 } = require('./index');

console.log('Halting execution');

page_1.close();
browser.close();