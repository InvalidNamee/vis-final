import {unzipSync} from 'fflate';
import type {CaseFile} from '../types';

const MAX_EXPANDED=8*1024*1024;
const isZip=(file:File)=>/\.zip$/i.test(file.name)||['application/zip','application/x-zip-compressed'].includes(file.type);
const isMetadata=(name:string)=>name.split('/').some(part=>part==='__MACOSX'||part==='.DS_Store'||part.startsWith('._'));

/** Expand ZIPs in memory, then use the existing text/binary reader for each resource. */
export async function readImportFiles(input:File[],readOne:(file:File)=>Promise<CaseFile>):Promise<CaseFile[]>{
  if(!input.some(isZip))return Promise.all(input.map(readOne));
  if(input.length!==1)throw Error('请单独选择一个 ZIP 案例包，或选择解压后的文件。');
  const bytes=new Uint8Array(await input[0].arrayBuffer());
  let total=0,tooLarge=false,entries:ReturnType<typeof unzipSync>;
  try{
    entries=unzipSync(bytes,{filter:entry=>{
      const name=entry.name.replace(/\\/g,'/');
      if(name.endsWith('/')||isMetadata(name))return false;
      total+=entry.originalSize;
      if(total>MAX_EXPANDED){tooLarge=true;throw Error('size');}
      return true;
    }});
  }catch{
    throw Error(tooLarge?'ZIP 解压后超过 8 MB，请精简资源后重试。':'无法读取 ZIP，请确认压缩包完整、未加密且格式正确。');
  }
  const seen=new Set<string>();
  const files=Object.entries(entries).map(([entry,data])=>{
    const name=entry.replace(/\\/g,'/').replace(/^(\.\/)+/,'');
    if(!name||name.startsWith('/')||/^[a-z]:/i.test(name)||name.split('/').includes('..'))throw Error('ZIP 中存在无效文件路径：'+entry);
    if(seen.has(name))throw Error('ZIP 中存在重复文件路径：'+name);
    seen.add(name);
    return new File([new Uint8Array(data).buffer],name);
  });
  if(!files.length)throw Error('ZIP 中没有可导入的案例文件。');
  return Promise.all(files.map(readOne));
}
