import {beforeAll,describe,it,expect} from 'vitest';
import {tokenize,buildDocs,buildIndex,runSearch,mark,excerpt} from '../../src/composables/useSearch';
const manifests=import.meta.glob('../../plugins/**/case.json',{eager:true,import:'default'}) as Record<string,any>;
let ms:ReturnType<typeof buildIndex>,docs:ReturnType<typeof buildDocs>;
beforeAll(async()=>{
  await import('../../src/content/atlas.js');
  docs=buildDocs(window.ATLAS,Object.values(manifests));ms=buildIndex(docs);
});
describe('site search',()=>{
  it('tokenizes CJK runs into bigrams and keeps latin words',()=>{
    expect(tokenize('钻速预测',true)).toEqual(['钻速','速预','预测']);
    expect(tokenize('钻',true)).toEqual(['钻']);
    expect(tokenize('KNN 分类')).toEqual(['knn','分','类','分类']);
  });
  it('indexes every stage, scene, method and case package',()=>{
    const A:any=window.ATLAS,count=(k:string)=>docs.filter(d=>d.kind===k).length;
    expect(count('stage')).toBe(A.stages.length);expect(count('scene')).toBe(A.allScenes.length);
    expect(count('method')).toBe(Object.keys(A.methods).length);expect(count('case')).toBe(Object.keys(manifests).length);
  });
  it('ranks the matching scene title first',()=>{
    const hits=runSearch(ms,'钻速');
    expect(hits[0]).toMatchObject({kind:'scene',to:'/scene/d1'});
  });
  it('finds case packages by body text and links to the case',()=>{
    const hits=runSearch(ms,'微环隙');
    expect(hits.some(h=>h.kind==='case'&&h.to==='/scene/c1?case=cement-bond-knn')).toBe(true);
  });
  it('matches single characters, latin prefixes and returns nothing for blank input',()=>{
    expect(runSearch(ms,'钻').length).toBeGreaterThan(0);
    expect(runSearch(ms,'kn').some(h=>h.kind==='case')).toBe(true);
    expect(runSearch(ms,'knn')[0]).toMatchObject({kind:'case',id:'case:cement-bond-knn'});
    expect(runSearch(ms,'CV')[0]).toMatchObject({kind:'method',to:'/method/cv'});
    expect(runSearch(ms,'  ')).toEqual([]);
  });
  it('highlights matched terms in excerpts',()=>{
    const [hit]=runSearch(ms,'微环隙');
    expect(excerpt(hit)).toContain('微环');
    expect(mark('钻速预测',['钻速']).filter(p=>p.hit).map(p=>p.t)).toEqual(['钻速']);
  });
});
