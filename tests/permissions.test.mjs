import test from 'node:test';import assert from 'node:assert/strict';import {OfflineSession} from '../src/offline/session.ts';
test('permission refresh preserves offline expiry and cannot recreate a signed-out session',async()=>{
 let raw=null,clock=1000;const session=new OfflineSession({now:()=>clock,store:{get:async()=>raw,set:async(k,v)=>{raw=v},remove:async()=>{raw=null}}});
 const user={id:1,idCede:3,permissions:{createPlanning:false}};await session.save(user);const expiry=JSON.parse(raw).expiresAt;clock+=60000;
 await session.updatePermissions(user,{createPlanning:true});assert.equal(JSON.parse(raw).expiresAt,expiry);assert.equal((await session.restore()).permissions.createPlanning,true);
 await Promise.all([session.updatePermissions(user,{createPlanning:false}),session.clear()]);assert.equal(raw,null);
 await session.updatePermissions(user,{createPlanning:true});assert.equal(raw,null);
 await session.save({id:2,idCede:4});await session.updatePermissions(user,{createPlanning:true});assert.equal(JSON.parse(raw).profile.id,2);assert.equal(JSON.parse(raw).profile.permissions,undefined);
});
