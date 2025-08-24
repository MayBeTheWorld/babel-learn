const { declare } = require('@babel/helper-plugin-utils');
const importModule = require('@babel/helper-module-imports');

const autoTrackPlugin = declare((api, options, dirname) => {
    api.assertVersion(7);

    return {
        visitor: {
            Program: {
                // 模块引入
                enter (path, state) {
                    // 通过 path.traverse 来遍历 ImportDeclaration 
                    path.traverse({
                        ImportDeclaration (curPath) {
                            const requirePath = curPath.get('source').node.value;
                            if (requirePath === options.trackerPath) {  // 如果已经引入
                                const specifierPath = curPath.get('specifiers.0');
                                if (specifierPath.isImportSpecifier()) {
                                    // 记录 id 到 state
                                    state.trackerImportId = specifierPath.toString();
                                } else if(specifierPath.isImportNamespaceSpecifier()) { //default import 和 namespace import 取 id 的方式不一样，需要分别处理下。
                                    state.trackerImportId = specifierPath.get('local').toString(); // tracker 模块的 id 
                                }
                                path.stop();  // 找到了，终止后续遍历
                            }
                        }
                    });
                    if (!state.trackerImportId) {  
                        // 如果没有引入，就引入 tracker 模块
                        state.trackerImportId  = importModule.addDefault(path, 'tracker',{
                            // generateUid 生成唯一 id，然后放到 state
                            nameHint: path.scope.generateUid('tracker')
                        }).name; // tracker 模块的 id
                        state.trackerAST = api.template.statement(`${state.trackerImportId}()`)(); // 埋点代码的 AST
                    }
                }
            },

            // 函数插桩
            'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
                const bodyPath = path.get('body');
                if (bodyPath.isBlockStatement()) { // 有函数体就在开始插入埋点代码
                    bodyPath.node.body.unshift(state.trackerAST);
                } else { // 没有函数体要包裹一下，处理下返回值
                    const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({PREV_BODY: bodyPath.node});
                    bodyPath.replaceWith(ast);
                }
            }
        }
    }
});
module.exports = autoTrackPlugin;
