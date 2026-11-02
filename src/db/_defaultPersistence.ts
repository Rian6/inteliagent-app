import { currentEngine,scheduleSync,synchronize } from '../offline/runtime';
export async function persist(sql,params,table,sync=true){
  const engine=currentEngine();
  const id=await engine.transaction(transaction=>transaction.execute(sql,params,table));
  if(sync)scheduleSync();
  return id;
}
export const syncIfConnected=()=>synchronize();
export const consumer=full=>synchronize({full:!!full});
