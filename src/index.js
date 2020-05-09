const fs = require('fs');
const chalk = require('chalk');
const cheerio = require('cheerio');
const { log, getAgrType, Spinner, emoji, calcText, genArgs } = require('./utils');
const ppteer = require('./pp');
const evalScripts = require('../evalDOM');
const insertBtn = require('../insertBtn');

class DrawPageStructure {
  constructor({
      url,
      output = {},
      background,
      animation,
      rootNode,
      header,
      device,
      showInitiativeBtn,
      headless,
      extraHTTPHeaders,
      writePageStructure,
      customizeElement,
      init,
      injectSelector
    } = {}) {
      this.url = url;
      this.filepath = output.filepath;
      this.injectSelector = injectSelector || '#app';
      this.background = background || '#ecf0f2';
      this.animation = animation || '';
      this.rootNode = rootNode || '';
      this.header = header || '';
      this.device = device;
      this.showInitiativeBtn = showInitiativeBtn || false;
      this.headless = headless;
      this.extraHTTPHeaders = extraHTTPHeaders;
      this.writePageStructure = writePageStructure;
      this.customizeElement = customizeElement || function() {};
      this.init = init || function() {};

      if(this.headless === undefined) this.headless = true;

      if(!url) {
        log.error('please provide entry url !', 1); 
      }
      if(!output.filepath) {
        log.error('please provide output filepath !', 1); 
      }
      if(header && getAgrType(header) !== 'object') {
        log.error('[header] should be an object !', 1);
      }
      if(!fs.existsSync(output.filepath) || !fs.statSync(output.filepath).isFile()) {
        log.error('[output.filepath] should be a file !', 1); 
      }
      if(!fs.existsSync(output.filepath)) {
        log.error('[output.filepath:404] please provide the absolute filepath !', 1); 
      }
  }
  async generateSkeletonHTML(page) {
    let html = '';

    try{
      const agrs = genArgs.create({
        init: {
          type: 'function',
          value: this.init.toString()
        },
        customizeElement: {
          type: 'function',
          value: this.customizeElement.toString()
        }, 
        background: {
          type: 'string',
          value: this.background
        }, 
        animation: {
          type: 'string',
          value: this.animation
        },
        rootNode: {
          type: 'string',
          value: this.rootNode
        },
        header: {
          type: 'object',
          value: JSON.stringify(this.header)
        },
        showInitiativeBtn:{
          type: 'boolean',
          value: this.showInitiativeBtn
        }
      });
      agrs.unshift(evalScripts);//evalScripts = require('../evalDOM');,并将上述args作为参数传递给args
      html = await page.evaluate.apply(page, agrs);
    }catch(e){
      log.error('\n[page.evaluate] ' + e.message);
    }
    // await page.screenshot({path: 'example.png'});
    // let base64 = fs.readFileSync(path.resolve(__dirname, '../example.png')).toString('base64');
    return html;

  }
  writeToFilepath(html) {
    let filepath = this.filepath;
    let fileHTML = fs.readFileSync(filepath);
    let $ = cheerio.load(fileHTML, {
      decodeEntities: false
    });
    $(this.injectSelector).html(html);//injectSelector是选择插入到具体哪个节点
    fs.writeFileSync(filepath, $.html('html'));
  }
  async start() {
    const pageUrl = this.url;
    const spinner = Spinner('magentaBright');
	  spinner.text = '启动浏览器...';
    const pp = await ppteer({
      device: this.device,
      headless: this.headless,
      showInitiativeBtn: this.showInitiativeBtn
    });
    spinner.text = `正在打开页面：${ pageUrl }...`;
    spinner.stop();

    const page = await pp.openPage(pageUrl, this.extraHTTPHeaders);
    if(this.showInitiativeBtn){//用户需要主动操作的话，先插入一个按钮然后在页面结构稳定后主动触发生成骨架屏
      await page.exposeFunction('renderSkeleton', async ()=>{
        await this.renderSkeleton(page,pp);
      });
    }else{
      await this.renderSkeleton(page,pp);
    }
    return pp;
  }
  async renderSkeleton (page,pp){
    const spinner = Spinner('magentaBright');
    spinner.text = '正在生成骨架屏...';
    const html = await this.generateSkeletonHTML(page);
    if(getAgrType(this.writePageStructure) === 'function') {
      this.writePageStructure(html, this.filepath);
    }
    if(this.filepath) {
      this.writeToFilepath(html);
    }
    spinner.stop();

    
    console.log(' %s ', chalk.green(emoji.get('heavy_check_mark')), `skeleton screen has created and output to ${calcText(this.filepath)}`);
    console.log(` %s  骨架屏已生成完毕.`, chalk.yellow(emoji.get('coffee')));

    // if(!this.headless) {//如果是主动控制的话，那么就不应该关闭。需要开发主动去关闭
    //   await pp.browser.close();
    //   process.exit(0);
    // }
  }
}

module.exports = DrawPageStructure;
