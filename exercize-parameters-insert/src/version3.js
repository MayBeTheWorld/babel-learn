const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const types = require('@babel/types');
const template = require('@babel/template').default;

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;

const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: ['jsx']
});

// 前面是一样的
const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);
traverse(ast, {
    CallExpression(path, state) {
        // 创建新节点的时候会遍历一次新节点。利用创建时给 newNode 赋值的 isNew 属性跳过遍历
        if (path.node.isNew) {
            return;
        }
        const calleeName = path.get('callee').toString();
         if (targetCalleeName.includes(calleeName)) {
            const { line, column } = path.node.loc.start;
            const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)();
            newNode.isNew = true;
            // 用 findParent 的 api 顺着 path 查找是否有 JSXElement 节点，判断要替换的节点是否在 JSXElement 下
            if (path.findParent(path => path.isJSXElement())) {
                // 替换整体的 AST
                path.replaceWith(types.arrayExpression([newNode, path.node]))
                path.skip();
            } else {
                // 插入 AST
                path.insertBefore(newNode);
            }
        }
    }
});


const { code, map } = generate(ast);
console.log(code);