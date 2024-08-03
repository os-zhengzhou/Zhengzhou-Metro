const fs = require('fs');
const path = require('path');

// 配置
const directoryPath = './jsons'; // 你可以指定你的 JSON 文件所在的目录
const outputFilePath = './jsons/llm_data.txt';

// 递归遍历目录，找到所有的 JSON 文件
const getAllJsonFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (path.extname(file) === '.json') {
      fileList.push(filePath);
    }
  });
  return fileList;
};

// 合并 JSON 文件内容到一个 TXT 文件
const mergeJsonFiles = (files) => {
  let mergedContent = '';
  files.forEach((file, index) => {
    const content = fs.readFileSync(file, 'utf8');
    mergedContent += content;
    if (index < files.length - 1) {
      mergedContent += '\n\n'; // 添加空行分割
    }
  });

  fs.writeFileSync(outputFilePath, mergedContent, 'utf8');
  console.log('合并后的文件已生成');
};

// 主程序
module.exports = {
  generate: () => {
    const allJsonFiles = getAllJsonFiles(directoryPath);
    mergeJsonFiles(allJsonFiles);
  }
};