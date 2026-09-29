import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
try {
 const page=await browser.newPage({viewport:{width:1366,height:900}});
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('heading',{name:'Your time, everywhere.'}).waitFor();
 await page.screenshot({path:'.impeccable/review/cyan-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'.impeccable/review/cyan-mobile.png',fullPage:true});
}finally{await browser.close();}
