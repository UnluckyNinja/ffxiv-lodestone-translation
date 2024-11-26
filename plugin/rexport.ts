import type { Plugin } from 'vite';
import { MagicString } from 'vue/compiler-sfc';

export default function createPlugin(): Plugin {
  return {
    name: 'vite-unocss:rexport:post',
    enforce: "post",
    apply(config, env) {
      return env.command === "serve" && !config.build?.ssr;
    },
    transform(code, id) {
      
      const layer = resolveLayer(getPath(id));
      if (layer) {
        let head = `const __vite__id = "/__uno.css";
const __vite__css = `;
        const s = new MagicString(code);
        s.replace('export default ', head)
        s.append(`
export default __vite__css
import.meta.hot.accept()`)
        return {
          code: s.toString(),
          map: s.generateMap()
        };
      }
    },
  }
}

function getPath(id: string) {
  return id.replace(/\?.*$/, "");
}

const LAYER_MARK_ALL = "__ALL__";
const RESOLVED_ID_RE = /[/\\]__uno(?:_(.*?))?\.css(?=(?:\?.*)?$)/;
function resolveLayer(id: string) {
  const match = id.match(RESOLVED_ID_RE);
  if (match)
    return match[1] || LAYER_MARK_ALL;
}