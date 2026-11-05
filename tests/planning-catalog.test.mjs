import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emptyClassification,selectedClassification,mergeClassification,planningCycle,validatePlanningClassification} from '../src/data/planning-fields.ts';
const catalog=JSON.parse(readFileSync(new URL('../src/data/planning-catalog.json',import.meta.url),'utf8'));
test('official municipality snapshot contains unique complete municipality codes',()=>{
  assert.equal(new Set(catalog.municipios.map(row=>row.value)).size,catalog.municipios.length);
  assert.ok(catalog.municipios.length>5500);
  assert.equal(catalog.municipios.find(row=>row.value===4104808).label,'Cascavel — PR');
  assert.ok(catalog.municipios.some(row=>row.nome==='Cascavel'&&row.uf==='CE'));
});
test('legacy classification keeps its exact codes until all four new fields are selected',()=>{
  const legacy={idCidade:1,idCategoria:77,atividade:88,tipo:99};
  assert.deepEqual(selectedClassification(legacy,catalog),emptyClassification());
  assert.deepEqual(mergeClassification(legacy,emptyClassification(),catalog),{...legacy,catalogoVersao:null});
  assert.throws(()=>mergeClassification(legacy,{...emptyClassification(),idCidade:4104808},catalog),/quatro|município/);
  const adopted=mergeClassification(legacy,{idCidade:4104808,idCategoria:10001,atividade:2,tipo:1},catalog);
  assert.equal(adopted.catalogoVersao,catalog.version);
  assert.deepEqual(selectedClassification(adopted,catalog),{idCidade:4104808,idCategoria:10001,atividade:2,tipo:1});
});
test('cycle zero is retained, invalid references are rejected and unclassified legacy plans still work',()=>{
  assert.equal(planningCycle('0'),0);assert.equal(planningCycle(''),null);
  for(const value of [-1,100,1.5,'abc'])assert.throws(()=>planningCycle(value));
  const plan={idCidade:4104808,idCategoria:10002,atividade:6,tipo:2,ciclo:0,catalogoVersao:catalog.version};
  assert.doesNotThrow(()=>validatePlanningClassification(plan,catalog));
  assert.throws(()=>validatePlanningClassification({...plan,idCidade:1},catalog));
  assert.throws(()=>validatePlanningClassification({...plan,catalogoVersao:'unknown'},catalog));
  assert.doesNotThrow(()=>validatePlanningClassification({idCidade:1,idCategoria:77,atividade:88,tipo:99},catalog));
});
