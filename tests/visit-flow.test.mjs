import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visitPageErrors,accessibleVisitPage,resumedPage,visitStages,nextVisitPage} from '../src/data/visit-flow.ts';
import {newVisit} from '../src/offline/visits.ts';
import store from '../src/context/visitaContext.ts';
const open=patch=>newVisit({nome:'Rua do Campo',numero:'s/n',situacaoVisita:3,tipoImovel:'Residencial',boletim:{quarteirao:'12',ladoQuarteirao:'2',agenteNome:'Agente Teste'},...patch});
test('a direct future-stage link stops at the first unconfirmed prerequisite',()=>{
 const visit=open();assert.equal(accessibleVisitPage('revisao',visit),'index');
 visit.__completed=['index'];assert.equal(accessibleVisitPage('revisao',visit),'inspecao');
 visit.__inspectionAnswered=true;visit.__completed.push('inspecao');assert.equal(accessibleVisitPage('tratamento',visit),'amostra');
 visit.__sampleAnswered=true;visit.__completed.push('amostra');assert.equal(accessibleVisitPage('revisao',visit),'tratamento');
 visit.__treatmentAnswered=true;visit.__completed.push('tratamento');assert.equal(accessibleVisitPage('revisao',visit),'revisao');
});
test('invalid values prevent advancement even when a draft marks a stage complete',()=>{
 const visit=open({__completed:['index','inspecao','amostra','tratamento'],__inspectionAnswered:true,__sampleAnswered:true,__treatmentAnswered:true});
 assert.equal(accessibleVisitPage('revisao',visit),'revisao');
 visit.numeroQuartos='-1';assert.equal(accessibleVisitPage('revisao',visit),'index');
 visit.numeroQuartos=0;visit.itensInspecionados=[1];visit.depositosInspecionados={1:'1.5'};assert.equal(accessibleVisitPage('revisao',visit),'inspecao');
});
test('closed and refused properties require the property stage and retain the two-stage flow',()=>{
 for(const situacaoVisita of [1,2]){const visit=open({situacaoVisita});assert.equal(accessibleVisitPage('revisao',visit),'index');visit.__completed=['index'];assert.equal(accessibleVisitPage('revisao',visit),'revisao');assert.equal(nextVisitPage('index',situacaoVisita),'revisao');}
});
test('sample interval and integer errors appear before the review stage',()=>{
 const visit=open({contemAmostra:true,amostra:{numeroInicio:12,numeroFinal:10,quantidade:'-2'}});
 const errors=visitPageErrors('amostra',visit);assert.ok(errors['amostra.numeroFinal']);assert.ok(errors['amostra.quantidade']);
 visit.amostra.numeroFinal=12;visit.amostra.quantidade=0;assert.deepEqual(visitPageErrors('amostra',visit),{});
});
test('enabled treatment modes require their product and valid quantities without changing legacy modes',()=>{
 const visit=open({contemTratamento:true,tratamento:{focal:{ativo:true,tipo:'',quantidadeCarga:'abc',quantidadeTratamento:2}}});
 const errors=visitPageErrors('tratamento',visit);assert.ok(errors['tratamento.focal.tipo']);assert.ok(errors['tratamento.focal.quantidadeCarga']);
 const legacy=open({contemTratamento:true,tratamento:{tipo:'Produto legado',quantidadeCarga:2,quantidadeTratamento:3}});
 assert.ok(visitPageErrors('tratamento',legacy)['boletim.focalGramas']);
 assert.deepEqual(visitPageErrors('tratamento',{...legacy,boletim:{...legacy.boletim,focalGramas:'2'}}),{});
});
test('editing prior data invalidates later confirmations but keeps all clinical data',()=>{
 const visit=open({__completed:['index','inspecao','amostra','tratamento'],contemAmostra:true,amostra:{numeroInicio:10,numeroFinal:12,quantidade:3}});store.getState().initializeVisita(visit);
 store.getState().updateVisita({nome:'Rua Corrigida'});const updated=store.getState().visita;assert.deepEqual(updated.__completed,[]);assert.equal(updated.amostra.quantidade,3);assert.equal(accessibleVisitPage('revisao',updated),'index');
});
test('changing a sample invalidates only its confirmation and later stages',()=>{
 store.getState().initializeVisita(open({__completed:['index','inspecao','amostra','tratamento']}));
 store.getState().updateVisita({amostra:{numeroInicio:1,numeroFinal:3,quantidade:3}});assert.deepEqual(store.getState().visita.__completed,['index','inspecao']);
});
test('resume returns to the valid frontier and optional blanks stay optional',()=>{
 assert.equal(resumedPage(open({__page:'revisao'})),'index');
 assert.deepEqual(visitPageErrors('index',open({cep:'',numero:'',numeroQuartos:0})),{});
 assert.ok(visitPageErrors('index',open({cep:'123'})).cep);
 const visit=open({__page:'amostra',__completed:['index','inspecao'],__inspectionAnswered:true});assert.equal(resumedPage(visit),'amostra');
});
