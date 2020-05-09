module.exports = function insertBtn(){
    let styles = [
        'position:fixed',
        'right:10%',
        'bottom:10%',
        'width:82px',
        'height:38px',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'border-radius:10px',
        'font-weight:bold',
        'color:white',
        'z-index:9999',
        'background-color: #007bff'
    ]
    
    setTimeout(()=>{
        let btnNode = document.createElement('div');
        btnNode.style.cssText = styles.join(';');
        btnNode.id = 'renderSkeleton';
        btnNode.innerText = '生成';
        btnNode.onclick = function(){
            window.renderSkeleton();
        }
        document.body.appendChild(btnNode);
        
    },500)
    
}