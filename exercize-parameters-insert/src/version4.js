const { transformFileSync } = require('@babel/core');
const  parser = require('@babel/parser');
const insertParametersPlugin = require('./plugin/parameters-insert-plugin');
const fs = require('fs');
const path = require('path');

// 改造成插件，利用 @babel/core 的 api 代替 traverse 
const { code } = transformFileSync(path.join(__dirname, './sourceCode.js'), {
    plugins: [insertParametersPlugin],
    parserOpts: {
        sourceType: 'unambiguous',
        plugins: ['jsx']       
    }
});

console.log(code);
