import { GM } from '$';
import { getBuiltinTranslation, matchKatakanaOrTerm } from './gameText';
import { useOptions } from './store'

/** 
 * Credit: 片假名终结者 https://greasyfork.org/zh-CN/scripts/33268-katakana-terminator/ 
 */
const queue: Map<string, HTMLElement[]> = reactive(new Map());  // {"カタカナ": [rtNodeA, rtNodeB]}
var cachedTranslations: Map<string, string> = new Map();  // {"ターミネーター": "Terminator"}

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
      addRuby(text);
  }
}
// function escapeRegex(str: string) {
//   return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
// }

export function addRuby(node: Text) {
  if (!node.nodeValue) {
    return false;
  }
  const matches = matchKatakanaOrTerm(node.nodeValue)
  if (matches.length === 0) return false
  while (matches.length > 0) {
    // create ruby & rt element
    const match = matches.pop()!
    const matchedValue = node.nodeValue.slice(match.start, match.end)
    let ruby = document.createElement('ruby');
    ruby.appendChild(document.createTextNode(matchedValue));
    ruby.classList.add('userscript-translation-ruby');
    let rt = document.createElement('rt');
    rt.classList.add('userscript-translation-rt');
    ruby.appendChild(rt);

    // Append the ruby title node to the pending-translation queue
    const list = queue.get(matchedValue) ?? []
    list.push(rt)
    queue.set(matchedValue, list)

    // <span>[startカナmiddleテストend]</span> =>
    // <span>start<ruby>カナ<rt data-rt="Kana"></rt></ruby>[middleテストend]</span>
    let after = node.splitText(match.start);
    node.parentNode!.insertBefore(ruby, after);
    after.nodeValue = after.nodeValue!.substring(match.end - match.start);
  }
}

// Split word list into chunks to limit the length of API requests
let lastRequestTime = 0
export async function translateTextNodesAlt() {
  let apiRequestCount = 0
  let phraseCount = 0
  const chunkLimit = 50
  const chunk: string[] = []

  const {enableGoogleTranslate} = useOptions()


  async function flushChunk() {
    if (chunk.length === 0) return
    if (Date.now() - lastRequestTime < 2000){
      await new Promise((r)=>setTimeout(r, 2000-(Date.now() - lastRequestTime)))
    }
    apiRequestCount++;
    await googleTranslate('ja', 'en', chunk.slice());
    chunk.splice(0);
  }

  for (let phrase of queue.keys()) {

    if (getTranslation(phrase)) {
      updateRubyByCachedTranslations(phrase)
    } else {
      if (!enableGoogleTranslate.value) continue
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

// {"keyA": 1, "keyB": 2} => "?keyA=1&keyB=2"
export function buildQueryString(params: Record<string, string>) {
  return '?' + Object.keys(params).map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
}

// Google Dictionary API, https://github.com/ssut/py-googletrans/issues/268
export async function googleTranslate(srcLang: string, destLang: string, phrases: string[]) {
  // Prevent duplicate HTTP requests before the request completes
  phrases.forEach(function(phrase) {
      cachedTranslations.delete(phrase)
  });

  var joinedText = phrases.join('\n').replace(/\s+$/, ''),
      api = 'https://translate.googleapis.com/translate_a/single',
      params = {
          client: 'gtx',
          dt: 't',
          sl: srcLang,
          tl: destLang,
          q: joinedText,
      };

  return GM.xmlHttpRequest({
      method: "GET",
      url: api + buildQueryString(params),
      onload: function(dom) {
          try {
              var resp = JSON.parse(dom.responseText.replace("'", '\u2019'));
          } catch (err) {
              console.error('FF14 Lodestone 自动翻译: invalid response', dom.responseText);
              return;
          }
          resp[0].forEach(function(item: string[]) {
              var translated = item[0].replace(/\s+$/, ''),
                  original   = item[1].replace(/\s+$/, '');
              cachedTranslations.set(original, translated)
              updateRubyByCachedTranslations(original);
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
export function updateRubyByCachedTranslations(phrase: string) {
  const translated = getTranslation(phrase)
  if (!translated) {
      return;
  }
  queue.get(phrase)?.forEach((node)=>{
      node.dataset.rt = translated
  })
  queue.delete(phrase)
}

// Watch newly added DOM nodes, and save them for later use
export function mutationHandler(mutationList: MutationRecord[]) {
  mutationList.forEach(function(mutationRecord) {
      mutationRecord.addedNodes.forEach(function(node) {
        scanTextNodes(node);
      });
  });
}

export async function rescanTextNodes(observer: MutationObserver) {
    // Deplete buffered mutations
    mutationHandler(observer.takeRecords());

    await translateTextNodesAlt();
    setTimeout(()=>rescanTextNodes(observer), 500)
}