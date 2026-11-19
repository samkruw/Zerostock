"""Regression coverage for review findings, using real app controllers and isolated adapters."""
import argparse,functools,http.server,os,threading,unittest
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,required=True);args=parser.parse_args()
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(args.root)))
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/'
p=sync_playwright().start();options={'headless':True}
if os.environ.get('ZS_CHROMIUM_PATH'):options['executable_path']=os.environ['ZS_CHROMIUM_PATH']
browser=p.chromium.launch(**options)
class Regressions(unittest.TestCase):
    def setUp(self):
        self.context=browser.new_context(viewport={'width':393,'height':852},service_workers='block')
        self.context.route('**/*',lambda r:r.continue_() if urlsplit(r.request.url).netloc==urlsplit(base).netloc else r.abort())
        self.page=self.context.new_page();self.page.goto(base,wait_until='networkidle')
        self.page.locator('#authLogin.active').wait_for();self.page.evaluate(Path(__file__).with_name('articles-fixture.js').read_text())
    def tearDown(self):self.context.close()
    def test_rejected_note_never_changes_stock(self):
        result=self.page.evaluate("""async()=>{let rejected=false;try{await firebaseBook('C','out',1,'','x'.repeat(1001))}catch{rejected=true}return {rejected,stock:uiFixture.data.cartons.C.stock,moves:Object.keys(uiFixture.data.movements).length}}""")
        self.assertEqual(result,{'rejected':True,'stock':10,'moves':0})
    def test_opening_a_dialog_does_not_steal_focus_after_the_user_moves(self):
        active=self.page.evaluate("""async()=>{openBook('C');document.getElementById('bookReference').focus();await new Promise(resolve=>setTimeout(resolve,65));return document.activeElement.id}""")
        self.assertEqual(active,'bookReference')
    def test_interrupted_journal_is_durable_and_retries_same_id_once(self):
        result=self.page.evaluate("""async()=>{
            const original=S.firebase.set;let fail=true;
            S.firebase.set=async(r,v)=>{if(fail&&r.path.startsWith('movements/'))throw Error('TEST_NETWORK');return original(r,v)};
            const result=await firebaseBook('C','out',2,'','interrupted');
            const after=uiFixture.data.cartons.C.stock;
            fail=false;await retryWebBookings();await retryWebBookings();
            return {pending:result.pending,after,stock:uiFixture.data.cartons.C.stock,moves:Object.keys(uiFixture.data.movements).length,pendingCount:readWebBookings('ui-admin').length};
        }""")
        self.assertEqual(result,{'pending':True,'after':8,'stock':8,'moves':1,'pendingCount':0})
    def test_wrong_actor_never_applies_queued_stock(self):
        result=self.page.evaluate("""async()=>{S.user={uid:'employee-b',role:'employee'};S.firebase.auth.currentUser.uid='employee-b';let rejected=false;try{await syncOneMovement({id:'queued-a',userId:'employee-a',userName:'A',cartonId:'C',article:'CON-A',type:'out',qty:2,ts:1})}catch{rejected=true}return {rejected,stock:uiFixture.data.cartons.C.stock}}""")
        self.assertEqual(result,{'rejected':True,'stock':10})
    def test_account_switch_during_sync_retries_for_original_user_without_second_debit(self):
        result=self.page.evaluate("""async()=>{
            const user={...S.user},move={id:'switch-mid-sync',userId:user.uid,userName:user.name,cartonId:'C',article:'CON-A',type:'out',qty:2,ts:1};
            let state='pending';S.native=true;S.offlineReady=true;
            window.ZeroStockOffline={getSyncBatch:async(_,uid)=>uid===user.uid&&state!=='conflict'&&state!=='synced'?[move]:[],
                markSyncing:async()=>{},markRetry:async()=>{state='retry'},markConflict:async()=>{state='conflict'},markSynced:async()=>{state='synced'},
                stats:async()=>({pending:state==='synced'?0:1,conflicts:state==='conflict'?1:0}),
                getCartons:async()=>Object.values(uiFixture.data.cartons),getInstructions:async()=>Object.values(uiFixture.data.instructions),getMovements:async()=>[]};
            const transaction=S.firebase.runTransaction;
            S.firebase.runTransaction=async(...args)=>{const result=await transaction(...args);S.user={uid:'other-user',role:'employee'};S.firebase.auth.currentUser.uid='other-user';S.connected=false;return result};
            await runSyncEngine();
            S.firebase.runTransaction=transaction;S.user=user;S.firebase.auth.currentUser.uid=user.uid;S.connected=true;
            await runSyncEngine();return {state,stock:uiFixture.data.cartons.C.stock,moves:Object.keys(uiFixture.data.movements).length};
        }""")
        self.assertEqual(result,{'state':'synced','stock':8,'moves':1})
    def test_existing_article_number_cannot_be_renamed_to_another_record(self):
        self.page.evaluate("openCarton('C');document.getElementById('cArticle').value='PL-P'")
        self.page.locator('#saveCarton').click()
        self.assertEqual(self.page.evaluate('uiFixture.data.cartons.C.article'),'CON-A')
        self.assertTrue(self.page.locator('#cartonModal').is_visible())
    def test_cached_customer_session_does_not_load_employee_inventory(self):
        result=self.page.evaluate("""async()=>{
            const cache=JSON.parse(JSON.stringify(uiFixture.data.cartons));let privateReads=0;
            S.native=true;S.offlineReady=true;
            window.ZeroStockOffline={getCachedUser:async()=>({name:'Customer',role:'customer',active:true,cachedAt:Date.now()}),
                getCartons:async()=>{privateReads++;return Object.values(cache)},getMovements:async()=>{privateReads++;return [{id:'private',article:'CONFIDENTIAL',qty:99,type:'out',userName:'PRIVATE PARTNER'}]},getInstructions:async()=>[],stats:async()=>({pending:0})};
            await startOfflineSession({uid:'customer'});show('dashboard');renderMobileHome();
            return {privateReads,cartons:S.cartons.length,movements:S.movements.length,view:currentView(),recent:document.getElementById('mobileRecentMoves').textContent};
        }""")
        self.assertEqual(result['privateReads'],0);self.assertEqual(result['cartons'],0);self.assertEqual(result['movements'],0)
        self.assertEqual(result['view'],'planner');self.assertNotIn('CONFIDENTIAL',result['recent'])
try:
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Regressions))
finally:browser.close();p.stop();server.shutdown()
raise SystemExit(0 if result.wasSuccessful() else 1)
