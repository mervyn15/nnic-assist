import {cappiChecklist, type GuideChartId} from './lib/guided';

export function GuidedChart({chart}:{chart:GuideChartId}) {
  if(chart!=='cappi-checklist') return null;
  const maximum=Math.max(...cappiChecklist.map(group=>group.items.length));
  return <figure style={{margin:'18px 0',maxWidth:520,padding:'16px 18px',border:'1px solid #ddd',borderRadius:14,background:'#fff',color:'#222'}}>
    <figcaption style={{fontSize:15,fontWeight:600,marginBottom:14}}>CAPPI coordination checklist</figcaption>
    <table aria-label="Checklist items by topic" style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
      <thead><tr><th scope="col" style={{textAlign:'left',fontSize:12,color:'#555'}}>Topic</th><th scope="col" style={{textAlign:'right',fontSize:12,color:'#555'}}>Items</th></tr></thead>
      <tbody>{cappiChecklist.map(group=><tr key={group.label}>
        <th scope="row" style={{width:'35%',padding:'7px 10px 7px 0',textAlign:'left',fontWeight:400}}>{group.label}</th>
        <td style={{padding:'7px 0'}}><div style={{display:'flex',alignItems:'center',gap:12}}>
          <div aria-hidden="true" style={{flex:1,height:12,background:'#f1f1f1',borderRadius:3}}>
            <div style={{width:(100*group.items.length/maximum)+'%',height:'100%',borderRadius:3,background:'#424b54'}}/>
          </div>
          <span style={{minWidth:'1ch',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{group.items.length}</span>
        </div></td>
      </tr>)}</tbody>
    </table>
    <details style={{fontSize:12,lineHeight:1.65,color:'#555',marginTop:12}}>
      <summary style={{cursor:'pointer'}}>What was counted?</summary>
      <ul style={{paddingLeft:20,margin:'8px 0 0'}}>{cappiChecklist.map(group=><li key={group.label}><strong>{group.label}:</strong> {group.items.join(', ')}.</li>)}</ul>
    </details>
  </figure>;
}
