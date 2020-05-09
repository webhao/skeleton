module.exports = function evalDOM() {
    const MeanlessTags = ['script', 'link', 'style', 'meta', 'head', 'footer', 'html'];
    const ELEMENTS = ['audio', 'button', 'canvas', 'code', 'img', 'input', 'pre', 'svg', 'textarea', 'video', 'xmp', 'i'];//无法包含子元素的节点
    const win_w = window.innerWidth;
    const win_h = window.innerHeight;
    const blocks = [];
    console.log(arguments)
    let agrs = arguments;
    if (!agrs.length) { agrs = { length: 1, 0: {} }; }
    const agrs0 = agrs[0];
    
    if (agrs.length !== 1 || getArgtype(agrs0) !== 'object') {
        agrs = parseAgrs([...agrs]);
    }
    function wPercent(x) {
        return parseFloat(x / win_w * 100).toFixed(3);
    }
      
    function hPercent(x) {
        return parseFloat(x / win_h * 100).toFixed(3);
    }
    function getRenderStyle(node, hasDirectTextChild) {
        //hasDirectTextChild表示当前节点的子元素是否包含文本节点元素
        const { t, l, w, h } = getRect(node);
        const boxSizing = getStyle(node, 'box-sizing');
        const {
            paddingTop,
            paddingLeft,
            paddingBottom,
            paddingRight,
        } = getPadding(node);
        let width = 0;
        let height = 0;
        let top = 0;
        let left = 0;
        if (!hasDirectTextChild) {
            const nodeWidth = getStyle(node, 'width');
            const nodeHeight = getStyle(node, 'height');
            if (boxSizing === 'border-box') {
                if (parseInt(nodeWidth, 10) >= 0) { //如果开发设置了width
                    width = wPercent(w - paddingLeft - paddingRight);
                    left = wPercent(l + paddingLeft);
                } else {
                    width = wPercent(w);
                    left = wPercent(l);
                }
                if (parseInt(nodeHeight, 10) >= 0) {
                    height = hPercent(h - paddingTop - paddingBottom);
                    top = hPercent(t + paddingTop);
                } else {
                    height = hPercent(h);
                    top = hPercent(t);
                }
            } else {
                width = wPercent(w);
                height = hPercent(h);
                top = hPercent(t);
                left = wPercent(l);
            }
        } else {
            width = wPercent(w);
            height = hPercent(h);
            top = hPercent(t);
            left = wPercent(l);
        }
        const zIndex = getStyle(node, 'z-index') === 'auto' ? 999 : getStyle(node, 'z-index');
        if (parseInt(width) === 0 || parseInt(height) === 0) {
            return false;
        }
        
        const styles = [
            'position: fixed',
            `z-index: ${zIndex}`,
            `top: ${top}%`,
            `left: ${left}%`,
            `width: ${width}%`,
            `height: ${height}%`,
            'background: #eee',
        ];
        
        const radius = getStyle(node, 'border-radius');
        radius && radius != '0px' && styles.push(`border-radius: ${radius}`);
        blocks.push(`<div style="${styles.join(';')}"></div>`);
    }
    
    function getArgtype(arg) {
        return Object.prototype.toString.call(arg).toLowerCase().match(/\s(\w+)/)[1];
    }

    function getStyle(node, attr) { //获取node节点包含的css样式，并返回要查找的样式
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
                type === 'object' ? JSON.parse(val) : type === 'boolean' ? JSON.parse(val) :
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
    function analyseIsEmptyElement(node) { //判断一个元素是不是内联元素
        //const displayStyle = getStyle(node, 'display');
        const currentNodeTagName = (node.tagName || '').toLowerCase();
        if (ELEMENTS.indexOf(currentNodeTagName) < 0) {
            return false;
        }
        return true;
    }
    function childrenNodesHasText(node) {
        const childNodes = node.childNodes;
        let hasChildText = false;
        for (let j = 0; j < childNodes.length; j++) { //判断是不是文字节点，当前节点的所有子节点里面是不是包含文本节点
            if (childNodes[j].nodeType === 3 && childNodes[j].textContent.trim().length) {
                hasChildText = true;
                break;
            }
        }
        return hasChildText;
    }
    function shouldDrawCurrentNode(node) { //是否要画出当前节点的轮廓,这个方法里面可以加入自己的判断，其次可以对一下特殊情况做处理
        //判断是否存在轮播图的情况
        if (!node.childNodes || node.childNodes.length === 0) {
            return true;
        }
        return false;
    
    }
    DrawPageframe.prototype = {
        beforeRenderDomStyle: function () {
            this.init && this.init();
            const styles = [
                'position: fixed',
                'z-index: 0',
                'top: 0%',
                'left: 0%',
                'width:100%',
                'height: 100%',
                'background: #fff',
            ];
            blocks.push(`<div style="${styles.join(';')}"></div>`);
        },
    
        showBlocks: function (htmlStr) {
            if (blocks.length) {
                const { body } = document;
                const blocksHTML = blocks.join('');
                body.innerHTML = blocksHTML;
                
                return blocksHTML;
            }
            return '';
        },
        shouldIgnoreCurrentElement(node) {
            const nodeAllStyle = getAllStyle(node);
            const displayStyle = nodeAllStyle.display;
            const visibilityStyle = nodeAllStyle.visibility;
            const opacityStyle = nodeAllStyle.opacity;
            if (node.nodeType !== 1) {
                return true;
            }
            const { w, h } = getRect(node);
            if (displayStyle === 'none' || visibilityStyle === 'hidden' ||
            opacityStyle === '0' || isMeanlessTag(node) || isHiddenInBody(node) || node.id === 'renderSkeleton') { //这几类元素在处理的过程中应该直接略过去
                return true;
            }
            return false;
        },
        startDraw: function () {
            const $this = this;
            const nodes = this.rootNode.childNodes;
            this.beforeRenderDomStyle();
            function childNodesStyleConcat(childNodes) {
                for (let i = 0; i < childNodes.length; i++) {
                    const currentChildNode = childNodes[i];//当前子节点
                    //有哪些节点要跳过绘制骨架屏的过程
                   
                    if ($this.shouldIgnoreCurrentElement(currentChildNode)) { //是否应该忽略当前节点，不采取任何措施。后续这个地方可以由用户指定哪些节点应该被略去，todo
                        continue;
                    }
                    
                    const backgroundHasurl = analyseIfHadBackground(currentChildNode);
                    const hasDirectTextChild = childrenNodesHasText(currentChildNode);//判断当前元素是不是有直接的子元素并且此元素是Text
                    if ($this.customizeElement && $this.customizeElement(currentChildNode) !== 0 && $this.customizeElement(currentChildNode) !==  undefined) {
                        //开发者自定义节点需要渲染的样子，默认返回false表示使用正常递归的算法来处理。如果返回值是true表示不会在向下递归，如果返回值是一个对象那么表示开发需要自定义样式此时直接绘制就好。todo
                        if (getArgtype($this.customizeElement(currentChildNode)) === 'object') {
                            console.log('object');
                            //此处如果返回一个对象表示对象要自定义最后绘制的对象
                        } else if ($this.customizeElement(currentChildNode) === 1) {
                            //如果此时返回true，表示此节点要过滤
                            getRenderStyle(currentChildNode);
                        } else if ($this.customizeElement(currentChildNode) === 2){
                            continue ;
                        }
                        continue;
                    }
                    if (backgroundHasurl || analyseIsEmptyElement(currentChildNode) || hasDirectTextChild || shouldDrawCurrentNode(currentChildNode)) { //如果当前元素是内联元素或者当前元素非内联元素，但是不包含子节点或者子节点都是内联元素的话那么我们就在当前的骨架屏上绘制此节点。                    
                        getRenderStyle(currentChildNode, hasDirectTextChild);
                    } else if (currentChildNode.childNodes && currentChildNode.childNodes.length) { //如果当前节点包含子节点
                        //递归
                        childNodesStyleConcat(currentChildNode.childNodes);
                        //childHtmlStr = childHtmlStr + childNodesStyleConcat(getRenderStyle({}, currentChildNode, '0'), currentChildNode.childNodes);
                    }
                }
            }
            childNodesStyleConcat(nodes);
            return this.showBlocks();
        },
    };

    return new Promise((resolve, reject) => {
        if(!agrs.showInitiativeBtn){
            setTimeout(() => {
                try {
                    const html = new DrawPageframe({
                        customizeElement: agrs.customizeElement,
                    }).startDraw();
                    resolve(html);
                } catch (e) {
                    reject(e);
                }
            }, 3000);
        }else{
            try {
                const html = new DrawPageframe({
                    customizeElement: agrs.customizeElement,
                }).startDraw();
                resolve(html);
            } catch (e) {
                reject(e);
            }
        }
    });
}

// 待优化：
// 1. table
// 2. 文字

//核心方法是getComputedStyle