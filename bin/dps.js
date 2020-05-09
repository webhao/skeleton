#!/usr/bin/env node

const program = require('commander')
const prompts = require('prompts')
const path = require('path')
const fs = require('fs')
const pkg = require('../package.json')
const defConf = require('./default.config')
const DrawPageStructure = require('../src')
const utils = require('../src/utils')

  program
  .version(pkg.version)
  .usage('<command> [options]')
  .option('-v, --version', 'latest version');

  program
  .command('init')
  .description('create a default dps.config.js file')
  .action(function(env, options) {
    const dpsConfFile = path.resolve(process.cwd(), defConf.filename)
    if(fs.existsSync(dpsConfFile)) {
      return console.log(`\n[${defConf.filename}] had been created! you can edit it and then run 'dps start'\n`)
    }
    askForConfig().then(ans => {
      const outputPath = path.resolve(process.cwd(), ans.filepath).replace(/\\/g, '\\\\')
      prompts({
        type: 'toggle',
        name: 'value',
        message: `Are you sure to create skeleton screen base on ${ans.url}. \n and will output to ${utils.calcText(outputPath)}`,
        initial: true,
        active: 'Yes',
        inactive: 'no'
      }).then(res => {
        if(res.value) {
          fs.writeFile(
            path.resolve(process.cwd(), defConf.filename), 
            defConf.getTemplate({
              url: ans.url,
              filepath: outputPath
            }),
            err => {
              if(err) throw err;
              console.log(`\n[${defConf.filename}] had been created! now, you can edit it and then run 'dps start'\n`)
            }
          )
        }
      })
    });
  });

  // program
  // .command('start')
  // .description('start create a skeleton screen')
  // .action(function() {
  //   const dpsConfFile = path.resolve(process.cwd(), defConf.filename)
  //   if(!fs.existsSync(dpsConfFile)) {
  //     utils.log.error(`please run 'dps init' to initialize a config file`, 1)
  //   }
  //   new DrawPageStructure(require(dpsConfFile)).start()
  // });
  // 常规页面自动生成骨架屏
  program
  .command('start')
  .action(async function() {
    const configPath = `${process.env.PWD}/skeleton.config.js`
    const skeletonPath = `${process.env.PWD}/skeleton`
    if(fs.existsSync(configPath)) {
      if(!fs.existsSync(skeletonPath)) {
        // create
        fs.mkdirSync(skeletonPath)
      }
      // delete
      // deleteFolder(skeletonPath)

      // get config
      let skeletonConfig = require(`${process.env.PWD}/skeleton.config.js`)
      // 页面配置
      const pages = skeletonConfig.skeletonPages
      // 已有骨架屏
      fs.readdir(skeletonPath, async(err, files) => {
        if(err) {
          return console.log('目录不存在')
        }
        // 已有骨架屏不重新生成
        files.forEach(file => {
          const fileName = file.split('.html')[0]
          delete pages[fileName]
        })
        const length = Object.keys(pages).length
        let count = 0
        if(length) {
          for(let i in pages) {
            let filepath = `${skeletonPath}/${i}.html`
            let config = formatConfig(pages[i],filepath)
            
            fs.writeFileSync(filepath)
            let pp = await new DrawPageStructure(config).start();
            if(pp) {
              count ++
              if(count === length) {
                await pp.browser.close();
                process.exit(0);
              }
            }
          }
        }else{
          console.log('已存在的骨架屏不再次生成，暂无要生成骨架屏的配置。')
        }
      })
    }else{
      console.log('当前目录未找到skeleton.config.js文件')
    }
  });

  program
  .command('special')
  .action(async function() {
    const configPath = `${process.env.PWD}/skeleton.config.js`
    const skeletonPath = `${process.env.PWD}/skeleton`
    if(fs.existsSync(configPath)) {
      if(!fs.existsSync(skeletonPath)) {
        // create
        fs.mkdirSync(skeletonPath)
      }
      // get config
      let skeletonConfig = require(`${process.env.PWD}/skeleton.config.js`)
      // 页面配置
      const pages = skeletonConfig.initiativeStartPages
      // 每次只生成一个页面
      fs.readdir(skeletonPath, async(err, files) => {
        if(err) {
          return console.log('目录不存在')
        }
        // 已有骨架屏不重新生成
        files.forEach(file => {
          const fileName = file.split('.html')[0]
          delete pages[fileName]
        })
        const length = Object.keys(pages).length
        if(length) {
          if(length > 1) {
            console.log('每次生成一个页面')
            return false
          }else{
            for(let i in pages) {
              let filepath = `${skeletonPath}/${i}.html`
              let config = formatConfig(pages[i],filepath)
              fs.writeFileSync(filepath)
    
              await new DrawPageStructure(config).start();
            }
          }
        }else{
          console.log('已存在的骨架屏不再次生成，暂无要生成骨架屏的配置。')
        }
      })
    }
  })

  program.parse(process.argv);
  if (program.args.length < 1) program.help()

function askForConfig() {
  const questions = [
    {
      type: 'text',
      name: 'url',
      message: "What's your page url ?",
      validate: function(value) {
        const urlReg = /^https?:\/\/.+/ig;
        if (urlReg.test(value)) {
          return true;
        }
  
        return 'Please enter a valid url';
      }
    },
    {
      type: 'text',
      name: 'filepath',
      message: "Enter a relative output filepath ?",
      validate: function(value) {
        if(!value) {
          return 'Please enter a filepath'
        }else{
          return true;
        }
      }
    }
  ];
  return prompts(questions);
}

function formatConfig({
  url,
  device,
  background,
  animation,
  includeElement,
  writePageStructure,
  init,
  showInitiativeBtn,
  headless,
  injectSelector
} = {...config}, filePath) {
  return {
    url,
    device: device || 'mobile',
    output: {
        filepath: filePath,
    },
    injectSelector: injectSelector || 'body',
    background: background || '#eee',
    animation: animation || 'opacity 1s linear infinite;',
    includeElement: includeElement || function() {},
    writePageStructure: writePageStructure || function() {},
    init: init || function() {},
    showInitiativeBtn: showInitiativeBtn || false,
    headless: headless == undefined ? true : headless,
  }
}