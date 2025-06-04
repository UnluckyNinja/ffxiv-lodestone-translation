import { GM } from '$';
import { useGameText } from './gameText';
import { useOptions } from './store'

/** 
 * Credit: 片假名终结者 https://greasyfork.org/zh-CN/scripts/33268-katakana-terminator/ 
 */
const katakanaQueue: Map<string, HTMLElement[]> = new Map();  // {"カタカナ": [rtNodeA, rtNodeB]}
const textQueue: Map<string, {replaceBack:(text:string)=>string, text: string, node:Text}[]> = new Map();
var cachedTranslations: Map<string, string> = new Map();  // {"ターミネーター": "Terminator"}

const TRANSLATED_CLASS = '__userscript_translated'

const {isLoading, getBuiltinTranslation, matchKatakanaOrTerm} = useGameText()

export function scanTextNodes(node: Node) {
  const { matchSelectors } = useOptions()
  // The node could have been detached from the DOM tree
  if (!node.parentNode || !document.body.contains(node)) {
    return;
  }

  // Ignore text boxes and echoes
  var excludeTags = { ruby: true, script: true, select: true, textarea: true };

  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      const target = node as HTMLElement
      if (target.tagName.toLowerCase() in excludeTags || target.isContentEditable) {
        return;
      }
      if (target.tagName.toLowerCase() === 'span' && target.classList.contains(TRANSLATED_CLASS)) {
        return
      }
      return [...target.childNodes.values()].forEach(scanTextNodes);

    case Node.TEXT_NODE:
      if (node.parentElement) {
        const ele = node.parentElement
        const matched = matchSelectors.value.some(selector=>{
          return ele.matches(selector)
        })
        if (!matched) return
      }
      let text : Text | boolean = node as Text
      transformNode(text);
  }
}
// function escapeRegex(str: string) {
//   return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
// }

export function transformNode(node: Text) {
  if (!node.nodeValue) {
    return false;
  }
  const {translateMode} = useOptions()
  const matches = matchKatakanaOrTerm(node.nodeValue)
  
  if (translateMode.value === 'full') {
    // split text by matches, replace it with {{0~n}}, after translated, replace it back
    const text = []
    const words: string[] = []
    let lastEnd = 0
    for (const match of matches) {
      if (match.type !== 'game') continue
      const {start, end} = match
      text.push(node.nodeValue.slice(lastEnd, start))
      text.push(`{${words.length}}`)
      words.push(node.nodeValue.slice(start, end))
      lastEnd = end
    }
    text.push(node.nodeValue.slice(lastEnd))
    const newText = text.join('')
    const list = textQueue.get(newText) ?? []
    list.push({
      node,
      text: newText,
      replaceBack(str){
        for (let i = 0; i < words.length; i++) {
          str = str.replace(`{${i}}`, getTranslation(words[i])??'{missing translation}')
        }
        return str
      }
    })
    textQueue.set(newText, list)
    if(node.nodeValue.includes('クロの賞状')) {
      // console.log('===text===')
      // console.log(text)
      // console.log('===words===')
      // console.log(words)
    }
  } else {
    if (matches.length === 0) return false
    while (matches.length > 0) {
      // create ruby & rt element
      const match = matches.pop()!
      const matchedValue = node.nodeValue.slice(match.start, match.end)
      const ruby = insertRuby(matchedValue)

      // <span>[startカナmiddleテストend]</span> =>
      // <span>start<ruby>カナ<rt data-rt="Kana"></rt></ruby>[middleテストend]</span>
      const after = node.splitText(match.start);
      node.parentNode!.insertBefore(ruby, after);
      after.nodeValue = after.nodeValue!.substring(match.end - match.start);
    }
  }
}

function insertRuby(matchedValue: string){
  const ruby = document.createElement('ruby');
  ruby.appendChild(document.createTextNode(matchedValue));
  ruby.classList.add('userscript-translation-ruby');
  const rt = document.createElement('rt');
  rt.classList.add('userscript-translation-rt');
  ruby.appendChild(rt);

  // Append the ruby title node to the pending-translation queue
  const list = katakanaQueue.get(matchedValue) ?? []
  list.push(rt)
  katakanaQueue.set(matchedValue, list)
  return ruby
}

// Split word list into chunks to limit the length of API requests
let lastRequestTime = 0
export async function translateTextNodesAlt() {
  let apiRequestCount = 0
  let phraseCount = 0
  const chunkLimit = 50
  const chunk: string[] = []
  
  const { enableGoogleTranslate, translateMode, katakanaLanguage } = useOptions()
  const targetLang = translateMode.value === 'full' ? 'zh-CN' : katakanaLanguage.value

  async function flushChunk() {
    if (chunk.length === 0) return
    if (Date.now() - lastRequestTime < 1000){
      await new Promise((r)=>setTimeout(r, 1000-(Date.now() - lastRequestTime)))
    }
    apiRequestCount++;
    await googleTranslate(translateMode.value, 'ja', targetLang, chunk.slice());
    lastRequestTime = Date.now()
    chunk.splice(0);
  }
  let targetQueue
  if (translateMode.value === 'full') {
    targetQueue = textQueue
  } else {
    targetQueue = katakanaQueue
  }

  for (let phrase of targetQueue.keys()) {

    if (getTranslation(phrase)) {
      updateRubyByCachedTranslations(translateMode.value, phrase)
    } else {
      if (translateMode.value !== 'full' && !enableGoogleTranslate.value) continue
      phraseCount++
      chunk.push(phrase);
      if (chunk.length >= chunkLimit) {
        await flushChunk()
      }
    }
  }

  await flushChunk()

  if (phraseCount) {
    console.debug('FF14 Lodestone 自动翻译:', phraseCount, 'phrases translated in', apiRequestCount, 'requests, frame', window.location.href);
  }
}

// Google Dictionary API, https://github.com/ssut/py-googletrans/issues/268
export async function googleTranslate(mode: string, srcLang: string, destLang: string, phrases: string[]) {
  // Prevent duplicate HTTP requests before the request completes
  phrases.forEach(function(phrase) {
      cachedTranslations.delete(phrase)
  });

  var api = 'https://translate.googleapis.com/translate_a/t',
      params = {
          client: 'gtx',
          dt: 't',
          sl: srcLang,
          tl: destLang,
          format: 'html',
      };
  const data = new URLSearchParams()
  phrases.forEach(it=>{
    data.append('q', it)
  })
  return GM.xmlHttpRequest({
      method: "POST",
      url: api + '?' + new URLSearchParams(params).toString(),
      data: data,
      onload: function(dom) {
          try {
              var resp = JSON.parse(dom.responseText/*.replace("'", '\u2019')*/) as string[];
          } catch (err) {
              console.error('FF14 Lodestone 自动翻译: invalid response', dom.responseText);
              return;
          }
          resp.forEach(function(item: string, idx: number) {
              var translated = item,
                  original   = phrases[idx];
              cachedTranslations.set(original, translated)
              updateRubyByCachedTranslations(mode, original);
          });
      },
      onerror: function(dom) {
          console.error('FF14 Lodestone 自动翻译: request error', dom.statusText);
      },
  });
}


export function getTranslation(phrase: string){

  return getBuiltinTranslation(phrase) || cachedTranslations.get(phrase)
}

// Clear the pending-translation queue
export function updateRubyByCachedTranslations(mode: string, phrase: string) {
  const translated = getTranslation(phrase)
  if (!translated) {
      return;
  }
  if (mode === 'full') {
    const list = textQueue.get(phrase)
    if(!list) return
    for (const item of list) {
      // create a new span with TRANSLATED_CLASS, call replaceBack and substitute the node
      const span = document.createElement('span')
      span.classList.add(TRANSLATED_CLASS)
      span.textContent = item.replaceBack(translated)
      span.dataset.originalText = item.node.nodeValue ?? ''
      if (import.meta.hot) {
        span.dataset.text = item.text
      }
      item.node.parentElement!.insertBefore(span, item.node.nextSibling)
      item.node.remove()
    }
    textQueue.delete(phrase)
  } else {
    katakanaQueue.get(phrase)?.forEach((node)=>{
        node.dataset.rt = translated
    })
    katakanaQueue.delete(phrase)
  }
}

// Watch newly added DOM nodes, and save them for later use
export function mutationHandler(mutationList: MutationRecord[]) {
  mutationList.forEach(function(mutationRecord) {
      mutationRecord.addedNodes.forEach(function(node) {
        scanTextNodes(node);
      });
  });
}

let isFirstRender = true

export async function rescanTextNodes(observer: MutationObserver) {
    if (isFirstRender) {
      await until(isLoading).toBe(false)
      console.info('FF14 Lodestone 自动翻译: 加载完毕')
      isFirstRender = false
      scanTextNodes(document.body)
    }
    // Deplete buffered mutations
    mutationHandler(observer.takeRecords());

    await translateTextNodesAlt();
    setTimeout(()=>rescanTextNodes(observer), 500)
}
