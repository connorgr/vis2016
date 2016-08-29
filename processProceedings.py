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
    authors = [a.replace('and','').strip() for a in authors.split(',')]
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

# reindex by author to paper index(es)
authors = {a:[] for a in set([a for p in papers for a in p["authors"]])}
firstAuthors = {a:[] for a in set([p["authors"][0] for p in papers])}
lastAuthors = {a:[] for a in set([p["authors"][-1] for p in papers])}
middleAuthors = {a: [] for a in set([a for p in papers for a in p["authors"][1:-1] if len(p["authors"]) > 2])}
for i,p in enumerate(papers):
    firstAuthors[p["authors"][0]].append({'index':i, 'conference': p['conference']})
    lastAuthors[p["authors"][-1]].append({'index':i, 'conference': p['conference']})
    for j,a in enumerate(p["authors"]):
        authors[a].append({'index':i, 'conference': p['conference']})
        if j > 0 and j < len(p["authors"]) - 1:
            middleAuthors[a].append({'index':i, 'conference': p['conference']})

src_visConfNames = 'var conferenceNames = [' + ','.join(['"'+p+'"' for p in papersByConf.keys()]) + '];'
src_visPapers = 'var visPapers = '+json.dumps(papers)+';'
src_visAuthors = 'var visAuthors = '+json.dumps(authors)+';'
src_visFirstAuthors = 'var visFirstAuthors = '+json.dumps(firstAuthors)+';'
src_visLastAuthors = 'var visLastAuthors = '+json.dumps(lastAuthors)+';'
src_visMiddleAuthors = 'var visMiddleAuthors = '+json.dumps(middleAuthors)+';'
srcs = [src_visConfNames,src_visPapers, src_visAuthors, src_visFirstAuthors, src_visLastAuthors,src_visMiddleAuthors]

with open(path.join(path.dirname(__file__),'data', 'papers.js'), 'w') as f:
    f.write('\n'.join(srcs));

def sortAuthorList(al):
    return [a for a in sorted(al.items(), key=lambda x: -len(x[1]))]
vis_all_authors = [
    ('vis_authors.json', sortAuthorList(authors)),
    ('vis_firstAuthors.json', sortAuthorList(firstAuthors)),
    ('vis_LastAuthors.json', sortAuthorList(lastAuthors)),
    ('vis_MiddleAuthors.json', sortAuthorList(middleAuthors))
]
for fname, data in vis_all_authors:
    with open(path.join(path.dirname(__file__), 'data', fname), 'w') as f:
        json.dump(data, f)
