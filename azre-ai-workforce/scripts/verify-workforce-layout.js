import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parse} from 'dotenv';
import {chromium} from '/Users/asharizakar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const env=parse(fs.readFileSync('.env'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];
try{
 await page.goto('http://127.0.0.1:3101');await page.locator('#password').fill(env.CHAT_ACCESS_PASSWORD);await page.locator('#login-form button').click();await page.locator('#team .team-entry').first().waitFor();
 for(const viewport of [{width:1440,height:1000},{width:1280,height:720},{width:390,height:844},{width:390,height:600}]){
  await page.setViewportSize(viewport);
  for(const channel of ['azre-operations-manager','azre-acquisitions-manager','general']){
   await page.locator(channel==='general'?'#general-chat':`[data-agent-id="${channel}"]`).click();
   await page.waitForTimeout(200);
   const result=await page.evaluate(()=>{const feed=document.querySelector('#messages');feed.scrollTo({top:feed.scrollHeight,behavior:'instant'});const box=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};const last=feed.querySelector('.message:last-child');const f=box(feed),c=box(document.querySelector('.composer-zone'));return {feed:f,composer:c,last:last?box(last):null,feedBottomVisible:f.bottom<=c.top+1,lastBottomVisible:!last||box(last).bottom<=f.bottom+1,composerInViewport:c.bottom<=innerHeight+1,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,bodyOverflow:document.documentElement.scrollHeight>innerHeight+1};});
   checks.push({viewport,channel,...result});
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.locator('#general-chat').click();await page.waitForTimeout(200);await page.evaluate(()=>document.querySelector('#messages').scrollTo({top:100000,behavior:'instant'}));await page.screenshot({path:'data/workforce-final-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.evaluate(()=>document.querySelector('#messages').scrollTo({top:100000,behavior:'instant'}));await page.screenshot({path:'data/workforce-final-mobile.png'});
 const result={checks,errors};fs.writeFileSync('data/workforce-layout-verification.json',JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify(result));
 assert.equal(errors.length,0);assert.ok(checks.every(c=>c.feedBottomVisible&&c.lastBottomVisible&&c.composerInViewport&&!c.horizontalOverflow&&!c.bodyOverflow&&c.feed.height>60),'Message/composer layout failed');
}finally{await browser.close();}
