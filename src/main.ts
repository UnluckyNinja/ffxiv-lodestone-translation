import { createApp } from 'vue'
import './body.css'
import styleCss from './style.css?inline'
import unoCss from 'virtual:uno.css?inline'
import resetCss from '@unocss/reset/tailwind.css?inline'
import App from './App.vue'
import { mutationHandler, rescanTextNodes, scanTextNodes } from './misc/scanner'

const app = createApp(App)
const wrapper = document.createElement('div')
document.body.append(wrapper)
const shadow = wrapper.attachShadow({mode: 'open'})
const element = document.createElement('div')
shadow.appendChild(element)

app.mount(element)

function addStyle(content: string){
  const cssEle = document.createElement('style')
  cssEle.textContent = content
  shadow.appendChild(cssEle)
  return cssEle
}
const resetEle = addStyle(resetCss)
const unoEle = addStyle(unoCss)
const styleEle = addStyle(styleCss)

var observer = new MutationObserver(mutationHandler);

observer.observe(document.body, {childList: true, subtree: true});

scanTextNodes(document.body)

// Limit the frequency of API requests
rescanTextNodes(observer);

if (import.meta.hot) {
  import.meta.hot.accept([
    './style.css?inline', 
    '/__uno.css?inline',
  ],([styleCss, unoCss])=>{
    if (styleCss) {
      styleEle.textContent = styleCss.default
    }
    if (unoCss) {
      unoEle.textContent = unoCss.default
    }
  })
}
