const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

const parseName = (tokens) => {
  let value
  tokens.forEach(token => {
    if (token.type === 'heading_open') {
      // 标题
      if (token.tag === 'h1') {
        value = tokens[tokens.indexOf(token) + 1].content.trim();
        return
      }
    }
  });
  return value
}

const parseValue = (tokens, tag, index) => {
  let value
  let match = false;
  for (let token of tokens) {
    if (token.type === 'heading_open') {
      // 标题
      if (token.tag === tag) {
        const content = tokens[tokens.indexOf(token) + 1].content.trim();
        if (content === index) {
          match = true
        }
      }
    } else if (match && token.type === 'paragraph_open') {
      value = tokens[tokens.indexOf(token) + 1].content.trim();
      break
    }
  }
  return value
}

const parseInlineList = (tokens, tag, index, parse) => {
  let value = []
  let match = false;
  for (let token of tokens) {
    if (token.type === 'heading_open') {
      // 标题
      if (token.tag === tag) {
        const content = tokens[tokens.indexOf(token) + 1].content.trim();
        if (content === index) {
          match = true
        }
      }
    } else if (match && token.type === 'list_item_open') {
      if (typeof parse === 'function') {
        value.push(parse(tokens[tokens.indexOf(token) + 2].content.trim()));
      } else {
        value.push(tokens[tokens.indexOf(token) + 2].content.trim());
      }
    } else if (match && token.type === 'bullet_list_close') {
      break
    }
  }
  return value
}


const parseRunTime = (input) => {
  const regex = /^(.*?):\s*(\d{2}:\d{2})~(\d{2}:\d{2})$/;
  const match = input.match(regex);

  if (match) {
    const direction = match[1].replace(/\*/g, '');
    return {
      direction,
      startTime: match[2],
      endTime: match[3]
    };
  }
  return {}
}


const parseMarkdownToJSON = (markdown) => {
  const tokens = md.parse(markdown, {});

  const stationList = parseInlineList(tokens, 'h2', '站点列表')

  return {
    id: parseValue(tokens, 'h2', '标识'),
    name: parseName(tokens),
    color: parseValue(tokens, 'h2', '标志色'),
    openingDate: parseValue(tokens, 'h2', '开通日期'),
    length: parseValue(tokens, 'h2', '线路长度'),
    trainComposition: parseValue(tokens, 'h2', '列车编组'),
    topSpeed: parseValue(tokens, 'h2', '最高时速'),
    startingFare: parseValue(tokens, 'h2', '起步票价'),
    stationCount: stationList.length,
    stationList,
    runTime: parseInlineList(tokens, 'h2', '运行时间', parseRunTime),
  }
}

// 递归函数来遍历目录和子目录中的所有文件
const traverseDirectory = (lines, dir, jsonDir, jsonParentPath) => {
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const filePath = path.join(dir, file);

    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      // 如果是目录，递归遍历该子目录
      traverseDirectory(lines, filePath, jsonDir, jsonParentPath);
    } else if (path.extname(file) === '.md') {
      // 如果是 .md 文件，读取文件内容
      const markdown = fs.readFileSync(filePath, 'utf8')
      const line = parseMarkdownToJSON(markdown)
      const jsonFilePath = jsonParentPath + `/${line.id + '.json'}`;
      fs.writeFileSync(jsonDir + jsonFilePath, JSON.stringify(line), null, 2)
      lines.push({
        id: line.id,
        name: line.name,
        path: jsonFilePath
      })
      console.log(`Create new json file: ${jsonFilePath}`);
    }
  });
}

const main = () => {
  // 指定要遍历的目录
  const directoryPath = path.join(__dirname, '线路');
  const lines = []

  const parentDir = path.dirname('jsons/lines/lines.json');
  fs.mkdirSync(parentDir, { recursive: true });

  traverseDirectory(lines, directoryPath, 'jsons', '/lines');
  fs.writeFileSync('jsons/lines/lines.json', JSON.stringify(lines), null, 2)
}

module.exports = {
  generate: main
};