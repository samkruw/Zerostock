"""Exercise real UI controllers with an isolated in-memory Firebase adapter."""
import argparse
import functools
import http.server
import json
import os
from pathlib import Path
import threading
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--root',type=Path,required=True)
parser.add_argument('--screenshots',type=Path)
args=parser.parse_args()

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_): pass

fixture=r"""() => {
    const copy=x=>JSON.parse(JSON.stringify(x));
    const data={cartons:{
        K:{id:'K',article:'OLD-K',name:'Alter Karton',location:'L1',stock:100,min:0,warn:2},
        C:{id:'C',article:'CON-A',name:'Container A',kind:'container',externalRef:'CT-A',location:'L2',stock:10,min:0,warn:2},
        P:{id:'P',article:'PL-P',name:'Plate P',kind:'plate',location:'L3',stock:30,min:0,warn:2},
        Q:{id:'Q',article:'PL-Q',name:'Plate Q',kind:'plate',location:'L4',stock:20,min:0,warn:2}},
        instructions:{old:{id:'old',name:'Altes Packing',active:true,version:'1.0',materials:[{cartonId:'K',qty:2}]}},movements:{}};
    const read=p=>p.split('/').filter(Boolean).reduce((o,k)=>o?.[k],data);
    const snapshot=v=>({val:()=>v==null?null:copy(v),exists:()=>v!=null});
    function emit(){
        S.cartons=Object.values(copy(data.cartons));S.instructions=Object.values(copy(data.instructions));
        S.movements=Object.entries(copy(data.movements)).map(([id,m])=>({...m,id}));
        render();
    }
    function write(p,v){const keys=p.split('/').filter(Boolean),key=keys.pop();let target=data;
        for(const k of keys)target=target[k]??=( {} );
        if(v==null)delete target[key];else target[key]=copy(v);emit();
    }
    let sequence=0;
    S.native=false;S.connected=true;S.db={};
    S.user={uid:'ui-admin',name:'UI Test',role:'admin'};
    S.firebase={auth:{currentUser:{uid:'ui-admin',email:'local-ui@example.invalid'}},
        ref:(_,path)=>({path}),get:async r=>snapshot(read(r.path)),
        set:async(r,v)=>write(r.path,v),remove:async r=>write(r.path,null),
        update:async(r,v)=>write(r.path,{...read(r.path),...v}),
        runTransaction:async(r,fn)=>{const next=fn(read(r.path)==null?null:copy(read(r.path)));
            if(next===undefined)return{committed:false,snapshot:snapshot(read(r.path))};
            write(r.path,next);return{committed:true,snapshot:snapshot(next)};},
        push:()=>({key:'ui-move-'+(++sequence)}),serverTimestamp:()=>Date.now()};
    window.uiFixture={data,emit};
    openLabel=()=>{}; // The unchanged external QR renderer is outside these controller tests.
    unlock();emit();show('cartons');
}"""
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(args.root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'
stage='start'
try:
    with sync_playwright() as p:
        options={'headless':True}
        if os.environ.get('ZS_CHROMIUM_PATH'):options['executable_path']=os.environ['ZS_CHROMIUM_PATH']
        browser=p.chromium.launch(**options)
        for label,width,height in [('phone',393,852),('small-phone',320,760),('desktop',1440,1000)]:
            context=browser.new_context(viewport={'width':width,'height':height},locale='de-CH',service_workers='block',accept_downloads=True)
            context.route('**/*',lambda route: route.continue_() if urlsplit(route.request.url).netloc==urlsplit(base).netloc else route.abort())
            page=context.new_page();errors=[];page.on('pageerror',lambda _:errors.append(True))
            page.goto(base,wait_until='networkidle');page.locator('#authLogin.active').wait_for()
            page.evaluate(fixture)
            stage=label+':article-creation'
            assert page.evaluate("!('kind' in uiFixture.data.cartons.K)")
            page.locator('#addCarton').click()
            assert page.locator('#cKind').count()==1,'Article category control is missing'
            for field,value in [('cArticle','PL-R'),('cName','Plate R'),('cLocation','L5'),('cStock','15'),('cMin','0'),('cWarn','2'),('cExternalRef','CT-R')]:page.locator('#'+field).fill(value)
            page.locator('#cKind').select_option('plate');page.locator('#saveCarton').click()
            page.locator('#cartonModal').wait_for(state='hidden');page.evaluate('closeAll()')
            page.wait_for_timeout(220);page.evaluate('closeAll()')
            assert page.evaluate("uiFixture.data.cartons['PL-R'].kind")=='plate'
            stage=label+':filtering'
            page.locator('[data-article-filter="container"]').click()
            assert page.locator('#cartonRows tr').count()==1
            page.locator('[data-article-filter="all"]').click()
            assert page.locator('#cartonRows tr').count()==5
            stage=label+':configuration'
            page.evaluate("show('instructions')");page.locator('#addInstruction').click()
            page.locator('#iKind').select_option('container');page.locator('#iContainer').select_option('C')
            page.locator('#iName').fill('Container A Setup')
            page.locator('.matrow .matCarton').first.select_option('P');page.locator('.matrow .matQty').first.fill('4')
            page.locator('#addMaterialRow').click()
            page.locator('.matrow .matCarton').nth(1).select_option('Q');page.locator('.matrow .matQty').nth(1).fill('2')
            page.locator('#saveInstruction').click();page.locator('#instructionModal').wait_for(state='hidden')
            cfg=page.evaluate("Object.values(uiFixture.data.instructions).find(i=>i.kind==='container').id")
            page.locator('.editI[data-id="'+cfg+'"]').click()
            assert page.locator('.matrow').count()==2
            page.locator('#saveInstruction').click();page.locator('#instructionModal').wait_for(state='hidden')
            assert page.evaluate("Object.values(uiFixture.data.instructions).find(i=>i.kind==='container').materials.filter(m=>m.cartonId==='C').length")==1
            page.locator('.dupI[data-id="'+cfg+'"]').click()
            page.locator('#iName').fill('Container A Kopie');page.locator('#saveInstruction').click()
            page.locator('#instructionModal').wait_for(state='hidden')
            assert page.evaluate("Object.values(uiFixture.data.instructions).filter(i=>i.kind==='container').length")==2
            stage=label+':planner'
            before=page.evaluate('JSON.stringify(uiFixture.data.cartons)')
            page.evaluate("show('planner')");page.locator('#planInstruction').select_option(cfg);page.locator('#planQty').fill('8')
            assert '7' in page.locator('#planResult .configCapacity').inner_text()
            assert '32' in page.locator('#planResult [data-article-id="P"]').inner_text()
            assert 'Fehlt: 2' in page.locator('#planResult [data-article-id="P"]').inner_text()
            assert page.evaluate('JSON.stringify(uiFixture.data.cartons)')==before
            stage=label+':concurrent-admin-edit'
            page.evaluate("show('cartons')");page.locator('#cartonRows .editC[data-id="C"]').click()
            assert page.locator('#cKind').is_disabled()
            page.evaluate("uiFixture.data.cartons.C.stock=9;uiFixture.data.cartons.C._zsApplied={retained:{stockAfter:9}};uiFixture.emit()")
            page.locator('#cName').fill('Container A bearbeitet');page.locator('#saveCarton').click();page.locator('#cartonModal').wait_for(state='hidden')
            page.wait_for_timeout(220);page.evaluate('closeAll()')
            assert page.evaluate('uiFixture.data.cartons.C.stock')==9
            assert page.evaluate('Boolean(uiFixture.data.cartons.C._zsApplied.retained)')
            page.locator('#cartonRows .editC[data-id="C"]').click();page.locator('#cStock').fill('8')
            page.evaluate('uiFixture.data.cartons.C.stock=7;uiFixture.emit()')
            page.locator('#saveCarton').click()
            assert page.locator('#cartonModal').is_visible()
            assert page.evaluate('uiFixture.data.cartons.C.stock')==7
            assert 'Bestand' in page.locator('#toast').inner_text()
            page.evaluate('closeAll();uiFixture.data.cartons.C.stock=9;uiFixture.emit()')
            stage=label+':container-booking'
            page.locator('#cartonRows .book[data-id="C"]').click();page.locator('#bookType').select_option('out')
            page.locator('#bookQty').fill('3');page.locator('#bookPartner').fill('=SUM(1+1)');page.locator('#bookReference').fill('REF-3')
            page.evaluate("document.getElementById('confirmBook').click();document.getElementById('confirmBook').click()")
            page.locator('#bookModal').wait_for(state='hidden')
            assert page.evaluate('uiFixture.data.cartons.C.stock')==6
            assert page.evaluate('uiFixture.data.cartons.P.stock')==30
            assert page.evaluate('Object.keys(uiFixture.data.movements).length')==1
            assert page.evaluate('Object.values(uiFixture.data.movements)[0].reference')=='REF-3'
            assert page.evaluate('Object.values(uiFixture.data.movements)[0].articleKind')=='container'
            stage=label+':export'
            page.evaluate("show('exports')")
            with page.expect_download() as info:page.locator('#exportContainerMovesCsv').click()
            csv=Path(info.value.path()).read_text(encoding='utf-8-sig')
            assert "'=SUM(1+1)" in csv and 'REF-3' in csv and 'CT-A' in csv
            if args.screenshots and label!='small-phone':
                args.screenshots.mkdir(parents=True,exist_ok=True)
                for view in ['cartons','planner']:
                    page.evaluate('(view)=>{show(view);scrollTo(0,0);document.getElementById("toast")?.classList.remove("show")}',view)
                    page.screenshot(path=str(args.screenshots/f'{label}-{view}.png'),full_page=True)
            stage=label+':customer-privacy'
            page.evaluate("""() => {
                S.user={uid:'ui-customer',name:'Kunde',role:'customer'};
                S.cartons=[];S.movements=[];
                S.customerSummary=Object.fromEntries(S.instructions.map(i=>[i.id,{capacity:7}]));
                render();show('planner');
            }""")
            page.locator('#planInstruction').select_option(cfg);page.locator('#planQty').fill('8')
            text=page.locator('#planResult').inner_text()
            assert 'CT-A' not in text and 'Plate P' not in text and '30' not in text
            page.evaluate("show('exports')");assert not page.locator('#exportsView').is_visible()
            assert not errors,'Unhandled app error in UI flow'
            context.close()
        browser.close()
    print('::notice::Article UI passed: phone, small phone and desktop; planning, separate bookings, metadata, CSV, privacy. External traffic blocked; no production writes.')
except Exception as error:
    print(f'::error::Article UI failed at {stage}: {error}')
    raise
finally:
    server.shutdown()
