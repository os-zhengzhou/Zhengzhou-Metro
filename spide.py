from bs4 import BeautifulSoup
import re
import json
import requests

def get_url_content(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # 如果返回的状态码不是200，产生一个HTTPError
        return response.text
    except requests.RequestException as e:
        print(f"请求失败: {e}")
        return None

def json_to_markdown(json_data):
    markdown = f"# {json_data['地铁站']}\n\n"
    markdown += "## 公务电话\n\n"
    markdown += f"{json_data['公务电话']}\n\n"
    markdown += "## 无障碍电梯\n\n"
    markdown += f"{json_data['无障碍电梯']}\n\n"
    markdown += "## 卫生间\n\n"
    markdown += f"{json_data['卫生间']}\n\n"
    markdown += "## 母婴室\n\n"
    markdown += f"{json_data['母婴室']}\n\n"
    markdown += "## AED\n\n"
    markdown += f"{json_data['AED']}\n\n"
    markdown += "## 出入口\n\n"
    
    for entrance in json_data['出入口信息']:
        for key, value in entrance.items():
            markdown += f"### {key}口\n\n"
            markdown += "#### 街道\n\n"
            markdown += f"{value['街道']}\n\n"
            markdown += "#### 地标\n\n"
            markdown += f"{value['地标']}\n\n"
            if value['公交']:
                markdown += "#### 公交\n\n"
                for bus in value['公交']:
                    print(bus)
                    markdown += f"- {bus}\n"
                markdown += "\n"
    
    return markdown

def get_json(url):
    # 从文件中读取 HTML 内容
    with open('source.html', 'r', encoding='utf-8') as file:
        html_content = file.read()
    # html_content = get_url_content(url)

    # 创建 BeautifulSoup 对象
    soup = BeautifulSoup(html_content, 'html.parser')

    station = {}

    site = soup.select('.Line_Site_infor > h1')
    station['地铁站'] = site[0].text

    # 提取信息
    aed = None
    entryExist = []

    for li in soup.select('.Line_ck > li'):
        category = li.find('span').text.strip()
        pList = li.find_all('p')
        oneEntryExistDetail = {}
        end = False
        for p in pList:
            pValue = p.text.strip()
            ps = re.split(r'[:：]+', pValue)
            if len(ps) > 1:
                if ps[0] == '街道':
                    oneEntryExistDetail['街道'] = ps[1]
                if ps[0] == '地标':
                    oneEntryExistDetail['地标'] = ps[1]
                if ps[0] == '公交':
                    oneEntryExistDetail['公交'] = [element for element in ps[1].split(r'[、，]') if element != "无"]
                if category == '母婴室':
                    station['母婴室'] = ps[1]
                    end = True
                if category == 'AED':
                    station['AED'] = ps[1]
                    end = True
                if category == '卫生间':
                    station['卫生间'] = ps[1]
                    end = True
                if category == '无障碍电梯':
                    station['无障碍电梯'] = ps[1]
                    end = True
            else:
                if category == '公务电话':
                    station['公务电话'] = ps[0]
                    end = True
        if end:
            continue
        if bool(re.match(r'^[A-Z][0-9]?$|^[A-Z]$', category)):
            entryExistDetail = {
                category: oneEntryExistDetail
            }
        entryExist.append(entryExistDetail)

    station['出入口信息'] = entryExist
    return station


json_data = get_json('https://www.zzmetro.com/lines/query/station/zid/10122#station')
# 生成 Markdown
markdown = json_to_markdown(json_data)
print(markdown)

# # 从文件中读取 HTML 内容
# with open('source.html', 'r', encoding='utf-8') as file:
#     html_content = file.read()

# # 创建 BeautifulSoup 对象
# soup = BeautifulSoup(html_content, 'html.parser')

# # 获取链接地址
# links = soup.find_all('a')
# # 提取并打印所有链接
# for link in links:
#     href = link.get('href')
#     if href and href.startswith('/lines/query/station/zid'):
#         print("链接地址:", href)
