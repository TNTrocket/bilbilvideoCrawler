const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const exec = require('child_process').exec

async function openBililUrl(url) {
    let action = {}
    if(!url || !(url.includes('http')) || !(url.includes(`www.bilibili.com`))){
        console.error('必须传入b站的网址')
        return Promise.reject()
    }
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    let refererUrl = url
    await page.goto(refererUrl)
    await page.waitForSelector('#playerWrap')
    let playInfo = await page.evaluate(() => {
        return window.__playinfo__
    })
    let videoTitle = await page.evaluate(() => {
        return document.querySelector('.video-title').textContent
    })
    await browser.close()
    let video = playInfo.data.dash.video[0]['baseUrl']
    let audio = playInfo.data.dash.audio[0]['baseUrl']
    await getData(refererUrl, audio, videoTitle, 'audio')
    await getData(refererUrl, video, videoTitle)
    ffmpeg(path.join(process.cwd(), `${videoTitle}_temp.mp4`)).addInput(path.join(process.cwd(), `${videoTitle}_temp.mp3`)).output(path.join(process.cwd(), `${videoTitle}.mp4`)).on('end', function () {
        exec(`rm -rf ${path.join(process.cwd(), videoTitle + '_temp.mp3')} && rm -rf ${path.join(process.cwd(), videoTitle + '_temp.mp4')}`, function(){
            console.log('Finished processing');
            action.resolve()
        })
    }).run();
    return new Promise((resolve, reject) => {
        action = {
            resolve,
            reject
        }
    })
}

async function getData(refererUrl, url, name, type) {
    let action = {}
    let status = await axios({
        url,
        method: 'options',
        headers: {
            'Connection': 'keep-alive',
            'Access-Control-Request-Method': 'GET',
            'Origin': 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3970.5 Safari/537.36',
            'Access-Control-Request-Headers': 'range',
            'Accept': '*/*',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'referer': refererUrl
        }
    })
    let {
        data
    } = await axios({
        url,
        method: 'get',
        responseType: 'stream',
        headers: {
            'Connection': 'keep-alive',
            'Origin': 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3970.5     Safari/537.36',
            'Accept': '*/*',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'Accept-Encoding': 'identity',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            // 'Range': 'bytes=0-907',
            'referer': refererUrl
        }
    })
    data.pipe(fs.createWriteStream(`${process.cwd()}/${name}_temp.${type === 'audio'? 'mp3': 'mp4'}`));
    data.on('end', () => {
        console.log(`${name}.${type === 'audio'? 'mp3': 'mp4'}` + '下载完毕')
        action.resolve()
    })
    return new Promise((resolve, reject) => {
        action = {
            resolve,
            reject
        }
    })
}

module.exports = {
    openBililUrl
}