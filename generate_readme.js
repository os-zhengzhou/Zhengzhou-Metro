const fs = require('fs');
const path = require('path');

const outputFile = 'README.md'

function main() {
  let mergedContent = '# 郑州地铁\n\n';
  let fileNames = []

  function readDirectory(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        readDirectory(filePath);
      } else if (stat.isFile() && path.extname(file) === '.md') {
        fileNames.push(path.relative(dir, filePath).replace(/\\/g, '/'))
      }
    });
  }

  // 线路信息
  mergedContent += "## 线路\n\n"
  readDirectory('./线路');
  if (fileNames && fileNames.length > 0) {
    mergedContent += fileNames.sort(customSort).map(line => `- [${line.replace('.md', '')}](/${line.replace('.md', '')}/${line})`).join('\n')
  }

  fileNames = []

  // 站点信息
  mergedContent += "\n\n"
  mergedContent += "## 站点\n\n"
  readDirectory('./站点');
  if (fileNames && fileNames.length > 0) {
    mergedContent += fileNames.sort(customSort).map(station => `- [${station.replace('.md', '')}](/${station.replace('.md', '')}/${station})`).join('\n')
  }

  fs.writeFileSync(outputFile, mergedContent, 'utf-8');
  console.log('Merged Markdown data saved to', outputFile);
}

// 自定义排序函数
const customSort = (a, b) => {
  if (a.indexOf('城郊线') >= 0) {
    a = a.replace('城郊线', '9号线')
  }
  if (b.indexOf('城郊线') >= 0) {
    b = b.replace('城郊线', '9号线')
  }

  const numA = parseInt(a.match(/\d+/));
  const numB = parseInt(b.match(/\d+/));

  // 如果a和b都包含数字，按数字排序
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  // 如果只有a包含数字，a排在前
  if (!isNaN(numA)) {
    return -1;
  }

  // 如果只有b包含数字，b排在前
  if (!isNaN(numB)) {
    return 1;
  }

  // 如果都不包含数字，按原顺序
  return 0;
}

module.exports = {
  generate: main
};
