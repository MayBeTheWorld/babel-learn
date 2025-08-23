// const { declare } = require('@babel/helper-plugin-utils'); 此行无用

const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);

// babel 插件的形式就是函数返回一个对象，对象有 visitor 属性
// 函数的第一个参数可以拿到 types、template 等常用包的 api；二个参数 state 中可以拿到插件的配置信息 options 等
const parametersInsertPlugin = ({ types, template }, options, dirname) => {
    return {
        // 使用插件时，只需要提供一个具有功能的 visitor 函数，其余 parse、traverse、generate 等通用流程交给 babel
        visitor: {
            CallExpression(path, state) {
                if (path.node.isNew) {
                    return;
                }
                // 这里直接省略了 generate 改用 path
                const calleeName = path.get('callee').toString();
                 if (targetCalleeName.includes(calleeName)) {
                    const { line, column } = path.node.loc.start;
                    const newNode = template.expression(`console.log("${state.filename || 'unkown filename'}: (${line}, ${column})")`)();
                    newNode.isNew = true;

                    if (path.findParent(path => path.isJSXElement())) {
                        path.replaceWith(types.arrayExpression([newNode, path.node]))
                        path.skip();
                    } else {
                        path.insertBefore(newNode);
                    }
                }
            }
        }
    }
}
module.exports = parametersInsertPlugin;
