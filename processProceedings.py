import json
from bs4 import BeautifulSoup
from os import listdir
from os import path

visPagesDir = path.join(path.dirname(__file__),'visPages')
visPagesFiles = [f for f in listdir(visPagesDir) if path.isfile(path.join(visPagesDir, f))]

def getHTML(fp):
    with open(fp) as f:
        return f.read()

soups = {f:BeautifulSoup(getHTML(path.join(visPagesDir,f)), 'html.parser') for f in visPagesFiles}

paperHTML = [elem for elem in soups["papers.html"].find(id="node-3533").div]
paperHTML_hdr = [(i,elem.get_text()) for i,elem in enumerate(paperHTML) if "id" in unicode(elem) and "h2" in unicode(elem)]


def formatPublication(string):
    string = unicode(string.get_text())
    title, authors = [s.strip() for s in string.split('Authors:')]
    authors = [a.strip() for a in authors.split(',')]
    return {'title':title, 'authors':authors}


papersByConf = {}
for i, elem in enumerate(paperHTML_hdr):
    hdrLoc, hdr = elem
    if i != len(paperHTML_hdr) - 1:
        hdrLoc_next, hdr_next = paperHTML_hdr[i+1]
        papersByConf[hdr] = [formatPublication(p) for p in paperHTML[(hdrLoc+1):hdrLoc_next] if '<p>' in unicode(p)]
    else:
        papersByConf[hdr] = [formatPublication(p) for p in paperHTML[(hdrLoc+1):] if '<p>' in unicode(p)]

def flattenConfPapers(conf, paper):
    paper["conference"] = conf
    return paper
papers = [flattenConfPapers(conf,p) for conf,papers in papersByConf.iteritems() for p in papers]

with open(path.join(path.dirname(__file__),'data', 'papers.js'), 'w') as f:
    f.write('var visPapers = '+json.dumps(papers)+';')
