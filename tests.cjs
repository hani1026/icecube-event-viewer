// Run with Node.js: node tests.cjs. No packages or browser are required.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
new vm.Script(js);
const context = vm.createContext({
  document: {documentElement: {dataset: {}}},
  window: {matchMedia: () => ({matches: false})}, assert,
});
vm.runInContext(js.split('/* ------------------------------------------------------------ scene */')[0] + `
const fmtE = E => E.toFixed(3) + ' GeV', fmtN = n => Math.round(n).toString();
function run(type, E, seed = 1, options = {}) {
  Object.assign(state, {type, E, seed, zen:60, noise:false, vtx:'infill',
    det:{IceCube:true, DeepCore:true, Upgrade:true}}, options);
  return simulate();
}
`, context);
const run = code => vm.runInContext(code, context);
const approx = (a,b,tol=1e-9) => assert.ok(Math.abs(a-b)<=tol, `${a} != ${b}`);
let checks = 0;
function check(label,fn) { fn(); checks++; console.log('PASS',label); }
check('JavaScript parses and detector counts match',()=>{
  assert.equal(run('sensors.length'),5854);
  assert.equal(run('JSON.stringify(SUB_COUNT)'),'{"IceCube":4680,"DeepCore":480,"Upgrade":694}');
});
check('same seed and settings reproduce the complete event',()=>{
  assert.equal(run("JSON.stringify(run('nuecc',100))"),run("JSON.stringify(run('nuecc',100))"));
});
check('electron uses physical path, position and flight time',()=>{
  const e=run("run('nuecc',100)");
  const p=e.particles[1], c=e.cascades[1];
  const expected=0.39*(Math.log(c.E/0.08)+4);
  approx(p.length,expected);
  approx(Math.hypot(c.pos.x-p.start.x,c.pos.y-p.start.y,c.pos.z-p.start.z),expected);
  approx(c.t0,expected/0.29979);
  assert.ok(p.length<6);
});
check('tau CC below threshold has no interaction or signal; NC remains available',()=>{
  for(const E of [1,3,run('TAU_THRESHOLD')-1e-8]) {
    const e=run(`run('nutaucc',${E})`);
    assert.ok(e.forbidden);assert.equal(e.vertex,null);
    assert.equal(e.cascades.length,0);assert.equal(e.tracks.length,0);assert.equal(e.hits.length,0);
    assert.ok(e.warn.includes('CC needs at least'));
  }
  const noise=run("run('nutaucc',1,1,{noise:true})");
  assert.ok(noise.hits.length>0);assert.ok(noise.hits.every(h=>h.noise));
  const nc=run("run('nutaunc',1)");assert.equal(nc.cascades.length,1);assert.ok(!nc.forbidden);
});
check('tau kinematic envelope conserves energy and allows an on-shell recoil',()=>{
  run(`for (const E of [TAU_THRESHOLD,TAU_THRESHOLD+1e-7,3.6,4,10,100,1000]) {
    for (const y of [0.05,0.3,0.5,0.95]) {
      const k=tauKinematics(E,y,scatterAngle(E,y));
      assert.ok(k.energy>=M_TAU && k.energy<=E);
      assert.ok(k.speed>0 && k.speed<C);
      const recoilE=M_N+E-k.energy;
      const recoilMass2=recoilE*recoilE-(E*E+k.momentum*k.momentum-2*E*k.momentum*Math.cos(k.angle));
      assert.ok(recoilMass2>=M_N*M_N-1e-6, 'recoil mass below target mass');
      assert.ok(Number.isFinite(k.angle));
    }
  }`);
});
check('all tau decay modes use physical displacement and flight time',()=>{
  const modes=new Set();
  for(let seed=1;seed<=100;seed++){
    const e=run(`run('nutaucc',1000,${seed})`),p=e.particles[1];
    const energy=1000-e.cascades[0].E;
    const momentum=Math.sqrt(energy*energy-1.77686**2);
    approx(p.length,4.9e-5*momentum);assert.ok(p.length<0.05);
    approx(p.speed,0.29979*momentum/energy);
    const mode=e.text.includes('τ → μ')?'mu':e.text.includes('τ → e')?'e':'had';modes.add(mode);
    const t=p.length/p.speed;
    if(mode==='had'){
      const c=e.cascades[1];approx(c.t0,t);
      approx(Math.hypot(c.pos.x-p.start.x,c.pos.y-p.start.y,c.pos.z-p.start.z),p.length);
    }else{
      const daughter=e.particles[2];approx(daughter.t0,t);
      approx(Math.hypot(daughter.start.x-p.start.x,daughter.start.y-p.start.y,daughter.start.z-p.start.z),p.length);
      if(mode==='e'){assert.ok(daughter.length<6);approx(e.cascades[1].t0,t+daughter.length/0.29979);}
    }
  }
  assert.equal(modes.size,3);
});
check('finite-track endpoints and direct-cone emission stay within the track',()=>{
  run(`{
    const tr={start:v(0,0,0),dir:v(1,0,0),length:20,E:10,t0:0};
    for(const [x,y,direct,endpoint] of [[5,20,false,0],[25,1,false,20],[5,1,true,null],[25,10,true,null]]){
      const l=trackLight(tr,{x,y,z:0,a:1});
      assert.equal(l.direct,direct);
      assert.ok(l.emission>=0&&l.emission<=tr.length);
      assert.ok(Number.isFinite(l.time)&&l.time>=l.emission/C);
      if(endpoint!==null) assert.equal(l.emission,endpoint);
    }
    const sn={x:-10,y:10,z:0,a:1};
    const short=trackLight({...tr,length:1},sn),long=trackLight({...tr,length:10},sn);
    assert.ok(Math.abs(long.mu/short.mu-10)<1e-10);
    assert.equal(trackLight({...tr,length:0},sn).mu,0);
  }`);
});
check('640 settings including empty detector masks have finite sorted hits and timelines',()=>{
  run(`for(const type of ['nuecc','nuenc','numucc','numunc','nutaucc','nutaunc','atmmu','noise'])
    for(const E of [1,10,100,1000]) for(const zen of [0,60,90,91,180])
    for(const noise of [false,true]) for(const enabled of [false,true]) {
      const e=run(type,E,1,{zen,noise,det:{IceCube:enabled,DeepCore:enabled,Upgrade:enabled}});
      assert.ok(Number.isFinite(e.t0)&&Number.isFinite(e.t1)&&e.t1>e.t0);
      if(!enabled)assert.equal(e.hits.length,0);
      e.hits.forEach((h,i)=>{
        assert.ok(Number.isFinite(h.t)&&Number.isFinite(h.q)&&h.q>0);
        assert.ok(h.t>=e.t0&&h.t<=e.t1);
        if(i)assert.ok(h.t>=e.hits[i-1].t);
      });
      e.particles.forEach(p=>assert.ok(Number.isFinite(p.length)&&p.length>=0));
    }`);
});
// Lifecycle unit check; this does not measure an actual WebGL driver's memory.
vm.runInContext(js.slice(js.indexOf('function clearOwnedGroup('),js.indexOf('function buildActors(')),context);
check('cleanup disposes owned resources once and preserves shared sprite geometry',()=>{
  run(`{
    const make=()=>({calls:0,dispose(){this.calls++;}});
    const geometry=make(),spriteGeometry=make(),texture=make(),material=make();material.map=texture;
    const nodes=[{geometry,material},{geometry,material:[material]},{geometry:spriteGeometry,material,isSprite:true}];
    const children=nodes.map(n=>({traverse(fn){fn(n);}}));
    const group={children,remove(child){this.children.splice(this.children.indexOf(child),1);}};
    clearOwnedGroup(group);clearOwnedGroup(group);
    assert.equal(group.children.length,0);
    assert.equal(geometry.calls,1);assert.equal(material.calls,1);assert.equal(texture.calls,1);
    assert.equal(spriteGeometry.calls,0);
  }`);
});
check('no path exaggeration remains and both rebuild sites clean up resources',()=>{
  assert.ok(!/E_SCALE|TAU_SCALE|drawn ×/.test(js));
  assert.ok(js.includes('clearOwnedGroup(anim);'));
  assert.ok(js.includes('clearOwnedGroup(staticLabels);'));
});
check('dust path integrates partial, crossing, horizontal and reversed rays',()=>{
  run(`{
    const top=DUST_Z_TOP,bottom=DUST_Z_BOTTOM,mid=(top+bottom)/2;
    const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
    near(dustPathLength(v(0,0,top+20),v(0,0,bottom-20)),100);
    near(dustPathLength(v(0,0,mid),v(0,0,top+50)),50);
    near(dustPathLength(v(0,0,mid),v(50,0,mid)),50);
    near(dustPathLength(v(0,0,top+1),v(50,0,top+1)),0);
    near(dustPathLength(v(0,0,mid),v(0,0,mid)),0);
    const a=v(0,0,top+20),b=v(140,0,bottom-20);
    near(dustPathLength(a,b),100*Math.sqrt(2));near(dustPathLength(a,b),dustPathLength(b,a));
  }`);
});
check('dust reduces expected light according to crossed distance, not sensor identity',()=>{
  run(`{
    const mid=(DUST_Z_TOP+DUST_Z_BOTTOM)/2, pos=v(0,0,mid),sn={x:50,y:0,z:mid,a:1};
    state.dust=false;const clear=cascadeLight(pos,100,0,sn);
    state.dust=true;const dusty=cascadeLight(pos,100,0,sn);
    assert.ok(Math.abs(dusty.mu/clear.mu-Math.exp(-50*(1/DUST_LAM-1/LAM)))<1e-12);
    assert.equal(clear.time,dusty.time);
    // Both endpoints outside the band still experience attenuation when crossing it.
    assert.ok(dustTransmission(v(0,0,DUST_Z_TOP+20),v(0,0,DUST_Z_BOTTOM-20))<0.08);
    assert.equal(dustTransmission(v(0,0,100),v(0,0,200)),1);
    const tr={start:v(0,0,mid),dir:v(1,0,0),length:100,E:100,t0:0};
    for(const sn of [{x:50,y:10,z:mid,a:1},{x:-10,y:10,z:mid,a:1}]) {
      state.dust=false;const clear=trackLight(tr,sn);
      state.dust=true;const dusty=trackLight(tr,sn);
      assert.ok(dusty.mu<clear.mu);assert.equal(dusty.time,clear.time);
    }
  }`);
});
check('dust switch preserves event truth and does not attenuate dark noise',()=>{
  run(`{
    state.dust=true;const dusty=run('numucc',1000,17);
    state.dust=false;const clear=run('numucc',1000,17);
    for(const field of ['particles','cascades','tracks','vertex'])assert.equal(JSON.stringify(dusty[field]),JSON.stringify(clear[field]));
    state.dust=true;const noiseOn=run('noise',100,1);
    state.dust=false;const noiseOff=run('noise',100,1);
    assert.equal(JSON.stringify(noiseOn.hits),JSON.stringify(noiseOff.hits));
    state.dust=true;
  }`);
});
check('dust suppresses a source in the layer across the real sensor array',()=>{
  run(`{
    const pos=v(45,-40,(DUST_Z_TOP+DUST_Z_BOTTOM)/2);
    let sumClear=0,sumDust=0,affected=0;
    for(const sn of sensors){
      state.dust=false;const clear=cascadeLight(pos,100,0,sn).mu;
      state.dust=true;const dusty=cascadeLight(pos,100,0,sn).mu;
      assert.ok(dusty<=clear+1e-12);
      if(dusty<clear*0.99)affected++;
      sumClear+=clear;sumDust+=dusty;
    }
    assert.ok(affected>0 && sumDust<sumClear*0.8);
  }`);
});
const geometryText=html.match(/^const GEO = (.+);$/m)[1];
console.log(JSON.stringify({checks,settings:640,geometrySHA256:crypto.createHash('sha256').update(geometryText).digest('hex'),uiRenderingVerified:false},null,2));
