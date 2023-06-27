"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTagPlugin = void 0;
function customTagPlugin(md, options) {
    md.inline.ruler.before('text', options.name, (state, silent) => {
        const start = state.src.indexOf(`${options.startDelimiter}${options.name}:`, state.pos);
        if (start !== state.pos)
            return false;
        const contentStart = start + options.startDelimiter.length + options.name.length + 1;
        const contentEnd = state.src.indexOf(options.endDelimiter, contentStart);
        if (contentEnd === -1) {
            state.pos = state.posMax;
            return false;
        }
        if (!silent) {
            const token = state.push(options.name, '', 0);
            const rawContent = state.src.slice(contentStart, contentEnd);
            const contentArr = rawContent.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
            const contentObj = contentArr.reduce((acc, current) => {
                const keyValue = current.match(/(.*?)=(.*)/);
                if (keyValue) {
                    const [, key, value] = keyValue;
                    const match = value.match(/"([^"]*)"|'([^']*)'/);
                    if (match) {
                        acc[key] = match[1] || match[2];
                    }
                }
                return acc;
            }, {});
            token.attrs = Object.entries(contentObj);
            token.info = rawContent;
        }
        state.pos = contentEnd + options.endDelimiter.length;
        return true;
    });
    md.renderer.rules[options.name] = (tokens, idx) => {
        var _a;
        const attrs = (_a = tokens[idx].attrs) !== null && _a !== void 0 ? _a : [];
        const attrObj = attrs.reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
        return options.component(attrObj);
    };
}
exports.customTagPlugin = customTagPlugin;
//# sourceMappingURL=customTagPlugin.js.map