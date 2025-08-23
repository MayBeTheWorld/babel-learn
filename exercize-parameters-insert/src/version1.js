const parser = require('@babel/parser');
// 由于这些包都是通过 es module 导出，通过 commonjs 的方式引入有的时候要取 default 属性
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const types = require('@babel/types');

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
    // 根据代码是不是 es module 规范的，指定 sourceType 位 module 还是 script，设置为 unambiguous， babel会自动判断
    sourceType: 'unambiguous',
    // 使用了 jsx 语法
    plugins: ['jsx']
});

traverse(ast, {
    CallExpression(path, state) {
        // ast 的 callee（标识符） 中保存了类型，这里是 MemberExpression（对象属性访问的节点类型），这里主要针对了 console.xxx api
        if ( types.isMemberExpression(path.node.callee) 
            && path.node.callee.object.name === 'console' 
            && ['log', 'info', 'error', 'debug'].includes(path.node.callee.property.name) 
           ) {
            // 行列号从 AST 的公共属性 loc 上取
            const { line, column } = path.node.loc.start;
            // 在 arguments 中插入行列号的参数
            path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
        }
    }
});

const { code, map } = generate(ast);
console.log(code);
