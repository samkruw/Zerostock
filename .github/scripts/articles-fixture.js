() => {
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
        set:async(r,v)=>{if(r.path.startsWith('movements/')&&v&&(v.note?.length>1000||v.userId!==S.firebase.auth.currentUser.uid))throw Error('PERMISSION_DENIED');write(r.path,v)},remove:async r=>write(r.path,null),
        update:async(r,v)=>write(r.path,{...read(r.path),...v}),
        runTransaction:async(r,fn)=>{const next=fn(read(r.path)==null?null:copy(read(r.path)));
            if(next===undefined)return{committed:false,snapshot:snapshot(read(r.path))};
            write(r.path,next);return{committed:true,snapshot:snapshot(next)};},
        push:()=>({key:'ui-move-'+(++sequence)}),serverTimestamp:()=>Date.now()};
    window.uiFixture={data,emit};
    openLabel=()=>{}; // The unchanged external QR renderer is outside these controller tests.
    unlock();emit();show('cartons');
}
