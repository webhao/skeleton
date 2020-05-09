module.exports = function evalDOM() {
    const MeanlessTags = ['script', 'link', 'style', 'meta', 'head', 'footer', 'html'];
    const InnerElements = ['a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'cite', 'code', 'dfn', 'em', 'font', 'i', 'img', 'input', 'kbd', 'label', 'q', 's', 'samp', 'select', 'small', 'span', 'strike', 'strong', 'sub', 'sup'];
    const BlockElements = ['address', 'blockquote', 'center', 'dir', 'div', 'dl', 'fieldset', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'isindex', 'menu', 'noframes', 'noscript', 'ol', 'pre', 'table', 'ul', 'li'];
    const win_w = window.innerWidth;
    const win_h = window.innerHeight;
    let agrs = arguments;
    if (!agrs.length) { agrs = { length: 1, 0: {} }; }
    const agrs0 = agrs[0];
    
    if (agrs.length !== 1 || getArgtype(agrs0) !== 'object') {
        agrs = parseAgrs([...agrs]);
    }

    function getRenderStyle(styleGroup = {}, node, wrapDomType,keepStyle) {
        let styles = [];
        let drawNodeW = 0;
        let drawNodeH = 0;
        const nodeRect = getRect(node);
        const nodePadding = getPadding(node);
        const nodeMargin = getMargin(node);
        if (wrapDomType === '0') { //wrapDomType为0的时候，表明这这是外面一个父级组件，不需要给他渲染具体的背景色只需要它来占个位置，然后把决定它具体位置新的关键信息返回就可以了
            const computedAttributes = getNodeStylesByBoxSizing(node, nodeRect, nodePadding, nodeMargin, wrapDomType);
            styles = computedAttributes.styles;
            drawNodeW = computedAttributes.drawNodeW;
            drawNodeH = computedAttributes.drawNodeH;
            styles.push(`width:${drawNodeW}px`);
            styles.push(`height:${drawNodeH}px`);
            styles.push(`max-height:${win_h}px`);
            styles.push(`max-width:${win_w}px`);
            styles.push('background:#fff');
            styles.push('overflow:hidden');
            return `<div style="${styles.join(';')}" id="${node.className}"></div>`;
        } else if (wrapDomType === '1') { //非顶级元素的绘制，有可能是父元素
            if (currentNodeContainBack(node)) { //如果当前节点设置了背景色或者背景图
                drawNodeH = nodeRect.h;
                drawNodeW = nodeRect.w;
                styles = getNormaldecidePositionCssAttributes(node);
            } else {
                const computedAttributes = getNodeStylesByBoxSizing(node, nodeRect);
                styles = computedAttributes.styles;
                drawNodeW = computedAttributes.drawNodeW;
                drawNodeH = computedAttributes.drawNodeH;
            }
            styles.push(`width:${drawNodeW}px`);
            styles.push(`height:${drawNodeH}px`);
            styles.push('overflow:hidden');
            return getParentRenderStyle(styles, node, keepStyle);
        //return `<div style="${styles.join(';')}"></div>`;   
        }
    }
    function childNodesExistOtherNode(node) {
        if (!node.childNodes) {
            return false;
        }
        const childNodes = nodeListToArray(node.childNodes);
        return childNodes.some((item, index) => {
            return item.nodeType !== 3 || (item.nodeType === 3 && item.textContent.trim().length !== 0);
        });
        
    }
    function getParentRenderStyle(styles, node, keepStyle) {
        const tempStyles = styles.slice(0);
        if (getStyle(node, 'box-sizing') === 'content-box' && childNodesExistOtherNode(node), !keepStyle) {
            tempStyles.push('background:#fff');
            return `<div style="${tempStyles.join(';')}" id="${node.className}"><div style="width:100%;height:100%;background:#eee"></div></div>`;
        }
        tempStyles.push('background:#eee');
        return `<div style="${tempStyles.join(';')}" id="${node.className}"></div>`;
        
    }
    function getCustomizeStyle(opt,node){
        if(opt === true){
            return getRenderStyle({}, node, '1',true);
        }else if(getArgtype(opt) === 'object'){
            let styles = []
            Object.keys(opt).forEach((item)=>{
                styles.push(item+':'+opt[item])
            })
            return `<div style="${styles.join(';')}"></div>`;
        }
    }
    function getNodeStylesByBoxSizing(node, nodeRect) {
        let drawNodeH = 0;
        let drawNodeW = 0;
        let styles = [];
    
        const elementHeight = parseInt(getStyle(node, 'height'));//元素样式的真实高度
        const elementWidth = parseInt(getStyle(node, 'width'));//元素样式的真实宽度
        drawNodeH = elementHeight < nodeRect.h ? elementHeight : nodeRect.h;
        drawNodeW = elementWidth < nodeRect.w ? elementWidth : nodeRect.w;
        styles = getNormaldecidePositionCssAttributes(node);
        return { drawNodeH, drawNodeW, styles };
    }
    function getNormaldecidePositionCssAttributes(node) {
        const nodeAllStyle = getAllStyle(node);
        const positionCssAttributes = ['position', 'z-index', 'top', 'left', 'bottom',
            'right', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom', 'padding-left',
            'padding-right', 'transform','padding-top', 'padding-bottom', 'display', 'align-items',
            'justify-content', 'flex-shrink', 'flex-wrap', 'flex-direction', 'box-sizing','border-radius'];
        const resStyles = [];
        positionCssAttributes.forEach((item) => {
            resStyles.push(`${item}:${nodeAllStyle[item]}`);
        });
        if (nodeAllStyle.display === 'inline' && (nodeAllStyle.width !== 0 || nodeAllStyle.height !== 0)) { //做了一次元素转换后发现如果样式变成了inline,
            resStyles.splice(resStyles.indexOf('display:inline', 1, 'display:inline-block'));
        }
        return resStyles;
    }
    function currentNodeContainBack(node) { //判断当前节点是不是设置过背景色或者设置了背景图片
        const nodeAllStyle = getAllStyle(node);
        const backgroundColor = nodeAllStyle.backgroundColor;
        const backgroundImage = nodeAllStyle.backgroundImage;
        const bgColorReg = /rgba\([\s\S]+?0\)/ig;
        if (backgroundColor === 'rgb(255, 255, 255)' || bgColorReg.test(backgroundColor) || backgroundImage !== 'none') {
            return false;
        }
        return true;
    }

    function getArgtype(arg) {
        return Object.prototype.toString.call(arg).toLowerCase().match(/\s(\w+)/)[1];
    }

    function getStyle(node, attr) { //获取node节点包含的css样式，并返回要查找的样式
    // console.log(getComputedStyle(node))
        return (node.nodeType === 1 ? getComputedStyle(node)[attr] : '') || '';
    }
    function getAllStyle(node) {
        return (node.nodeType === 1 ? getComputedStyle(node) : {}) || {};
    }
    function getRootNode(el) {
        if (el && getArgtype(el) === 'string') {
            return document.querySelector(el);
        }
    }
    
    function getRect(node) {
        if (!node) { return {}; }
        const { top: t, left: l, width: w, height: h } = node.getBoundingClientRect();
        return { t, l, w, h };
    }

    function getPadding(node) {
        return {
            paddingTop: parseFloat(getStyle(node, 'paddingTop')),
            paddingLeft: parseFloat(getStyle(node, 'paddingLeft')),
            paddingBottom: parseFloat(getStyle(node, 'paddingBottom')),
            paddingRight: parseFloat(getStyle(node, 'paddingRight')),
        };
    }

    function getMargin(node) {
        return {
            marginTop: parseFloat(getStyle(node, 'marginTop')),
            marginLeft: parseFloat(getStyle(node, 'marginLeft')),
            marginBottom: parseFloat(getStyle(node, 'marginBottom')),
            marginRight: parseFloat(getStyle(node, 'marginRight')),
        };
    }

    function parseAgrs(agrs = []) {
        const params = {};
        agrs.forEach((agr) => {
            const sep = agr.indexOf(':');
            const [appName, name, type] = agr.slice(0, sep).split('-');
            const val = agr.slice(sep + 1);
            params[name] = type === 'function' ? eval(`(${val})`) :
                type === 'object' ? JSON.parse(val) :
                    val;
        });
        return params;
    }
    function analyseIfHadBackground(node) {
        const background = getStyle(node, 'backgroundImage');
        let backgroundHasurl = background.match(/url\(.+?\)/);//判断background里面是不是包含imageurl
        backgroundHasurl = backgroundHasurl && backgroundHasurl.length;
        const nodeRect = getRect(node);
        if (nodeRect.w > 0.8 * win_w || nodeRect.h > 0.8 * win_h) { //这个地方暂时没有什么好的思路
            return false;
        }
        return backgroundHasurl;
        
    }
    function nodeListToArray(nodeLists) { //节点数组转成普通数组，为了使用some方法
        return Array(...nodeLists);
    }
    function DrawPageframe(opts) {
        this.rootNode = getRootNode(opts.rootNode) || document.body;//根节点
        this.offsetTop = opts.offsetTop || 0;
        this.customizeElement = opts.customizeElement;
        this.init = opts.init;
        this.originStyle = {};

        return this instanceof DrawPageframe ? this : new DrawPageframe(opts);
    }
    function isMeanlessTag(node) {
        const tagName = (node.tagName || '').toLowerCase();
        if (MeanlessTags.indexOf(tagName) >= 0) {
            return true;
        }
        return false;
    }
    function isHiddenInBody(node) {
        const nodeRect = getRect(node);
        if ((nodeRect.l) > win_w || (nodeRect.t) > win_h) {
            return true;
        }
        return false;
    }
    function analyseIsInnerElement(node) { //判断一个元素是不是内联元素
        //const displayStyle = getStyle(node, 'display');
        const currentNodeTagName = (node.tagName || '').toLowerCase();
        if (InnerElements.indexOf(currentNodeTagName) < 0) {
            return false;
        }
        return true;
    }
    DrawPageframe.prototype = {
        beforeRenderDomStyle: function () {
            this.init && this.init();
        
        // return getRenderStyle({//整个页面的背景
        //   width: 100, 
        //   height: 100,   
        //   background: '#fff'
        // },null,'topContainer');
        },
    
        showBlocks: function (htmlStr) {
            const { body } = document;
            body.innerHTML = htmlStr;
            return htmlStr;
        },
        shouldDrawCurrentNode(node) { //是否要画出当前节点的轮廓
            const currentChildNodes = node.childNodes;
        
            if (!currentChildNodes || currentChildNodes.length === 0) { //如果当前节点不包括子节点或者子节点nodeList长度为0
                return true;
            }
            const childNodesArr = nodeListToArray(currentChildNodes);
    
            const childHasBlockElement = childNodesArr.some((item, index) => { //如果当前节点的所有子节点都是内联元素的话那么
                const currentNodeTagName = (item.tagName || '').toLowerCase();
                return (InnerElements.indexOf(currentNodeTagName) < 0 && currentNodeTagName);
            });
            return !childHasBlockElement;
        
        },
        shouldIgnoreCurrentElement(node) {
            const nodeAllStyle = getAllStyle(node);
            const displayStyle = nodeAllStyle.display;
            const visibilityStyle = nodeAllStyle.visibility;
            const opacityStyle = nodeAllStyle.opacity;
            const widthStyle = nodeAllStyle.width;
            const heightStyle = nodeAllStyle.height;
            if (displayStyle === 'node' || visibilityStyle === 'hidden' ||
        opacityStyle === '0' || widthStyle === '0px' ||
        heightStyle === '0px' || node.nodeType !== 1 || isMeanlessTag(node) || isHiddenInBody(node)) { //这几类元素在处理的过程中应该直接略过去
                return true;
            }
        },
        startDraw: function () {
            const $this = this;
            const domWrapHtmlStr = this.beforeRenderDomStyle();
            const nodes = this.rootNode.childNodes;
            function childNodesStyleConcat(parenthtmlWrapStr, childNodes) { //htmlWrapSer是子节点外面需要包的父节点的样式字符串
                let childHtmlStr = '';

                for (let i = 0; i < childNodes.length; i++) {
                    const currentChildNode = childNodes[i];//当前子节点
                    //有哪些节点要跳过绘制骨架屏的过程
                    if ($this.shouldIgnoreCurrentElement(currentChildNode)) { //是否应该忽略当前节点，不采取任何措施。后续这个地方可以由用户指定哪些节点应该被略去，todo
                        continue;
                    }
                    if($this.customizeElement(currentChildNode) !== false){
                        childHtmlStr = childHtmlStr + getCustomizeStyle($this.customizeElement(currentChildNode),currentChildNode);
                        continue;
                    }
                    const backgroundHasurl = analyseIfHadBackground(currentChildNode);
                    if (backgroundHasurl || analyseIsInnerElement(currentChildNode) || $this.shouldDrawCurrentNode(currentChildNode)) { //如果当前元素是内联元素或者当前元素非内联元素，但是不包含子节点或者子节点都是内联元素的话那么我们就在当前的骨架屏上绘制此节点。
                        childHtmlStr = childHtmlStr + getRenderStyle({}, currentChildNode, '1');
                    } else if (!$this.shouldDrawCurrentNode(currentChildNode)) { //如果当前节点包含子节点并且节点内至少有一个不是内联元素
                        //递归
                        childHtmlStr = childHtmlStr + childNodesStyleConcat(getRenderStyle({}, currentChildNode, '0'), currentChildNode.childNodes);
                    }
                }
                if (!parenthtmlWrapStr) {
                    return childHtmlStr;
                }
                return parenthtmlWrapStr.replace(/>/, `>${childHtmlStr}`);
        
            }
            const resultHtmlStr = childNodesStyleConcat('', nodes);
            return this.showBlocks(resultHtmlStr);
        },
    };

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const html = new DrawPageframe({
                    customizeElement: agrs.customizeElement
                }).startDraw();
                resolve(html);
            } catch (e) {
                reject(e);
            }
        }, 2000);
    });
}

// 待优化：
// 1. table
// 2. 文字

//核心方法是getComputedStyle