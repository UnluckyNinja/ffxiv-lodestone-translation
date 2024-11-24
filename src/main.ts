import { createApp } from 'vue'
import './style.css'
import 'virtual:uno.css'
import App from './App.vue'
import { mutationHandler, rescanTextNodes, scanTextNodes } from './misc/scanner'

const app = createApp(App)
const element = document.createElement('div')
document.body.append(element)

app.mount(element)

var observer = new MutationObserver(mutationHandler);

observer.observe(document.body, {childList: true, subtree: true});

scanTextNodes(document.body)

// Limit the frequency of API requests
rescanTextNodes(observer);