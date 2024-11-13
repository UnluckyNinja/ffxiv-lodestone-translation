import { createApp } from 'vue'
import './style.css'
import 'virtual:uno.css'
import App from './App.vue'
import { mutationHandler, scanTextNodes, translateTextNodesAlt } from './scanner'

const app = createApp(App)
const element = document.createElement('div')
document.body.append(element)

app.mount(element)

var observer = new MutationObserver(mutationHandler);

observer.observe(document.body, {childList: true, subtree: true});

async function rescanTextNodes() {
    // Deplete buffered mutations
    const newNodes = mutationHandler(observer.takeRecords());
    if (!newNodes.length) {
        return;
    }

    console.debug('adhoc-translate:', newNodes.length, 'new nodes were added, frame', window.location.href);
    newNodes.forEach(scanTextNodes);
    newNodes.length = 0;
    await translateTextNodesAlt();
    setTimeout(rescanTextNodes, 500)
}

// Limit the frequency of API requests
rescanTextNodes();