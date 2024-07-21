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

const parseEntryExistJson = (tokens) => {
  const exits = [];
  let currentExit = null;
  let currentSubSection = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'heading_open' && token.tag === 'h3') {
      if (tokens[i + 1] && tokens[i + 1].type === 'inline' && tokens[i + 1].content === '出入口') {
        i += 1; // Skip the inline token for '出入口'
      } else {
        // 找到三级标题，创建新出口对象
        if (currentExit) {
          exits.push(currentExit);
        }
        currentExit = { name: '', street: '', position: '', busList: [] };
        if (tokens[i + 1] && tokens[i + 1].type === 'inline') {
          currentExit.name = tokens[i + 1].content;
        }
        i += 1; // Skip the inline token for the exit name
      }
    } else if (token.type === 'heading_open' && token.tag === 'h4' && currentExit) {
      if (tokens[i + 1] && tokens[i + 1].type === 'inline') {
        currentSubSection = tokens[i + 1].content;
      }
      i += 1; // Skip the inline token for the subsection name
    } else if (token.type === 'paragraph_open' && currentExit) {
      if (tokens[i + 1] && tokens[i + 1].type === 'inline') {
        if (currentSubSection === '街道') {
          currentExit.street = tokens[i + 1].content;
        } else if (currentSubSection === '地标') {
          currentExit.position = tokens[i + 1].content;
        }
      }
      i += 2; // Skip the inline and paragraph_close tokens
    } else if (token.type === 'list_item_open' && currentExit && currentSubSection === '公交') {
      if (tokens[i + 2] && tokens[i + 2].type === 'inline') {
        currentExit.busList.push(tokens[i + 2].content);
      }
      i += 3; // Skip the list_item_open, paragraph_open, and inline tokens
    }
  }

  if (currentExit) {
    exits.push(currentExit);
  }

  return exits;
}

const parseMarkdownToJSON = (markdown) => {
  const tokens = md.parse(markdown, {});
  return {
    id: parseValue(tokens, 'h2', '标识'),
    name: parseName(tokens),
    lines: parseInlineList(tokens, 'h2', '换乘线路'),
    officialPhone: parseValue(tokens, 'h2', '公务电话'),
    accessibleElevator: parseValue(tokens, 'h2', '无障碍电梯'),
    nursingRoom: parseValue(tokens, 'h2', '母婴室'),
    restRoom: parseValue(tokens, 'h2', '卫生间'),
    aed: parseValue(tokens, 'h2', 'AED'),
    entryExist: parseEntryExistJson(tokens),
  }
}

// 递归函数来遍历目录和子目录中的所有文件
const traverseDirectory = (dir, jsonDir, jsonParentPath, stations) => {
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const filePath = path.join(dir, file);

    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      // 如果是目录，递归遍历该子目录
      traverseDirectory(filePath, jsonDir, jsonParentPath, stations);
    } else if (path.extname(file) === '.md') {
      // 如果是 .md 文件，读取文件内容
      const markdown = fs.readFileSync(filePath, 'utf8')
      const station = parseMarkdownToJSON(markdown)
      if (station.id) {
        const jsonFilePath = jsonParentPath + `/${station.id + '.json'}`;
        fs.writeFileSync(jsonDir + jsonFilePath, JSON.stringify(station), null, 2)
        stations.push({
          id: station.id,
          name: station.name,
          path: jsonFilePath
        })
        console.log(`Create new json file: ${jsonFilePath}`);
      }
    }
  });
}

const main = () => {
  // 指定要遍历的目录
  const directoryPath = path.join(__dirname, '站点');
  const stations = []

  const parentDir = path.dirname('jsons/stations/stations.json');
  fs.mkdirSync(parentDir, { recursive: true });

  traverseDirectory(directoryPath, 'jsons', '/stations', stations);
  fs.writeFileSync('jsons/stations/stations.json', JSON.stringify(stations), null, 2)
}

module.exports = {
  generate: main
};