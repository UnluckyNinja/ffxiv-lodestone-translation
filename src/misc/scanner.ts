import { GM } from '$';
import { useOptions } from './store'
import _map from '../map.json'
const map = _map as [string, string][]
const gameTextMap = new Map(map as [string, string][])
const textHeadMap = Map.groupBy(map,(it)=>{
  return it[0].charAt(0)
})
textHeadMap.forEach(list=>{
  list.sort((a,b)=>{
    let compare = b[0].length - a[0].length
    if (compare === 0) {
      compare = b[0].localeCompare(a[0])
    }
    return compare
  })
})
// console.log(textHeadMap)

/** 
 * Credit: 片假名终结者 https://greasyfork.org/zh-CN/scripts/33268-katakana-terminator/ 
 */
var queue: Record<string, [HTMLElement, HTMLElement]> = reactive({});  // {"カタカナ": [rtNodeA, rtNodeB]}
var cachedTranslations: Record<string, string> = {};  // {"ターミネーター": "Terminator"}
var newNodes: Node[] = [document.body];

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
      return target.childNodes.forEach(scanTextNodes);

    case Node.TEXT_NODE:
      if (node.parentElement) {
        const ele = node.parentElement
        const matched = matchSelectors.value.some(selector=>{
          return ele.matches(selector)
        })
        if (!matched) return
      }
      let text : Text | boolean = node as Text
      while ((text = addRuby(text)));
  }
}
function escapeRegex(str: string) {
  return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function addRuby(node: Text) {
  if (!node.nodeValue) {
    return false;
  }
  const { customTranslations } = useOptions()
  let katakana = /[\u30A1-\u30FA\u30FD-\u30FF][\u3099\u309A\u30A1-\u30FF]*[\u3099\u309A\u30A1-\u30FA\u30FC-\u30FF]|[\uFF66-\uFF6F\uFF71-\uFF9D][\uFF65-\uFF9F]*[\uFF66-\uFF9F]/y;
  let match = null
  let lastIndex = 0
  while (!match && lastIndex < node.nodeValue.length) {
    if (textHeadMap.has(node.nodeValue.charAt(0))) {
      const list = textHeadMap.get(node.nodeValue.charAt(0))!
      for (const it of list) {
        const regex = new RegExp(escapeRegex(it[0]), 'y')
        regex.lastIndex = lastIndex
        match = regex.exec(node.nodeValue!)
        if (match) break
      }
    }
    if (!match){
      for (const [k] of Object.entries(customTranslations.value)) {
        const regex = new RegExp(escapeRegex(k), 'y')
        regex.lastIndex = lastIndex
        match = regex.exec(node.nodeValue!)
        if (match) break
      }
    }
    katakana.lastIndex = lastIndex
    match = match || katakana.exec(node.nodeValue)
    ++lastIndex;
  }
  if (!match) {
    return false
  }
  let ruby = document.createElement('ruby');
  ruby.appendChild(document.createTextNode(match[0]));
  let rt = document.createElement('rt');
  rt.classList.add('katakana-terminator-rt');
  ruby.appendChild(rt);

  // Append the ruby title node to the pending-translation queue
  queue[match[0]] = queue[match[0]] || [];
  queue[match[0]].push(rt);

  // <span>[startカナmiddleテストend]</span> =>
  // <span>start<ruby>カナ<rt data-rt="Kana"></rt></ruby>[middleテストend]</span>
  let after = node.splitText(match.index);
  node.parentNode!.insertBefore(ruby, after);
  after.nodeValue = after.nodeValue!.substring(match[0].length);
  return after;
}

// Split word list into chunks to limit the length of API requests
export function translateTextNodes() {
  var apiRequestCount = 0;
  var phraseCount = 0;
  var chunkSize = 200;
  var chunk = [];

  for (var phrase in queue) {
      phraseCount++;
      if (phrase in cachedTranslations) {
          updateRubyByCachedTranslations(phrase);
          continue;
      }

      chunk.push(phrase);
      if (chunk.length >= chunkSize) {
          apiRequestCount++;
          googleTranslate('ja', 'en', chunk);
          chunk = [];
      }
  }

  if (chunk.length) {
      apiRequestCount++;
      googleTranslate('ja', 'en', chunk);
  }

  if (phraseCount) {
      console.debug('Katakana Terminator:', phraseCount, 'phrases translated in', apiRequestCount, 'requests, frame', window.location.href);
  }
}
let lastRequestTime = 0
export async function translateTextNodesAlt() {
  let apiRequestCount = 0
  let phraseCount = 0
  const chunkLimit = 100
  const chunk: string[] = []

  const {enableGoogleTranslate} = useOptions()


  async function flushChunk() {
    if (chunk.length === 0) return
    if (Date.now() - lastRequestTime < 1000){
      await new Promise((r)=>setTimeout(r, 1000-(Date.now() - lastRequestTime)))
    }
    apiRequestCount++;
    await googleTranslate('ja', 'en', chunk.slice());
    chunk.splice(0);
  }

  for (let phrase in queue) {
    phraseCount++

    if (getTranslation(phrase)) {
      updateRubyByCachedTranslations(phrase)
    } else {
      if (!enableGoogleTranslate.value) continue
      chunk.push(phrase);
      if (chunk.length >= chunkLimit) {
        await flushChunk()
      }
    }
  }

  await flushChunk()

  if (phraseCount) {
    console.debug('Katakana Terminator:', phraseCount, 'phrases translated in', apiRequestCount, 'requests, frame', window.location.href);
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
      delete cachedTranslations[phrase]
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
              console.error('Katakana Terminator: invalid response', dom.responseText);
              return;
          }
          resp[0].forEach(function(item: string[]) {
              var translated = item[0].replace(/\s+$/, ''),
                  original   = item[1].replace(/\s+$/, '');
              cachedTranslations[original] = translated;
              updateRubyByCachedTranslations(original);
          });
      },
      onerror: function(dom) {
          console.error('Katakana Terminator: request error', dom.statusText);
      },
  });
}


export function getTranslation(phrase: string){
  const { customTranslations } = useOptions()
  
  return customTranslations.value[phrase] || gameTextMap.get(phrase) || cachedTranslations[phrase]
}

// Clear the pending-translation queue
export function updateRubyByCachedTranslations(phrase: string) {
  const translated = getTranslation(phrase)
  if (!translated) {
      return;
  }
  (queue[phrase] || []).forEach(function(node) {
      node.dataset.rt = translated
  });
  delete queue[phrase];
}

// Watch newly added DOM nodes, and save them for later use
export function mutationHandler(mutationList: MutationRecord[]) {
  mutationList.forEach(function(mutationRecord) {
      mutationRecord.addedNodes.forEach(function(node) {
        newNodes.push(node);
      });
  });
  return newNodes
}