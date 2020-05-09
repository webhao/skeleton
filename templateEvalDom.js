module.exports = function evalDOM() {
    const ELEMENTS = ['audio', 'button', 'canvas', 'code', 'img', 'input', 'pre', 'svg', 'textarea', 'video', 'xmp'];
    const blocks = [];
    const win_w = window.innerWidth;
    const win_h = window.innerHeight;
    console.log(arguments)
    let agrs = arguments;
    if(!agrs.length) agrs = {length: 1, 0: {}};
    let agrs0 = agrs[0];
    
    if(agrs.length !== 1 || getArgtype(agrs0) !== 'object') {
      agrs = parseAgrs([...agrs]);
    }
  
    function drawBlock({width, height, top, left, zIndex = 999, background, radius} = {}) {
      const styles = [
        'position: fixed',
        'z-index: '+zIndex,
        'top: '+top+'%',
        'left: '+left+'%',
        'width: '+width+'%',
        'height: '+height+'%',
        'background: '+(background || agrs.background)
      ];
      radius && radius != '0px' && styles.push('border-radius: '+ radius);
      agrs.animation && styles.push('animation: '+ agrs.animation);
      blocks.push(`<div style="${styles.join(';')}"></div>`);
      console.log(blocks)
    }
  
    function wPercent(x) {
      return parseFloat(x/win_w*100).toFixed(3);
    }
    
    function hPercent(x) {
      return parseFloat(x/win_h*100).toFixed(3);
    }
  
    function noop() {}
  
    function getArgtype(arg){
      return Object.prototype.toString.call(arg).toLowerCase().match(/\s(\w+)/)[1];
    }
  
    function getStyle(node, attr) {//获取node节点包含的css样式，并返回要查找的样式
      return (node.nodeType === 1? getComputedStyle(node)[attr]: '') || '';
    }
  
    function getRootNode(el) {
      if(el && getArgtype(el) === 'string') {
        return document.querySelector(el);
      }
    }
  
    function includeElement(elements, node) {
      return ~elements.indexOf((node.tagName || '').toLowerCase());
    }
  
    function isHideStyle(node) {//判断元素是不是隐藏的
      return getStyle(node, 'display') === 'none' || 
          getStyle(node, 'visibility') === 'hidden' || 
          getStyle(node, 'opacity') == 0 ||
          node.hidden;
    }
  
    function isCustomCardBlock(node) {
      const bgStyle = getStyle(node, 'background');
      const bgColorReg = /rgba\([\s\S]+?0\)/ig;
      const bdReg = /(0px)|(none)/;
      const hasBgColor = !bgColorReg.test(bgStyle) || ~bgStyle.indexOf('gradient');
      const hasNoBorder = ['top', 'left', 'right', 'bottom'].some(item => {
        return bdReg.test(getStyle(node, 'border-'+item));
      });
      const {w, h} = getRect(node);
      const customCardBlock = !!(hasBgColor && (!hasNoBorder || getStyle(node, 'box-shadow') != 'none') && w > 0 && h > 0 && w < 0.95*win_w && h < 0.3*win_h);
      return customCardBlock;
    }
  
    function calcTextWidth(text, {fontSize, fontWeight} = {}) {
      if(!text) return 0;
  
      const div = document.createElement('div');
      div.innerHTML = text;
      div.style.cssText = [
        'position:absolute',
        'left:-99999px',
          `height:${fontSize}`,
        `font-size:${fontSize}`,
        `font-weight:${fontWeight}`,
        'opacity:0'
      ].join(';');
      document.body.appendChild(div);
      const w = getStyle(div, 'width');
      const h = getStyle(div, 'height');
      document.body.removeChild(div);
      return {
        w: parseInt(w),
        h: parseInt(h)
      };
    }
  
    function getRect(node) {
      if(!node) return {};
      const { top: t, left: l, width: w, height: h } = node.getBoundingClientRect();
      return {t, l, w, h};
    }
  
    function getPadding(node) {
      return {
        paddingTop: parseInt(getStyle(node, 'paddingTop')),
        paddingLeft: parseInt(getStyle(node, 'paddingLeft')),
        paddingBottom: parseInt(getStyle(node, 'paddingBottom')),
        paddingRight: parseInt(getStyle(node, 'paddingRight'))
      }
    }
  
    function parseAgrs(agrs = []) {
      let params = {};
      agrs.forEach(agr => {
        const sep = agr.indexOf(':');
        const [appName, name, type] = agr.slice(0, sep).split('-');
        const val = agr.slice(sep + 1);
        params[name] = type === 'function'? eval('(' + val + ')'): 
                        type === 'object'? JSON.parse(val):
                        val;
      });
      return params;
    }
  
    function DrawPageframe(opts) {
      this.rootNode = getRootNode(opts.rootNode) || document.body;//根节点
      this.offsetTop = opts.offsetTop || 0;
      this.includeElement = opts.includeElement;
      this.init = opts.init;
      this.originStyle = {};
  
      return this instanceof DrawPageframe? this: new DrawPageframe(opts); 
    }
  
    DrawPageframe.prototype = {
      resetDOM: function() {
        this.init && this.init();
        this.originStyle = {
          scrollTop: window.scrollY,
          bodyOverflow: getStyle(document.body, 'overflow')
        };
        window.scrollTo(0, this.offsetTop);
        document.body.style.cssText += 'overflow:hidden!important;';
        drawBlock({//整个页面的背景
          width: 100, 
          height: 100, 
          top: 0, 
          left: 0, 
          zIndex: 990,
          background: '#fff'
        });
        this.withHeader();
      },
      inHeader: function(node) {
        if(agrs.header) {
          const height = parseInt(agrs.header.height);
          if(height) {
            const {t, l, w, h} = getRect(node);
            return t <= height;
          }
        }
      },
      withHeader: function() {//如果包含头部的话执行这个函数
        if(agrs.header) {
          const {height, background} = agrs.header;
          const hHeight = parseInt(height);
          const hBackground = background || agrs.background;
          if(hHeight) {
            drawBlock({
              width: 100, 
              height: hPercent(hHeight), 
              top: 0, 
              left: 0, 
              zIndex: 999,
              background: hBackground
            });
          }
        }
      },
      showBlocks: function() {
        if(blocks.length) {
          const { body } = document;
          const blocksHTML = blocks.join('');
          const div = document.createElement('div');
          div.innerHTML = blocksHTML;
          body.appendChild(div);
  
          window.scrollTo(0, this.originStyle.scrollTop);
          document.body.style.overflow = this.originStyle.bodyOverflow;
  
          return blocksHTML;
        }
      },
  
      startDraw: function() {
        console.log('in')
        const $this = this;
        this.resetDOM();
        const nodes = this.rootNode.childNodes;
        
        function deepFindNode(nodes) {
          console.log(nodes)
          if(nodes.length) {
            for(let i = 0; i < nodes.length; i++) {
              
              let node = nodes[i];
              if(isHideStyle(node) || (getArgtype($this.includeElement) === 'function' && $this.includeElement(node, drawBlock) == false)) continue;
              let childNodes = node.childNodes;
              let hasChildText = false;
              let background = getStyle(node, 'backgroundImage');
              let backgroundHasurl = background.match(/url\(.+?\)/);//判断background里面是不是包含imageurl
              
              backgroundHasurl = backgroundHasurl && backgroundHasurl.length;
  
              for(let j = 0; j < childNodes.length; j++) {//判断是不是文字节点，当前节点的所有子节点里面是不是包含文本节点
                if(childNodes[j].nodeType === 3 && childNodes[j].textContent.trim().length) {
                  hasChildText = true;
                  break;
                }
              }
              //如果父节点下面的子节点里面包含了一个nodeType为3的文本节点，那么表示就直接去画当前这个元素了
              if((includeElement(ELEMENTS, node) || 
                backgroundHasurl ||
                (node.nodeType === 3 && node.textContent.trim().length) || hasChildText ||
                isCustomCardBlock(node)) && !$this.inHeader(node)) {//原意应该是把符合这几项
                  const {t, l, w, h} = getRect(node);
                  console.log(node.id)
                  if(w > 0 && h > 0 && l >= 0 && l < win_w && t < win_h - 100 && t >= 0) {
                    const {
                      paddingTop,
                      paddingLeft,
                      paddingBottom,
                      paddingRight
                    } = getPadding(node);
                    drawBlock({
                      width: wPercent(w - paddingLeft - paddingRight), 
                      height: hPercent(h - paddingTop - paddingBottom), 
                      top: hPercent(t + paddingTop), 
                      left: wPercent(l + paddingLeft),
                      radius: getStyle(node, 'border-radius')
                    });
                  }
              } else if(childNodes && childNodes.length) {
                if(!hasChildText) {
                  deepFindNode(childNodes);
                }
              }
            }
          }
        }
  
        deepFindNode(nodes);
        return this.showBlocks();
      }
    }
  
    return new Promise((resolve, reject) => {   
      setTimeout(() => {
        try{
          const html = new DrawPageframe({
            init: agrs.init,
            rootNode: agrs.rootNode,
            includeElement: agrs.includeElement
          }).startDraw();
          resolve(html);
        }catch(e) {
          reject(e);
        }
      }, 1000);
    }); 
  
  }
  
  // 待优化：
  // 1. table
  // 2. 文字
  
  //核心方法是getComputedStyle