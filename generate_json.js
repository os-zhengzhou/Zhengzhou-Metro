const fs = require('fs');
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


function parseMarkdownToJSON(markdown) {
  const tokens = md.parse(markdown, {});

  const stationList = parseInlineList(tokens, 'h2', '站点列表')

  return {
    name: parseName(tokens),
    color: parseValue(tokens, 'h2', '颜色'),
    stationCount: stationList.length,
    stationList,
    runTime: parseInlineList(tokens, 'h2', '运行时间', parseRunTime),
  }
}

const markdownFile = './线路/3号线/3号线.md';
const markdown = fs.readFileSync(markdownFile, 'utf8');

const jsonResult = parseMarkdownToJSON(markdown);
console.log(JSON.stringify(jsonResult, null, 2));

fs.writeFileSync('jsons/3号线.json', JSON.stringify(jsonResult, null, 2))