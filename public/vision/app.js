import {suggestMeterReadings,reviewMeterUsage} from './meter-review.js';
const fileInput=document.querySelector('#file');const preview=document.querySelector('#preview');const placeholder=document.querySelector('#placeholder');const output=document.querySelector('#output');const status=document.querySelector('#status');const analyze=document.querySelector('#analyze');const cancel=document.querySelector('#cancel');const copy=document.querySelector('#copy');const selection=document.querySelector('#mode');const runtime=document.querySelector('#runtime');
let selected=null,previewUrl=null,worker=null,busy=false;
function tell(message){status.textContent=message;}
function resetWorker(){worker?.terminate();worker=null;busy=false;analyze.disabled=!selected;cancel.hidden=true;}
async function prepareImage(file){const bitmap=await createImageBitmap(file);const limit=selection.value==='ocr'?1800:1280;const scale=Math.min(1,limit/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas is unavailable on this device.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/jpeg',0.88);}
fileInput.addEventListener('change',()=>{resetWorker();selected=fileInput.files?.[0]??null;output.textContent='';copy.disabled=true;if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;if(selected){if(!/^image\/(jpeg|png|webp)$/.test(selected.type)||selected.size>10*1024*1024){selected=null;fileInput.value='';tell('Choose a JPEG, PNG, or WebP image up to 10 MB.');}else{previewUrl=URL.createObjectURL(selected);preview.src=previewUrl;preview.hidden=false;placeholder.hidden=true;tell('Image ready. Analysis starts only when you select Analyze.');}}if(!selected){preview.hidden=true;placeholder.hidden=false;}analyze.disabled=!selected;});
async function resolveDevice(){if(!navigator.gpu?.requestAdapter)return 'wasm';try{const adapter=await navigator.gpu.requestAdapter({powerPreference:'low-power'});return adapter?.features?.has('shader-f16')?'webgpu':'wasm';}catch{return 'wasm';}}
analyze.addEventListener('click',async()=>{if(!selected||busy)return;busy=true;analyze.disabled=true;cancel.hidden=false;output.textContent='';copy.disabled=true;tell('Preparing image in your browser…');try{const image=await prepareImage(selected);const device=runtime.value==='auto'?await resolveDevice():runtime.value;let triedCpu=false;worker=new Worker('./model-worker.js',{type:'module'});worker.onmessage=({data})=>{if(data.type==='progress')tell(data.message);if(data.type==='result'){output.textContent=data.text;copy.disabled=false;updateMeterCandidates(data.text);tell('Completed on your device. Review against the original image.');busy=false;analyze.disabled=false;cancel.hidden=true;}if(data.type==='error'){if(device==='webgpu'&&runtime.value==='auto'&&!triedCpu){triedCpu=true;tell('WebGPU inference failed. Retrying on CPU…');worker.postMessage({type:'analyze',image,mode:selection.value,device:'wasm'});return;}tell('Unable to run local vision: '+data.message+' Try CPU mode or a smaller image.');resetWorker();}};worker.onerror=()=>{tell('Local model worker failed to load. Check model-network access and browser support.');resetWorker();};worker.postMessage({type:'analyze',image,mode:selection.value,device});}catch(error){tell(error instanceof Error?error.message:String(error));resetWorker();}});
cancel.addEventListener('click',()=>{resetWorker();tell('Analysis cancelled. No image was uploaded.');});
copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.textContent||'');tell('Copied. Review before using the text in the app.');}catch{tell('Clipboard permission was denied. Select the output text to copy it.');}});
window.addEventListener('pagehide',()=>{worker?.terminate();if(previewUrl)URL.revokeObjectURL(previewUrl);});
async function offline(){if(!('serviceWorker' in navigator)||!isSecureContext){document.querySelector('#offline').textContent='Offline caching requires HTTPS and service workers.';return;}try{await navigator.serviceWorker.register('./sw.js',{scope:'./'});if(!navigator.serviceWorker.controller?.scriptURL?.endsWith('/vision/sw.js')){document.querySelector('#offline').textContent='Offline shell installed. Reopen this page before downloading the model to enable model caching.';}else document.querySelector('#offline').textContent='Offline cache active. Once model files finish downloading they may be available offline, subject to device storage limits.';}catch{document.querySelector('#offline').textContent='Offline caching unavailable in this browser. Local inference can still be attempted online.';}}
void offline();
const readingInputs={previous:document.querySelector('#meter-previous'),current:document.querySelector('#meter-current')};
const suggestionBox=document.querySelector('#meter-candidates');
const meterVerified=document.querySelector('#meter-verified'),meterStatus=document.querySelector('#meter-status');
const meterReport=document.querySelector('#meter-report'),meterCopy=document.querySelector('#meter-copy');
let verifiedReport='';
function invalidateMeter(){verifiedReport='';meterVerified.checked=false;meterCopy.disabled=true;meterReport.textContent='';meterStatus.textContent='Review and confirm both readings against the original image.';}
for(const field of [...Object.values(readingInputs),document.querySelector('#meter-date'),document.querySelector('#meter-unit')])field.addEventListener('input',invalidateMeter);
meterVerified.addEventListener('change',()=>{if(!meterVerified.checked){verifiedReport='';meterCopy.disabled=true;meterReport.textContent='';}});
function updateMeterCandidates(text){
 suggestionBox.replaceChildren();
 const suggestion=suggestMeterReadings(text);
 if(!suggestion.evidence.length){suggestionBox.textContent='No clearly labeled meter readings found. Enter figures manually after reviewing the photograph.';return;}
 for(const {field,line} of suggestion.evidence){
   const container=document.createElement('div');container.className='meter-candidate';
   const evidence=document.createElement('p');evidence.textContent='Source: '+line;
   const button=document.createElement('button');button.type='button';button.className='button secondary';button.textContent='Use as '+(field==='current'?'current':'previous')+' reading';
   button.addEventListener('click',()=>{readingInputs[field].value=suggestion[field];invalidateMeter();meterStatus.textContent='Suggested figure inserted. Check it against the original photo before confirming.';});
   container.append(evidence,button);suggestionBox.append(container);
 }
}
document.querySelector('#meter-compare').addEventListener('click',()=>{
 meterCopy.disabled=true;verifiedReport='';meterReport.textContent='';
 if(!meterVerified.checked){meterStatus.textContent='First confirm both numbers match the original image.';return;}
 const result=reviewMeterUsage({previous:readingInputs.previous.value,current:readingInputs.current.value,unit:document.querySelector('#meter-unit').value,date:document.querySelector('#meter-date').value});
 if(!result.ok){meterStatus.textContent=result.message;return;}
 verifiedReport=result.report;meterReport.textContent=result.report;meterStatus.textContent='Difference calculated from the figures you confirmed. Compare against the official statement separately.';meterCopy.disabled=false;
});
meterCopy.addEventListener('click',async()=>{if(!verifiedReport)return;try{await navigator.clipboard.writeText(verifiedReport);meterStatus.textContent='Reviewed evidence summary copied. Paste it into a Billora service request if appropriate.';}catch{meterStatus.textContent='Clipboard unavailable. Select the evidence summary to copy it manually.';}});
