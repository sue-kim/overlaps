export function layoutIntervals(items:{id:string;start:number;end:number}[]) {
  const result=new Map<string,{column:number;columns:number}>();
  let group:{id:string;column:number}[]=[],ends:number[]=[],groupEnd=-Infinity;
  const finish=()=>{for(const item of group)result.set(item.id,{column:item.column,columns:ends.length});group=[];ends=[];};
  for(const item of [...items].sort((a,b)=>a.start-b.start||b.end-a.end)) {
    if(item.start>=groupEnd){finish();groupEnd=-Infinity;}
    let column=ends.findIndex(end=>end<=item.start);
    if(column===-1)column=ends.length;
    ends[column]=item.end;group.push({id:item.id,column});groupEnd=Math.max(groupEnd,item.end);
  }
  finish();return result;
}
