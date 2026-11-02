import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Credentials, ACCESS_KEY, REFRESH_KEY } from '../src/offline/credentials.ts';
const token = expires => 'header.'+Buffer.from(JSON.stringify({exp:expires/1000})).toString('base64url')+'.signature';
const memory = () => {
  const values=new Map();
  return { values, get:async key=>values.get(key)||null, set:async(key,value)=>values.set(key,value), remove:async key=>values.delete(key) };
};
test('credentials survive a process restart and concurrent expired-token requests share one renewal', async () => {
  const store=memory(); let calls=0;
  const initial=new Credentials({store,now:()=>100000,renew:async()=>({})});
  await initial.save(token(90000),'secure-refresh');
  const restored=new Credentials({store,now:()=>100000,renew:async refresh=>{ assert.equal(refresh,'secure-refresh');calls++;await new Promise(resolve=>setTimeout(resolve,10));return {token:token(200000)}; }});
  assert.deepEqual(await Promise.all(Array.from({length:8},()=>restored.valid())),Array(8).fill(token(200000)));
  assert.equal(calls,1);
  assert.equal(await restored.valid(),token(200000));
  assert.equal(calls,1);
});
test('outages retain credentials; revoked refresh credentials leave the separate offline profile intact', async () => {
  const store=memory(); let status=503;
  const session=new Credentials({store,now:()=>100000,renew:async()=>{const error=new Error('failure');error.status=status;throw error;}});
  await session.save(token(90000),'refresh');store.values.set('offline-profile','saved work');
  await assert.rejects(session.valid());
  assert.equal(await store.get(REFRESH_KEY),'refresh');
  assert.equal(await store.get(ACCESS_KEY),token(90000));
  status=401;
  await assert.rejects(session.valid());
  assert.equal(await store.get(REFRESH_KEY),null);
  assert.equal(await store.get(ACCESS_KEY),null);
  assert.equal(await store.get('offline-profile'),'saved work');
});
test('a late refresh cannot resurrect a logged-out session or overwrite a new login', async () => {
  const store=memory();let release,started;
  const began=new Promise(resolve=>{started=resolve;});
  let applied=0;
  const session=new Credentials({store,now:()=>100000,onRenew:async()=>applied++,renew:()=>{started();return new Promise(resolve=>{release=resolve;});}});
  await session.save(token(90000),'old-refresh');
  const pending=session.valid();await began;
  await session.clear();
  await session.save(token(300000),'new-account-refresh');
  release({token:token(200000)});
  assert.equal(await pending,null);
  assert.equal(await session.get(),token(300000));
  assert.equal(applied,0);
  await session.invalidate(token(90000));
  assert.equal(await session.get(),token(300000));
});
test('a stale 401 reuses a newer valid access token without another renewal', async () => {
  const store=memory();let calls=0;
  const session=new Credentials({store,now:()=>100000,renew:async()=>{calls++;return {token:token(400000)};}});
  await session.save(token(300000),'refresh');
  assert.equal(await session.valid({force:true,rejected:token(90000)}),token(300000));
  assert.equal(calls,0);
});
